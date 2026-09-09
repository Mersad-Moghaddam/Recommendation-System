from __future__ import annotations

import json
from types import SimpleNamespace
from urllib.error import HTTPError

import joblib
import pytest
from fastapi import HTTPException, Request, Response
from pydantic import ValidationError
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.main import auth_me, bulk_rate, current_user, logout, register, validate_origin
from backend.movie_details import build_movie_summary, shorten_overview
from backend.schemas import Credentials, QuizIn, RatingBulkIn
from backend.services import MovieService, RatingService, RecommendationService
from database.models import Base, Movie, MovieMetadata, Rating, User
from database.search import ensure_movie_search, normalize_search_text
from scripts.enrich_movie_metadata import request_json, upsert_metadata


@pytest.fixture()
def product_db(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    with factory() as db:
        db.add_all([
            Movie(id=1, title="خانه‌ي دوست كجاست (1987)", genres="Drama"),
            Movie(id=2, title="Toy Story (1995)", genres="Animation|Comedy"),
            Movie(id=3, title="Arrival (2016)", genres="Drama|Sci-Fi"),
        ])
        db.commit()
    ensure_movie_search(engine)
    return factory


def test_persian_fts_normalizes_arabic_variants(product_db):
    assert normalize_search_text("ي ك ١٢") == "ی ک ۱۲"
    with product_db() as db:
        results = MovieService.list(db, query="خانه دوست کجاست")
    assert [movie["id"] for movie in results] == [1]


def test_summary_prefers_persian_then_marks_english_direction():
    movie = SimpleNamespace(id=3, title="Arrival (2016)", genres="Drama|Sci-Fi")
    metadata = SimpleNamespace(
        overview_fa="یک زبان‌شناس برای ارتباط با مهمانانی ناشناخته فراخوانده می‌شود. زمان اهمیت زیادی دارد.",
        overview_en="A linguist is recruited to communicate with visitors. Time matters.",
        source="tmdb",
    )
    assert build_movie_summary(movie, metadata)["overview_locale"] == "fa"
    metadata.overview_fa = None
    english = build_movie_summary(movie, metadata)
    assert english["overview_locale"] == "en"
    assert english["overview_short"].startswith("A linguist")


def test_overview_is_two_sentences_and_at_most_240_characters():
    value = ("این جملهٔ اول معرفی فیلم است. " + "واژه " * 80 + "پایان جملهٔ دوم. جملهٔ سوم نباید بیاید.")
    result = shorten_overview(value)
    assert len(result) <= 240
    assert "جملهٔ سوم" not in result


def test_overview_keeps_a_complete_first_sentence_when_second_is_too_long():
    first = "این جملهٔ نخست کامل است."
    result = shorten_overview(f"{first} " + "واژه " * 80 + "پایان.")
    assert result == first


@pytest.mark.parametrize("moods", [
    ["cozy", "cozy"],
    ["feel_good", "emotional", "thrill"],
    ["surprise", "thoughtful"],
])
def test_mood_contract_rejects_duplicates_too_many_and_surprise_pair(moods):
    with pytest.raises(ValidationError):
        QuizIn(moods=moods)


def test_rating_upsert_is_immediately_visible_without_model_rebuild(product_db):
    with product_db() as db:
        user = User(username="viewer", password_hash="unused")
        db.add(user)
        db.commit()
        first = RatingService.upsert(db, user.id, 1, 2.0)
        second = RatingService.upsert(db, user.id, 1, 4.5)
        assert first.id == second.id
        assert db.scalar(select(func.count(Rating.id))) == 1
        assert second.value == 4.5


def test_enrichment_retries_429_retry_after():
    calls = []
    sleeps = []

    class Response:
        def __enter__(self):
            return self
        def __exit__(self, *_):
            return False
        def read(self):
            return json.dumps({"id": 862}).encode()

    def opener(_request, timeout):
        calls.append(timeout)
        if len(calls) == 1:
            raise HTTPError("url", 429, "rate limited", {"Retry-After": "2"}, None)
        return Response()

    assert request_json("https://example.test", "token", opener=opener, sleeper=sleeps.append) == {"id": 862}
    assert sleeps == [2.0]


def test_enrichment_upsert_is_idempotent(product_db):
    payload = {
        "overview_fa": "خلاصه",
        "overview_en": "Overview",
        "keywords": ["friendship"],
        "original_language": "fa",
        "countries": ["IR"],
        "runtime_minutes": 90,
    }
    with product_db() as db:
        upsert_metadata(db, movie_id=1, tmdb_id=10, imdb_id="tt0000010", payload=payload)
        db.commit()
        upsert_metadata(db, movie_id=1, tmdb_id=10, imdb_id="tt0000010", payload=payload)
        db.commit()
        assert db.scalar(select(func.count(MovieMetadata.movie_id))) == 1


def test_stale_artifact_is_rebuilt(product_db, tmp_path, monkeypatch):
    from backend import services

    artifact = tmp_path / "stale.joblib"
    joblib.dump({"version": 0}, artifact)
    with product_db() as db:
        dataset_user = User(username="dataset", password_hash="x", is_dataset_user=True)
        db.add(dataset_user)
        db.flush()
        db.add_all([
            Rating(user_id=dataset_user.id, movie_id=1, value=4.0),
            Rating(user_id=dataset_user.id, movie_id=2, value=5.0),
        ])
        db.commit()
        monkeypatch.setattr(services, "settings", SimpleNamespace(
            model_artifact=artifact, environment="development", cold_start_ratings=3,
        ))
        RecommendationService._cached_engine = None
        RecommendationService._cached_signature = None
        model = RecommendationService.engine(db)
    assert model.ARTIFACT_VERSION == joblib.load(artifact)["version"]


def test_cookie_auth_guard_bulk_onboarding_and_logout(product_db):
    scope = {
        "type": "http",
        "scheme": "http",
        "server": ("testserver", 80),
        "path": "/api/auth/register",
        "query_string": b"",
        "headers": [],
    }
    request = Request(scope)
    with product_db() as db:
        with pytest.raises(HTTPException) as missing_origin:
            validate_origin(request, None)
        assert missing_origin.value.status_code == 403
        validate_origin(request, "http://testserver")
        with pytest.raises(HTTPException) as guest:
            current_user(request, db)
        assert guest.value.status_code == 401
        assert auth_me(None, db) == {"user": None, "onboarding_required": False}

        response = Response()
        registered = register(Credentials(username="newviewer", password="secret12"), response, db)
        assert registered["onboarding_required"] is True
        cookie = response.headers["set-cookie"].lower()
        assert "httponly" in cookie and "samesite=strict" in cookie and "path=/" in cookie
        user = registered["user"]
        bulk = bulk_rate(
            RatingBulkIn(ratings=[
                {"movie_id": 1, "rating": 4},
                {"movie_id": 2, "rating": 5},
                {"movie_id": 3, "rating": 4.5},
            ]),
            user,
            db,
        )
        assert bulk["onboarding_complete"] is True
        assert auth_me(user, db)["onboarding_required"] is False
        logout_response = Response()
        logout(logout_response)
        assert "max-age=0" in logout_response.headers["set-cookie"].lower()
