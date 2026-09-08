"""Download and import the stable MovieLens 32M movie catalog.

The small mirrored movies.csv is accepted only when it matches the checksum
published in the official GroupLens README. The 32M ratings are not imported.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import sys
from urllib.request import urlretrieve

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd
from sqlalchemy import func, select

from config import settings
from database.database import SessionLocal, create_tables
from database.models import Movie

MOVIES_URL = "https://huggingface.co/datasets/hazemessam/ml-32m/resolve/main/movies.csv?download=true"
OFFICIAL_MOVIES_MD5 = "0df90835c19151f9d819d0822e190797"
REQUIRED_COLUMNS = {"movieId", "title", "genres"}


def file_md5(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.md5(usedforsecurity=False)
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download_catalog(force: bool = False) -> Path:
    settings.expanded_movies_csv.parent.mkdir(parents=True, exist_ok=True)
    if settings.expanded_movies_csv.exists() and not force:
        print(f"Expanded catalog already exists: {settings.expanded_movies_csv}")
        return settings.expanded_movies_csv

    print("Downloading MovieLens 32M movies.csv (about 4.3 MB)...")
    partial = settings.expanded_movies_csv.with_suffix(".csv.part")
    urlretrieve(MOVIES_URL, partial)
    actual = file_md5(partial)
    if actual != OFFICIAL_MOVIES_MD5:
        partial.unlink(missing_ok=True)
        raise RuntimeError(
            f"Checksum mismatch: expected {OFFICIAL_MOVIES_MD5}, got {actual}"
        )
    partial.replace(settings.expanded_movies_csv)
    print(f"Official movies.csv checksum verified: {actual}")
    print(f"Movie catalog saved to {settings.expanded_movies_csv}")
    return settings.expanded_movies_csv


def validate_catalog(path: Path) -> pd.DataFrame:
    movies = pd.read_csv(path)
    if not REQUIRED_COLUMNS <= set(movies.columns):
        raise ValueError(f"Catalog must contain {sorted(REQUIRED_COLUMNS)}")
    movies = movies.dropna(subset=["movieId", "title", "genres"]).drop_duplicates("movieId")
    movies["movieId"] = movies.movieId.astype(int)
    if (movies.movieId >= 1_000_000).any():
        raise ValueError("MovieLens IDs overlap the reserved Iranian catalog range")
    return movies[["movieId", "title", "genres"]]


def import_movies(movies: pd.DataFrame, batch_size: int = 5000) -> tuple[int, int]:
    create_tables()
    added = 0
    with SessionLocal() as db:
        existing_ids = set(db.scalars(select(Movie.id)))
        pending: list[Movie] = []
        for row in movies.itertuples(index=False):
            movie_id = int(row.movieId)
            if movie_id in existing_ids:
                continue
            pending.append(Movie(id=movie_id, title=str(row.title), genres=str(row.genres)))
            if len(pending) >= batch_size:
                db.add_all(pending)
                db.commit()
                added += len(pending)
                pending = []
        if pending:
            db.add_all(pending)
            db.commit()
            added += len(pending)
        total = int(db.scalar(select(func.count(Movie.id))) or 0)
    return added, total


def main() -> None:
    parser = argparse.ArgumentParser(description="Expand SQLite with the MovieLens 32M movie catalog")
    parser.add_argument("--force-download", action="store_true", help="download and replace the cached catalog CSV")
    args = parser.parse_args()
    catalog_path = download_catalog(args.force_download)
    movies = validate_catalog(catalog_path)
    added, total = import_movies(movies)
    print(f"Validated {len(movies):,} MovieLens movies; added {added:,}; database total: {total:,}")
    print("The 32M ratings were not imported and no synthetic ratings were created.")


if __name__ == "__main__":
    main()
