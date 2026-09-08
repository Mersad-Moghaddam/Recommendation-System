"""MovieLens CSV loading and validation."""
from pathlib import Path
import pandas as pd

def load_movielens(movies_path: Path | str, ratings_path: Path | str) -> tuple[pd.DataFrame, pd.DataFrame]:
    movies_path, ratings_path = Path(movies_path), Path(ratings_path)
    if not movies_path.exists() or not ratings_path.exists():
        raise FileNotFoundError("MovieLens files are missing. Run scripts/download_data.py first.")
    movies, ratings = pd.read_csv(movies_path), pd.read_csv(ratings_path)
    required_movies = {"movieId", "title", "genres"}
    required_ratings = {"userId", "movieId", "rating"}
    if not required_movies <= set(movies.columns) or not required_ratings <= set(ratings.columns):
        raise ValueError("CSV columns do not match the MovieLens format")
    movies = movies.drop_duplicates("movieId").dropna(subset=["movieId", "title"])
    ratings = ratings.dropna(subset=["userId", "movieId", "rating"])
    ratings = ratings[ratings.rating.between(0.5, 5.0)]
    return movies, ratings

def load_catalog(movies_path: Path | str, ratings_path: Path | str,
                 persian_path: Path | str | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load MovieLens and optionally append the documented Iranian catalog."""
    movies, ratings = load_movielens(movies_path, ratings_path)
    if persian_path and Path(persian_path).exists():
        supplemental = pd.read_csv(persian_path)
        required = {"movieId", "title", "genres"}
        if not required <= set(supplemental.columns):
            raise ValueError("ستون‌های کاتالوگ سینمای ایران معتبر نیستند")
        movies = pd.concat([movies, supplemental[list(required)]], ignore_index=True)
        movies = movies.drop_duplicates("movieId", keep="last")
    return movies, ratings

def build_user_item_matrix(ratings: pd.DataFrame) -> pd.DataFrame:
    """NaN means 'not rated'; zeros are used only inside cosine calculations."""
    return ratings.pivot_table(index="userId", columns="movieId", values="rating", aggfunc="mean")
