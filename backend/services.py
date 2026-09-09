"""Application services for accounts, catalog search, ratings and recommendations."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.constants import ERROR_MESSAGES, GENRE_LABELS, PERSIAN_MOVIE_ID_START
from backend.movie_details import build_movie_details, build_movie_summary
from backend.security import hash_password, verify_password
from config import settings
from database.models import Movie, MovieMetadata, Rating, User, UserPreference
from database.search import fts_query
from recommender import RecommendationEngine


class UserService:
    @staticmethod
    def register(db: Session, username: str, password: str) -> User:
        username = username.strip()
        if db.scalar(select(User).where(func.lower(User.username) == username.lower())):
            raise ValueError(ERROR_MESSAGES["duplicate_username"])
        user = User(username=username, password_hash=hash_password(password))
        user.preference = UserPreference()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, username: str, password: str) -> User:
        user = db.scalar(
            select(User).where(
                func.lower(User.username) == username.strip().lower(),
                User.is_dataset_user.is_(False),
            )
        )
        if not user or not verify_password(password, user.password_hash):
            raise ValueError(ERROR_MESSAGES["invalid_credentials"])
        return user

    @staticmethod
    def onboarding_required(db: Session, user_id: int) -> bool:
        preference = db.get(UserPreference, user_id)
        if preference and (preference.onboarding_skipped or preference.onboarding_completed_at):
            return False
        rating_count = db.scalar(select(func.count(Rating.id)).where(Rating.user_id == user_id)) or 0
        return rating_count < 3

    @staticmethod
    def skip_onboarding(db: Session, user_id: int) -> None:
        preference = db.get(UserPreference, user_id) or UserPreference(user_id=user_id)
        preference.onboarding_skipped = True
        db.add(preference)
        db.commit()


class MovieService:
    @staticmethod
    def _summaries(db: Session, stmt) -> list[dict]:
        rows = db.execute(stmt).all()
        return [build_movie_summary(movie, metadata) for movie, metadata in rows]

    @staticmethod
    def list(
        db: Session,
        query: str = "",
        skip: int = 0,
        limit: int = 24,
        persian_only: bool = False,
        genre: str = "",
    ) -> list[dict]:
        if genre and genre not in GENRE_LABELS:
            raise ValueError(ERROR_MESSAGES["invalid_genre"])
        stmt = select(Movie, MovieMetadata).outerjoin(MovieMetadata)
        if persian_only:
            stmt = stmt.where(
                (Movie.id >= PERSIAN_MOVIE_ID_START)
                | MovieMetadata.countries.contains("IR")
            )
        if genre:
            stmt = stmt.where(Movie.genres.contains(genre))
        if query or genre:
            match = fts_query(query, genre)
            if not match:
                return []
            ranked_ids = text(
                "SELECT CAST(movie_search.movie_id AS INTEGER) FROM movie_search "
                "LEFT JOIN movie_metadata AS mm ON mm.movie_id = CAST(movie_search.movie_id AS INTEGER) "
                "WHERE movie_search MATCH :match "
                "AND (:persian = 0 OR CAST(movie_search.movie_id AS INTEGER) >= :persian_start "
                "OR mm.countries LIKE '%\"IR\"%') "
                "ORDER BY bm25(movie_search) LIMIT :window OFFSET :skip"
            )
            ids = list(db.scalars(ranked_ids, {
                "match": match,
                "window": limit,
                "skip": skip,
                "persian": int(persian_only),
                "persian_start": PERSIAN_MOVIE_ID_START,
            }))
            if not ids:
                return []
            order = {movie_id: index for index, movie_id in enumerate(ids)}
            results = MovieService._summaries(db, stmt.where(Movie.id.in_(ids)))
            return sorted(results, key=lambda movie: order[movie["id"]])
        return MovieService._summaries(db, stmt.order_by(Movie.title).offset(skip).limit(limit))

    @staticmethod
    def get(db: Session, movie_id: int) -> dict | None:
        row = db.execute(
            select(Movie, MovieMetadata).outerjoin(MovieMetadata).where(Movie.id == movie_id)
        ).one_or_none()
        return build_movie_summary(*row) if row else None

    @staticmethod
    def details(db: Session, movie_id: int) -> dict | None:
        row = db.execute(
            select(Movie, MovieMetadata).outerjoin(MovieMetadata).where(Movie.id == movie_id)
        ).one_or_none()
        if row is None:
            return None
        average, count = db.execute(
            select(func.avg(Rating.value), func.count(Rating.id)).where(Rating.movie_id == movie_id)
        ).one()
        return build_movie_details(row[0], average, int(count), row[1])

    @staticmethod
    def by_ids(db: Session, movie_ids: list[int]) -> dict[int, dict]:
        if not movie_ids:
            return {}
        stmt = select(Movie, MovieMetadata).outerjoin(MovieMetadata).where(Movie.id.in_(movie_ids))
        return {
            summary["id"]: summary
            for summary in MovieService._summaries(db, stmt)
        }


class RatingService:
    @staticmethod
    def _upsert_without_commit(db: Session, user_id: int, movie_id: int, value: float) -> Rating:
        if not db.get(Movie, movie_id):
            raise KeyError(ERROR_MESSAGES["movie_not_found"])
        rating = db.scalar(
            select(Rating).where(Rating.user_id == user_id, Rating.movie_id == movie_id)
        )
        if rating:
            rating.value = value
        else:
            rating = Rating(user_id=user_id, movie_id=movie_id, value=value)
            db.add(rating)
        return rating

    @classmethod
    def upsert(cls, db: Session, user_id: int, movie_id: int, value: float) -> Rating:
        rating = cls._upsert_without_commit(db, user_id, movie_id, value)
        db.commit()
        db.refresh(rating)
        return rating

    @classmethod
    def bulk(cls, db: Session, user_id: int, values: list[tuple[int, float]]) -> tuple[list[Rating], bool]:
        ratings = [cls._upsert_without_commit(db, user_id, movie_id, value) for movie_id, value in values]
        db.flush()
        total = db.scalar(select(func.count(Rating.id)).where(Rating.user_id == user_id)) or 0
        completed = total >= 3
        if completed:
            preference = db.get(UserPreference, user_id) or UserPreference(user_id=user_id)
            preference.onboarding_skipped = False
            preference.onboarding_completed_at = datetime.now(timezone.utc)
            db.add(preference)
        db.commit()
        for rating in ratings:
            db.refresh(rating)
        return ratings, completed


class RecommendationService:
    """Load immutable global matrices once and blend in live user history per request."""

    _cached_engine: RecommendationEngine | None = None
    _cached_signature: tuple | None = None

    @staticmethod
    def _signature(db: Session) -> tuple:
        movie_signature = db.execute(select(func.count(Movie.id), func.max(Movie.id))).one()
        rating_signature = db.execute(
            select(func.count(Rating.id), func.max(Rating.id), func.sum(Rating.value))
            .join(User, Rating.user_id == User.id)
            .where(User.is_dataset_user.is_(True))
        ).one()
        metadata_signature = db.execute(
            select(func.count(MovieMetadata.movie_id), func.max(MovieMetadata.updated_at))
        ).one()
        return tuple(movie_signature) + tuple(rating_signature) + tuple(metadata_signature)

    @staticmethod
    def _frames(db: Session) -> tuple[pd.DataFrame, pd.DataFrame]:
        movies = pd.read_sql(
            select(
                Movie.id.label("movieId"), Movie.title, Movie.genres,
                func.coalesce(MovieMetadata.overview_fa, MovieMetadata.overview_en, "").label("overview"),
                MovieMetadata.keywords, MovieMetadata.original_language,
                MovieMetadata.countries, MovieMetadata.runtime_minutes,
            ).outerjoin(MovieMetadata),
            db.connection(),
        )
        ratings = pd.read_sql(
            select(
                Rating.user_id.label("userId"), Rating.movie_id.label("movieId"),
                Rating.value.label("rating"),
            )
            .join(User, Rating.user_id == User.id)
            .where(User.is_dataset_user.is_(True)),
            db.connection(),
        )
        return movies, ratings

    @classmethod
    def engine(cls, db: Session, *, force_rebuild: bool = False) -> RecommendationEngine:
        if cls._cached_engine is not None and not force_rebuild:
            return cls._cached_engine
        signature = cls._signature(db)

        artifact_path = Path(settings.model_artifact)
        if artifact_path.exists() and not force_rebuild:
            try:
                artifact = joblib.load(artifact_path)
                if (
                    artifact.get("version") == RecommendationEngine.ARTIFACT_VERSION
                    and tuple(artifact.get("signature", ())) == signature
                ):
                    cls._cached_engine = artifact["engine"]
                    cls._cached_signature = signature
                    return cls._cached_engine
            except (OSError, EOFError, ValueError, TypeError, KeyError):
                pass

        if settings.environment.lower() == "production":
            raise RuntimeError(ERROR_MESSAGES["model_unavailable"])

        movies, ratings = cls._frames(db)
        model = RecommendationEngine(movies, ratings, settings.cold_start_ratings)
        artifact_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = artifact_path.with_suffix(f"{artifact_path.suffix}.tmp")
        joblib.dump({"version": model.ARTIFACT_VERSION, "signature": signature, "engine": model}, temporary)
        temporary.replace(artifact_path)
        cls._cached_engine = model
        cls._cached_signature = signature
        return model

    @staticmethod
    def _history(db: Session, user_id: int) -> pd.DataFrame:
        return pd.read_sql(
            select(Rating.movie_id.label("movieId"), Rating.value.label("rating"))
            .where(Rating.user_id == user_id),
            db.connection(),
        )

    @staticmethod
    def _hydrate(db: Session, records: list[dict]) -> list[dict]:
        summaries = MovieService.by_ids(db, [record["movie_id"] for record in records])
        hydrated = []
        for record in records:
            summary = summaries.get(record["movie_id"])
            if summary:
                hydrated.append({**record, **summary, "movie_id": record["movie_id"]})
        return hydrated

    @classmethod
    def recommend(cls, db: Session, user_id: int, method: str, n: int, mode: str = "balanced") -> list[dict]:
        records = cls.engine(db).recommend_history(cls._history(db, user_id), method, n, mode)
        return cls._hydrate(db, records)

    @classmethod
    def quiz(cls, db: Session, user_id: int, **answers) -> list[dict]:
        records = cls.engine(db).preference_quiz(history=cls._history(db, user_id), **answers)
        return cls._hydrate(db, records)

    @classmethod
    def similar(cls, db: Session, movie_id: int, n: int) -> list[dict]:
        return cls._hydrate(db, cls.engine(db).similar_movies(movie_id, n))

    @classmethod
    def onboarding(cls, db: Session, n: int = 12) -> list[dict]:
        return cls._hydrate(db, cls.engine(db).popular(n, relevance_weight=.68))
