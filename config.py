"""Small, central configuration module for the classroom project."""
from dataclasses import dataclass
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
DEFAULT_SECRET_KEY = "change-me-for-any-shared-demo"

@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{ROOT / 'movies.db'}")
    movies_csv: Path = Path(os.getenv("MOVIES_CSV", ROOT / "data/raw/movies.csv"))
    ratings_csv: Path = Path(os.getenv("RATINGS_CSV", ROOT / "data/raw/ratings.csv"))
    expanded_movies_csv: Path = Path(os.getenv("EXPANDED_MOVIES_CSV", ROOT / "data/raw/ml-32m-movies.csv"))
    persian_movies_csv: Path = ROOT / "data/persian_movies.csv"
    movie_links_csv: Path = Path(os.getenv("MOVIE_LINKS_CSV", ROOT / "data/raw/ml-32m-links.csv"))
    model_artifact: Path = Path(os.getenv("MODEL_ARTIFACT", ROOT / "data/processed/recommender-v5.joblib"))
    frontend_dist: Path = ROOT / "frontend" / "dist"
    api_url: str = os.getenv("API_URL", "http://127.0.0.1:8000")
    environment: str = os.getenv("APP_ENV", "development")
    secret_key: str = os.getenv("SECRET_KEY", DEFAULT_SECRET_KEY)
    session_cookie: str = os.getenv("SESSION_COOKIE", "cinematch_session")
    session_seconds: int = int(os.getenv("SESSION_SECONDS", 60 * 60 * 24))
    tmdb_read_token: str = os.getenv("TMDB_READ_TOKEN", "")
    default_limit: int = 10
    hybrid_alpha: float = 0.65
    cold_start_ratings: int = 3

settings = Settings()


def validate_settings(value: Settings = settings) -> None:
    """Reject deploys that would issue forgeable production sessions."""
    if value.environment.lower() == "production" and (
        value.secret_key == DEFAULT_SECRET_KEY or len(value.secret_key) < 32
    ):
        raise RuntimeError("SECRET_KEY must be a unique value of at least 32 characters in production")
