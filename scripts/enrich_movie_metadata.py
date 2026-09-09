"""Resumable TMDB metadata enrichment for the local MovieLens catalog.

Run scripts/expand_movie_catalog.py first, set TMDB_READ_TOKEN, then execute
this script. Commits are intentionally batched so interrupted runs resume.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd
from sqlalchemy import select

from config import ROOT, settings
from database.database import SessionLocal, create_tables
from database.models import Movie, MovieMetadata
from database.search import rebuild_movie_search

OFFICIAL_LINKS_MD5 = "8f033867bcb4e6be8792b21468b4fa6e"
TMDB_API = "https://api.themoviedb.org/3"
OVERRIDES_PATH = ROOT / "data" / "metadata_overrides.json"


def file_md5(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.md5(usedforsecurity=False)
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def request_json(
    url: str,
    token: str,
    *,
    opener=urlopen,
    sleeper=time.sleep,
    max_attempts: int = 6,
) -> dict | None:
    """Fetch JSON with Retry-After support and bounded exponential backoff."""
    request = Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "Cinematch-University-Project/2.0",
        },
    )
    for attempt in range(max_attempts):
        try:
            with opener(request, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            if exc.code == 404:
                return None
            if exc.code == 429 or 500 <= exc.code < 600:
                retry_after = exc.headers.get("Retry-After")
                delay = float(retry_after) if retry_after and retry_after.isdigit() else min(30, 2 ** attempt)
                sleeper(delay)
                continue
            raise
        except URLError:
            if attempt == max_attempts - 1:
                raise
            sleeper(min(30, 2 ** attempt))
    raise RuntimeError(f"TMDB request failed after {max_attempts} attempts: {url}")


def fetch_tmdb_movie(tmdb_id: int, token: str, fetch=request_json) -> dict | None:
    common = {"append_to_response": "keywords"}
    fa = fetch(f"{TMDB_API}/movie/{tmdb_id}?{urlencode({**common, 'language': 'fa-IR'})}", token)
    if fa is None:
        return None
    en = fetch(f"{TMDB_API}/movie/{tmdb_id}?{urlencode({**common, 'language': 'en-US'})}", token) or {}
    keyword_data = en.get("keywords") or fa.get("keywords") or {}
    return {
        "overview_fa": (fa.get("overview") or "").strip() or None,
        "overview_en": (en.get("overview") or "").strip() or None,
        "keywords": [
            item["name"] for item in keyword_data.get("keywords", [])
            if isinstance(item, dict) and item.get("name")
        ],
        "original_language": en.get("original_language") or fa.get("original_language"),
        "countries": [
            item.get("iso_3166_1") or item.get("name")
            for item in (en.get("production_countries") or fa.get("production_countries") or [])
            if item.get("iso_3166_1") or item.get("name")
        ],
        "runtime_minutes": en.get("runtime") or fa.get("runtime"),
    }


def load_overrides(path: Path = OVERRIDES_PATH) -> dict[int, dict]:
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    return {int(movie_id): values for movie_id, values in raw.items()}


def validate_links(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"{path} is missing. Run: python scripts/expand_movie_catalog.py"
        )
    actual = file_md5(path)
    if actual != OFFICIAL_LINKS_MD5:
        raise RuntimeError(
            f"links.csv checksum mismatch: expected {OFFICIAL_LINKS_MD5}, got {actual}"
        )
    links = pd.read_csv(path)
    required = {"movieId", "imdbId", "tmdbId"}
    if not required <= set(links.columns):
        raise ValueError(f"links.csv must contain {sorted(required)}")
    return links.dropna(subset=["movieId", "tmdbId"]).drop_duplicates("movieId")


def upsert_metadata(db, *, movie_id: int, tmdb_id: int, imdb_id: str | None, payload: dict) -> None:
    """Idempotently store one metadata record; extracted for testing and reuse."""
    db.merge(MovieMetadata(
        movie_id=movie_id,
        tmdb_id=tmdb_id,
        imdb_id=imdb_id,
        source="tmdb",
        updated_at=datetime.now(timezone.utc),
        **payload,
    ))


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich MovieLens movies from TMDB")
    parser.add_argument("--limit", type=int, default=0, help="maximum new rows; zero means all")
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--force", action="store_true", help="refresh rows that already have metadata")
    args = parser.parse_args()
    if not settings.tmdb_read_token:
        raise RuntimeError("TMDB_READ_TOKEN is required")
    links = validate_links(settings.movie_links_csv)
    overrides = load_overrides()
    create_tables()
    processed = 0
    with SessionLocal() as db:
        movie_ids = set(db.scalars(select(Movie.id)))
        existing = set() if args.force else set(db.scalars(select(MovieMetadata.movie_id)))
        pending = links[
            links.movieId.astype(int).isin(movie_ids)
            & ~links.movieId.astype(int).isin(existing)
        ]
        if args.limit:
            pending = pending.head(args.limit)
        total = len(pending)
        for row in pending.itertuples(index=False):
            movie_id = int(row.movieId)
            tmdb_id = int(row.tmdbId)
            payload = fetch_tmdb_movie(tmdb_id, settings.tmdb_read_token)
            if payload is None:
                continue
            payload.update(overrides.get(movie_id, {}))
            imdb_id = str(int(row.imdbId)).zfill(7) if pd.notna(row.imdbId) else None
            upsert_metadata(
                db,
                movie_id=movie_id,
                tmdb_id=tmdb_id,
                imdb_id=f"tt{imdb_id}" if imdb_id else None,
                payload=payload,
            )
            processed += 1
            if processed % args.batch_size == 0:
                db.commit()
                print(f"coverage: {processed:,}/{total:,} ({processed / max(1, total):.1%})")
        db.commit()
        rebuild_movie_search(db)
        db.commit()
    print(f"Metadata enrichment complete: {processed:,}/{total:,} rows processed")
    print("Rebuild the recommender artifact with: python scripts/train_models.py")


if __name__ == "__main__":
    main()
