"""Application services for accounts, catalog search, ratings and recommendations."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import joblib
import pandas as pd
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.constants import ERROR_MESSAGES, GENRE_LABELS, PERSIAN_MOVIE_ID_START, SERIAL_ID_START
from backend.movie_details import build_movie_details, build_movie_summary
from backend.security import hash_password, verify_password
from config import settings
from database.models import LibraryEntry, Movie, MovieMetadata, Rating, User, UserPreference, ViewingActivity
from database.search import fts_query
from recommender import RecommendationEngine


def viewing_today() -> date:
    return datetime.now(ZoneInfo(settings.timezone)).date()


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
        media_type: str = "movie",
    ) -> list[dict]:
        if genre and genre not in GENRE_LABELS:
            raise ValueError(ERROR_MESSAGES["invalid_genre"])
        if media_type not in {"movie", "serial"}:
            raise ValueError(ERROR_MESSAGES["invalid_media_type"])
        stmt = select(Movie, MovieMetadata).outerjoin(MovieMetadata)
        stmt = stmt.where(Movie.media_type == media_type)
        if persian_only:
            stmt = stmt.where(
                ((Movie.id >= PERSIAN_MOVIE_ID_START) & (Movie.id < SERIAL_ID_START))
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
                "JOIN movies AS m ON m.id = CAST(movie_search.movie_id AS INTEGER) "
                "LEFT JOIN movie_metadata AS mm ON mm.movie_id = CAST(movie_search.movie_id AS INTEGER) "
                "WHERE movie_search MATCH :match "
                "AND m.media_type = :media_type "
                "AND (:persian = 0 OR CAST(movie_search.movie_id AS INTEGER) >= :persian_start "
                "AND CAST(movie_search.movie_id AS INTEGER) < :serial_start OR mm.countries LIKE '%\"IR\"%') "
                "ORDER BY bm25(movie_search) LIMIT :window OFFSET :skip"
            )
            ids = list(db.scalars(ranked_ids, {
                "match": match,
                "window": limit,
                "skip": skip,
                "persian": int(persian_only),
                "persian_start": PERSIAN_MOVIE_ID_START,
                "serial_start": SERIAL_ID_START,
                "media_type": media_type,
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
        LibraryService.upsert(db, user_id, movie_id, status="completed")
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
            LibraryService.upsert(db, user_id, rating.movie_id, status="completed")
        return ratings, completed


class LibraryService:
    STATUSES = {"watchlist", "watching", "completed"}

    @staticmethod
    def _serialize(entry: LibraryEntry, movie: Movie, metadata: MovieMetadata | None = None) -> dict:
        summary = build_movie_summary(movie, metadata)
        total = movie.total_episodes if movie.media_type == "serial" else 1
        watched = entry.watched_episodes if movie.media_type == "serial" else int(entry.status == "completed")
        remaining = max(total - watched, 0) if total is not None else None
        progress = min(round((watched / total) * 100), 100) if total else (100 if entry.status == "completed" else 0)
        return {
            **summary,
            "entry_id": entry.id,
            "movie_id": movie.id,
            "status": entry.status,
            "current_season": entry.current_season,
            "current_episode": entry.current_episode,
            "watched_episodes": watched,
            "remaining_episodes": remaining,
            "progress_percent": progress,
            "started_at": entry.started_at.isoformat() if entry.started_at else None,
            "completed_at": entry.completed_at.isoformat() if entry.completed_at else None,
            "updated_at": entry.updated_at.isoformat(),
        }

    @classmethod
    def list(cls, db: Session, user_id: int, status: str = "", media_type: str = "") -> list[dict]:
        stmt = (
            select(LibraryEntry, Movie, MovieMetadata)
            .join(Movie, LibraryEntry.movie_id == Movie.id)
            .outerjoin(MovieMetadata, MovieMetadata.movie_id == Movie.id)
            .where(LibraryEntry.user_id == user_id)
        )
        if status:
            if status not in cls.STATUSES:
                raise ValueError(ERROR_MESSAGES["invalid_library_progress"])
            stmt = stmt.where(LibraryEntry.status == status)
        if media_type:
            if media_type not in {"movie", "serial"}:
                raise ValueError(ERROR_MESSAGES["invalid_media_type"])
            stmt = stmt.where(Movie.media_type == media_type)
        rows = db.execute(stmt.order_by(LibraryEntry.updated_at.desc())).all()
        return [cls._serialize(*row) for row in rows]

    @classmethod
    def upsert(
        cls,
        db: Session,
        user_id: int,
        movie_id: int,
        *,
        status: str,
        current_season: int | None = None,
        current_episode: int | None = None,
        watched_episodes: int = 0,
    ) -> dict:
        movie = db.get(Movie, movie_id)
        if movie is None:
            raise KeyError(ERROR_MESSAGES["movie_not_found"])
        entry = db.scalar(select(LibraryEntry).where(
            LibraryEntry.user_id == user_id, LibraryEntry.movie_id == movie_id
        ))
        now = datetime.now(timezone.utc)
        previous_units = 0
        if entry:
            previous_units = entry.watched_episodes if movie.media_type == "serial" else int(entry.status == "completed")
        else:
            entry = LibraryEntry(user_id=user_id, movie_id=movie_id)
            db.add(entry)

        if movie.media_type == "movie":
            current_season = None
            current_episode = None
            watched_episodes = int(status == "completed")
        else:
            if movie.total_seasons and current_season and current_season > movie.total_seasons:
                raise ValueError(ERROR_MESSAGES["invalid_library_progress"])
            if movie.total_episodes and watched_episodes > movie.total_episodes:
                raise ValueError(ERROR_MESSAGES["invalid_library_progress"])
            if status == "completed" and movie.total_episodes:
                watched_episodes = movie.total_episodes
            if status == "watchlist":
                current_season = current_episode = None
                watched_episodes = 0

        entry.status = status
        entry.current_season = current_season
        entry.current_episode = current_episode
        entry.watched_episodes = watched_episodes
        entry.started_at = entry.started_at or (now if status != "watchlist" else None)
        entry.completed_at = now if status == "completed" else None
        entry.updated_at = now

        new_units = watched_episodes if movie.media_type == "serial" else int(status == "completed")
        delta = max(new_units - previous_units, 0)
        if delta:
            db.add(ViewingActivity(
                user_id=user_id,
                movie_id=movie_id,
                activity_date=viewing_today(),
                units=delta,
                media_type=movie.media_type,
                season=current_season,
                episode=current_episode,
            ))
        db.commit()
        db.refresh(entry)
        metadata = db.get(MovieMetadata, movie_id)
        return cls._serialize(entry, movie, metadata)

    @staticmethod
    def delete(db: Session, user_id: int, movie_id: int) -> None:
        entry = db.scalar(select(LibraryEntry).where(
            LibraryEntry.user_id == user_id, LibraryEntry.movie_id == movie_id
        ))
        if entry:
            db.delete(entry)
            db.commit()

    @staticmethod
    def activity(db: Session, user_id: int, days: int = 371) -> dict:
        today = viewing_today()
        # Align the graph to Sunday-starting weeks like GitHub. The last week is
        # intentionally partial, so the response spans 365–371 days for a year.
        sunday_index = (today.weekday() + 1) % 7
        weeks = max(days // 7, 1)
        start = today - timedelta(days=(weeks - 1) * 7 + sunday_index)
        rows = db.execute(
            select(ViewingActivity.activity_date, func.sum(ViewingActivity.units))
            .where(ViewingActivity.user_id == user_id, ViewingActivity.activity_date >= start)
            .group_by(ViewingActivity.activity_date)
        ).all()
        counts = {activity_date: int(units) for activity_date, units in rows}
        result = []
        streak = longest = 0
        for offset in range((today - start).days + 1):
            current = start + timedelta(days=offset)
            count = counts.get(current, 0)
            if count:
                streak += 1
                longest = max(longest, streak)
            else:
                streak = 0
            level = 0 if count == 0 else 1 if count == 1 else 2 if count == 2 else 3 if count <= 4 else 4
            result.append({"date": current.isoformat(), "count": count, "level": level})
        return {
            "days": result,
            "total_units": sum(counts.values()),
            "active_days": len(counts),
            "current_streak": streak,
            "longest_streak": longest,
        }


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

    @staticmethod
    def _already_viewed(db: Session, user_id: int) -> set[int]:
        return set(db.scalars(
            select(LibraryEntry.movie_id).where(
                LibraryEntry.user_id == user_id,
                LibraryEntry.status.in_(["watching", "completed"]),
            )
        ))

    @classmethod
    def recommend(cls, db: Session, user_id: int, method: str, n: int, mode: str = "balanced", media_type: str = "movie") -> list[dict]:
        records = cls.engine(db).recommend_history(cls._history(db, user_id), method, min(n * 5, 100), mode)
        viewed = cls._already_viewed(db, user_id)
        return [item for item in cls._hydrate(db, records) if item["media_type"] == media_type and item["movie_id"] not in viewed][:n]

    @classmethod
    def quiz(cls, db: Session, user_id: int, **answers) -> list[dict]:
        media_type = answers.pop("media_type", "movie")
        requested = answers.get("n", 12)
        answers["n"] = min(requested * 5, 100)
        records = cls.engine(db).preference_quiz(history=cls._history(db, user_id), **answers)
        viewed = cls._already_viewed(db, user_id)
        return [item for item in cls._hydrate(db, records) if item["media_type"] == media_type and item["movie_id"] not in viewed][:requested]

    @classmethod
    def similar(cls, db: Session, movie_id: int, n: int) -> list[dict]:
        seed = db.get(Movie, movie_id)
        if seed is None:
            raise KeyError(ERROR_MESSAGES["movie_not_found"])
        records = cls.engine(db).similar_movies(movie_id, min(n * 5, 100))
        return [item for item in cls._hydrate(db, records) if item["media_type"] == seed.media_type][:n]

    @classmethod
    def onboarding(cls, db: Session, n: int = 12) -> list[dict]:
        return cls._hydrate(db, cls.engine(db).popular(n, relevance_weight=.68))
