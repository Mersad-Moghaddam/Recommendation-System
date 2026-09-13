from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from database.models import Base, Movie, MovieMetadata
from scripts.seed_tv_series import genres_text, series_details, series_movie_id, upsert_series


def test_tv_genres_are_deduplicated_and_ids_are_namespaced():
    assert genres_text([10759, 18]) == "Action|Adventure|Drama"
    assert series_movie_id(1399) > 2_000_000_000


def test_tv_details_and_upsert_preserve_episode_totals():
    def fetch(_url, _token):
        return {
            "id": 1399,
            "name": "بازی تاج‌وتخت",
            "original_name": "Game of Thrones",
            "first_air_date": "2011-04-17",
            "number_of_seasons": 8,
            "number_of_episodes": 73,
            "episode_run_time": [57],
            "origin_country": ["US"],
            "overview": "روایتی حماسی.",
            "original_language": "en",
            "external_ids": {"imdb_id": "tt0944947"},
            "keywords": {"results": [{"name": "kingdom"}]},
            "genres": [{"id": 10765}],
        }

    payload = series_details(1399, "token", {
        "name": "Game of Thrones", "first_air_date": "2011-04-17",
        "genre_ids": [10765], "overview": "An epic story.",
    }, fetch=fetch)
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        upsert_series(db, 1399, payload)
        db.commit()
        movie = db.get(Movie, series_movie_id(1399))
        metadata = db.scalar(select(MovieMetadata).where(MovieMetadata.movie_id == movie.id))
        assert movie.media_type == "serial"
        assert movie.total_seasons == 8
        assert movie.total_episodes == 73
        assert metadata.tmdb_id == -1399
