"""Build transparent movie details from the metadata available locally."""

from __future__ import annotations

import re

from backend.constants import GENRE_EXPERIENCES, GENRE_LABELS, MOVIE_DETAIL_COPY, PERSIAN_MOVIE_ID_START

YEAR_PATTERN = re.compile(r"\((\d{4})\)\s*$")
SENTENCE_PATTERN = re.compile(r"(?<=[.!?؟])\s+")


def split_title(title: str) -> tuple[str, int | None]:
    match = YEAR_PATTERN.search(title)
    year = int(match.group(1)) if match else None
    clean_title = YEAR_PATTERN.sub("", title).strip()
    return clean_title, year


def shorten_overview(value: str | None, limit: int = 240) -> str | None:
    """Return at most two complete-ish sentences without cutting a word."""
    if not value or not value.strip():
        return None
    clean = " ".join(value.split())
    sentences = SENTENCE_PATTERN.split(clean)
    selected: list[str] = []
    for sentence in sentences[:2]:
        candidate = " ".join([*selected, sentence]).strip()
        if len(candidate) > limit:
            break
        selected.append(sentence)
    if selected:
        return " ".join(selected)
    first = sentences[0]
    clipped = first[: limit - 1].rsplit(" ", 1)[0].rstrip("،,;؛:.- ")
    return f"{clipped}…" if clipped else f"{first[:limit - 1].rstrip()}…"


def metadata_overview(metadata) -> tuple[str | None, str | None, str]:
    if metadata is None:
        return None, None, "catalog"
    if getattr(metadata, "overview_fa", None):
        return str(metadata.overview_fa), "fa", getattr(metadata, "source", "tmdb")
    if getattr(metadata, "overview_en", None):
        return str(metadata.overview_en), "en", getattr(metadata, "source", "tmdb")
    return None, None, getattr(metadata, "source", "catalog")


def build_movie_summary(movie, metadata=None) -> dict:
    clean_title, year = split_title(movie.title)
    overview, locale, source = metadata_overview(metadata)
    return {
        "id": int(movie.id),
        "title": str(movie.title),
        "display_title": clean_title,
        "year": year,
        "genres": str(movie.genres).split("|"),
        "overview_short": shorten_overview(overview),
        "overview_locale": locale,
        "overview_source": source,
    }


def build_movie_details(movie, rating_average: float | None, rating_count: int, metadata=None) -> dict:
    clean_title, year = split_title(movie.title)
    genres = str(movie.genres).split("|")
    labels = [GENRE_LABELS.get(genre, genre) for genre in genres]
    primary_genre = next((genre for genre in genres if genre in GENRE_EXPERIENCES), None)
    experience, audience = GENRE_EXPERIENCES.get(
        primary_genre,
        (MOVIE_DETAIL_COPY["experience_default"], MOVIE_DETAIL_COPY["audience_default"]),
    )
    genre_text = MOVIE_DETAIL_COPY["list_separator"].join(labels) if labels else MOVIE_DETAIL_COPY["genres_unknown"]
    template = MOVIE_DETAIL_COPY["overview"] if year else MOVIE_DETAIL_COPY["overview_unknown_year"]
    fallback_overview = template.format(
        title=clean_title,
        experience=experience,
        genres=genre_text,
        year=year,
        audience=audience,
    )
    real_overview, locale, overview_source = metadata_overview(metadata)
    overview = real_overview or fallback_overview
    if rating_count == 0:
        community_note = MOVIE_DETAIL_COPY["no_ratings"]
    elif rating_count < 5:
        community_note = MOVIE_DETAIL_COPY["few_ratings"]
    else:
        community_note = MOVIE_DETAIL_COPY["trusted_ratings"]
    is_persian = movie.id >= PERSIAN_MOVIE_ID_START
    return {
        **build_movie_summary(movie, metadata),
        "overview": overview,
        "experience": experience,
        "best_for": audience,
        "rating_average": round(float(rating_average), 2) if rating_average is not None else None,
        "rating_count": rating_count,
        "community_note": community_note,
        "source": (MOVIE_DETAIL_COPY["source_tmdb"] if real_overview else
                   MOVIE_DETAIL_COPY["source_persian"] if is_persian else MOVIE_DETAIL_COPY["source_movielens"]),
        "is_persian": is_persian,
        "data_note": MOVIE_DETAIL_COPY["data_note"] if real_overview else MOVIE_DETAIL_COPY["data_note_fallback"],
    }
