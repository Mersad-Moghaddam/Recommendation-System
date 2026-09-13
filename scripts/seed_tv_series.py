"""Seed a large, resumable TV-series catalog from TMDB.

The discover endpoint yields 20 titles per page. The default run partitions
requests by first-air year, avoiding a single-query result cap and importing
the broadest catalog TMDB makes discoverable. Existing rows are updated, never
duplicated, so an interrupted run can safely be started again.

    TMDB_READ_TOKEN=... python scripts/seed_tv_series.py
"""

from __future__ import annotations

import argparse
from datetime import date, datetime, timezone
from pathlib import Path
import sys
from urllib.parse import urlencode

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select

from backend.constants import SERIAL_ID_START
from config import settings
from database.database import SessionLocal, create_tables
from database.models import Movie, MovieMetadata
from database.search import rebuild_movie_search
from scripts.enrich_movie_metadata import request_json

TMDB_API = "https://api.themoviedb.org/3"
MAX_DISCOVER_PAGES = 500
TMDB_GENRES = {
    10759: "Action|Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Children", 10762: "Children",
    9648: "Mystery", 10763: "Documentary", 10764: "Documentary",
    10765: "Fantasy|Sci-Fi", 10766: "Drama", 10767: "Comedy",
    10768: "War", 37: "Western",
}


def series_movie_id(tmdb_id: int) -> int:
    """Keep TMDB TV IDs disjoint from MovieLens and hand-curated movies."""
    return SERIAL_ID_START + tmdb_id


def genres_text(genre_ids: list[int]) -> str:
    values: list[str] = []
    for genre_id in genre_ids:
        for genre in TMDB_GENRES.get(genre_id, "").split("|"):
            if genre and genre not in values:
                values.append(genre)
    return "|".join(values) or "(no genres listed)"


def discover_page(page: int, token: str, year: int | None = None, fetch=request_json) -> dict:
    params = {
        "language": "en-US",
        "sort_by": "popularity.desc",
        "include_adult": "false",
        "include_null_first_air_dates": "false",
        "page": page,
    }
    if year is not None:
        params["first_air_date_year"] = year
    query = urlencode(params)
    return fetch(f"{TMDB_API}/discover/tv?{query}", token) or {"results": [], "total_pages": 0}


def series_details(tmdb_id: int, token: str, english_seed: dict, fetch=request_json) -> dict | None:
    query = urlencode({"language": "fa-IR", "append_to_response": "external_ids,keywords"})
    details = fetch(f"{TMDB_API}/tv/{tmdb_id}?{query}", token)
    if details is None:
        return None
    first_air = details.get("first_air_date") or english_seed.get("first_air_date") or ""
    year = first_air[:4] if len(first_air) >= 4 else ""
    display_name = english_seed.get("name") or details.get("original_name") or details.get("name") or f"Series {tmdb_id}"
    title = f"{display_name} ({year})" if year else display_name
    countries = details.get("origin_country") or english_seed.get("origin_country") or []
    runtimes = details.get("episode_run_time") or []
    external_ids = details.get("external_ids") or {}
    keyword_data = details.get("keywords") or {}
    return {
        "title": title,
        "genres": genres_text(english_seed.get("genre_ids") or [item.get("id") for item in details.get("genres", [])]),
        "total_seasons": details.get("number_of_seasons"),
        "total_episodes": details.get("number_of_episodes"),
        "imdb_id": external_ids.get("imdb_id"),
        "overview_fa": (details.get("overview") or "").strip() or None,
        "overview_en": (english_seed.get("overview") or "").strip() or None,
        "keywords": [item["name"] for item in keyword_data.get("results", []) if item.get("name")],
        "original_language": details.get("original_language") or english_seed.get("original_language"),
        "countries": countries,
        "runtime_minutes": runtimes[0] if runtimes else None,
    }


def upsert_series(db, tmdb_id: int, payload: dict) -> None:
    movie_id = series_movie_id(tmdb_id)
    movie = db.get(Movie, movie_id) or Movie(id=movie_id)
    movie.title = payload["title"]
    movie.genres = payload["genres"]
    movie.media_type = "serial"
    movie.total_seasons = payload["total_seasons"]
    movie.total_episodes = payload["total_episodes"]
    db.add(movie)
    db.merge(MovieMetadata(
        movie_id=movie_id,
        # MovieMetadata predates media types and has a unique TMDB integer.
        # Negative TV IDs preserve that constraint while remaining reversible.
        tmdb_id=-tmdb_id,
        imdb_id=payload["imdb_id"],
        overview_fa=payload["overview_fa"],
        overview_en=payload["overview_en"],
        keywords=payload["keywords"],
        original_language=payload["original_language"],
        countries=payload["countries"],
        runtime_minutes=payload["runtime_minutes"],
        source="tmdb_tv",
        updated_at=datetime.now(timezone.utc),
    ))


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the broadest discoverable TV catalog from TMDB")
    parser.add_argument("--pages", type=int, default=MAX_DISCOVER_PAGES, help="pages per year (1-500, 20 titles each)")
    parser.add_argument("--start-year", type=int, default=1900)
    parser.add_argument("--end-year", type=int, default=date.today().year)
    parser.add_argument("--popular-only", action="store_true", help="use one popularity query instead of year partitions")
    parser.add_argument("--limit", type=int, default=0, help="maximum series; zero uses every result")
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--force", action="store_true", help="refresh already complete series")
    args = parser.parse_args()
    if not settings.tmdb_read_token:
        raise RuntimeError("TMDB_READ_TOKEN is required")
    if not 1 <= args.pages <= MAX_DISCOVER_PAGES:
        parser.error("--pages must be between 1 and 500")
    if args.start_year < 1800 or args.end_year < args.start_year:
        parser.error("year range is invalid")
    if args.limit < 0 or args.batch_size < 1:
        parser.error("--limit must be non-negative and --batch-size must be positive")

    create_tables()
    processed = skipped = 0
    with SessionLocal() as db:
        complete_ids = set(db.scalars(select(Movie.id).where(
            Movie.media_type == "serial", Movie.total_episodes.is_not(None)
        ))) if not args.force else set()
        years = [None] if args.popular_only else range(args.end_year, args.start_year - 1, -1)
        stop = False
        for year in years:
            for page in range(1, args.pages + 1):
                catalog = discover_page(page, settings.tmdb_read_token, year)
                results = catalog.get("results") or []
                if not results:
                    break
                for seed in results:
                    if args.limit and processed >= args.limit:
                        stop = True
                        break
                    tmdb_id = int(seed["id"])
                    if series_movie_id(tmdb_id) in complete_ids:
                        skipped += 1
                        continue
                    payload = series_details(tmdb_id, settings.tmdb_read_token, seed)
                    if payload is None:
                        continue
                    upsert_series(db, tmdb_id, payload)
                    processed += 1
                    if processed % args.batch_size == 0:
                        db.commit()
                        scope = year if year is not None else "popular"
                        print(f"series: {processed:,} added/refreshed; {skipped:,} complete; scope {scope}; page {page:,}")
                db.commit()
                if stop or page >= min(int(catalog.get("total_pages") or page), args.pages):
                    break
            if stop:
                break
        rebuild_movie_search(db)
        db.commit()
        total = int(db.scalar(select(func.count(Movie.id)).where(Movie.media_type == "serial")) or 0)
    print(f"TV seed complete: {processed:,} added/refreshed; {skipped:,} skipped; {total:,} total series")
    print("Rebuild recommendations with: python scripts/train_models.py")


if __name__ == "__main__":
    main()
