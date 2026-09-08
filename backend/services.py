import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from backend.constants import ERROR_MESSAGES, PERSIAN_MOVIE_ID_START
from backend.movie_details import build_movie_details
from backend.security import create_token, hash_password, verify_password
from database.models import Movie, Rating, User
from recommender import RecommendationEngine

class UserService:
    @staticmethod
    def register(db: Session, username: str, password: str) -> User:
        if db.scalar(select(User).where(User.username == username)):
            raise ValueError(ERROR_MESSAGES["duplicate_username"])
        user = User(username=username, password_hash=hash_password(password))
        db.add(user); db.commit(); db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, username: str, password: str) -> tuple[User, str]:
        user = db.scalar(select(User).where(User.username == username, User.is_dataset_user.is_(False)))
        if not user or not verify_password(password, user.password_hash):
            raise ValueError(ERROR_MESSAGES["invalid_credentials"])
        return user, create_token(user.id)

class MovieService:
    @staticmethod
    def list(db: Session, query: str = "", skip: int = 0, limit: int = 24,
             persian_only: bool = False, genre: str = "") -> list[Movie]:
        stmt = select(Movie)
        if query:
            stmt = stmt.where(Movie.title.ilike(f"%{query}%"))
        if persian_only:
            stmt = stmt.where(Movie.id >= PERSIAN_MOVIE_ID_START)
        if genre:
            stmt = stmt.where(Movie.genres.contains(genre))
        return list(db.scalars(stmt.order_by(Movie.title).offset(skip).limit(limit)))

    @staticmethod
    def get(db: Session, movie_id: int) -> Movie | None:
        return db.get(Movie, movie_id)

    @staticmethod
    def details(db: Session, movie_id: int) -> dict | None:
        movie = db.get(Movie, movie_id)
        if movie is None:
            return None
        average, count = db.execute(
            select(func.avg(Rating.value), func.count(Rating.id)).where(Rating.movie_id == movie_id)
        ).one()
        return build_movie_details(movie, average, int(count))

class RatingService:
    @staticmethod
    def upsert(db: Session, user_id: int, movie_id: int, value: float) -> Rating:
        if not db.get(Movie, movie_id):
            raise KeyError(ERROR_MESSAGES["movie_not_found"])
        rating = db.scalar(select(Rating).where(Rating.user_id == user_id, Rating.movie_id == movie_id))
        if rating:
            rating.value = value
        else:
            rating = Rating(user_id=user_id, movie_id=movie_id, value=value); db.add(rating)
        db.commit(); db.refresh(rating)
        return rating

class RecommendationService:
    _cached_engine = None
    _cached_signature = None

    @staticmethod
    def engine(db: Session) -> RecommendationEngine:
        rating_signature = db.execute(select(func.count(Rating.id), func.max(Rating.id), func.sum(Rating.value))).one()
        signature = (*rating_signature, db.scalar(select(func.count(Movie.id))))
        if RecommendationService._cached_engine is not None and signature == RecommendationService._cached_signature:
            return RecommendationService._cached_engine
        movies = pd.read_sql(select(Movie.id.label("movieId"), Movie.title, Movie.genres), db.connection())
        ratings = pd.read_sql(select(Rating.user_id.label("userId"), Rating.movie_id.label("movieId"), Rating.value.label("rating")), db.connection())
        RecommendationService._cached_engine = RecommendationEngine(movies, ratings)
        RecommendationService._cached_signature = signature
        return RecommendationService._cached_engine

    @classmethod
    def recommend(cls, db: Session, user_id: int, method: str, n: int):
        return cls.engine(db).recommend(user_id, method, n)
