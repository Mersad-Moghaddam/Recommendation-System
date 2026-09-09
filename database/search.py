"""Persian-aware SQLite FTS5 index for the movie catalog."""

from __future__ import annotations

import re
import unicodedata

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

_ARABIC_TO_PERSIAN = str.maketrans({
    "ي": "ی", "ى": "ی", "ك": "ک", "ۀ": "ه", "ة": "ه",
    "٠": "۰", "١": "۱", "٢": "۲", "٣": "۳", "٤": "۴",
    "٥": "۵", "٦": "۶", "٧": "۷", "٨": "۸", "٩": "۹",
})
_TOKEN_PATTERN = re.compile(r"[^\W_]+", re.UNICODE)
SEARCH_INDEX_VERSION = 2


def normalize_search_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value or "").translate(_ARABIC_TO_PERSIAN)
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    return " ".join(normalized.casefold().split())


def fts_query(value: str, genre: str = "") -> str:
    tokens = _TOKEN_PATTERN.findall(normalize_search_text(value))
    clauses = [f'{{normalized_title overview}} : "{token}"*' for token in tokens]
    if genre:
        safe_genre = genre.replace('"', "")
        clauses.append(f'genres:"{safe_genre}"')
    return " AND ".join(clauses)


def rebuild_movie_search(target: Engine | Session) -> None:
    connection = target.connection() if isinstance(target, Session) else target.connect()
    close_connection = not isinstance(target, Session)
    transaction = connection.begin() if close_connection else None
    try:
        connection.exec_driver_sql("DELETE FROM movie_search")
        rows = connection.execute(text(
            """
            SELECT m.id, m.title, m.genres,
                   COALESCE(mm.overview_fa, mm.overview_en, '') AS overview
            FROM movies AS m
            LEFT JOIN movie_metadata AS mm ON mm.movie_id = m.id
            """
        )).all()
        payload = [
            (
                int(row.id), str(row.title), normalize_search_text(str(row.title)),
                str(row.genres), normalize_search_text(str(row.overview)),
            )
            for row in rows
        ]
        if payload:
            connection.exec_driver_sql(
                "INSERT INTO movie_search(movie_id, title, normalized_title, genres, overview) VALUES (?, ?, ?, ?, ?)",
                payload,
            )
        connection.exec_driver_sql("DELETE FROM movie_search_state")
        connection.exec_driver_sql(
            "INSERT INTO movie_search_state(version) VALUES (?)",
            (SEARCH_INDEX_VERSION,),
        )
        if transaction is not None:
            transaction.commit()
    except Exception:
        if transaction is not None:
            transaction.rollback()
        raise
    finally:
        if close_connection:
            connection.close()


def ensure_movie_search(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS movie_search_state(version INTEGER NOT NULL)"
        )
        connection.exec_driver_sql(
            """
            CREATE VIRTUAL TABLE IF NOT EXISTS movie_search USING fts5(
                movie_id UNINDEXED,
                title,
                normalized_title,
                genres,
                overview,
                tokenize='unicode61 remove_diacritics 2'
            )
            """
        )
        indexed = int(connection.exec_driver_sql("SELECT count(*) FROM movie_search").scalar_one())
        movies = int(connection.exec_driver_sql("SELECT count(*) FROM movies").scalar_one())
        version = connection.exec_driver_sql(
            "SELECT version FROM movie_search_state LIMIT 1"
        ).scalar_one_or_none()
    if indexed != movies or version != SEARCH_INDEX_VERSION:
        rebuild_movie_search(engine)
