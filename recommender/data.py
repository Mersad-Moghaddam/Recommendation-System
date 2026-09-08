"""MovieLens CSV loading and validation."""
from pathlib import Path
import pandas as pd
from backend.constants import ERROR_MESSAGES

def load_movielens(movies_path: Path | str, ratings_path: Path | str) -> tuple[pd.DataFrame, pd.DataFrame]:
    movies_path, ratings_path = Path(movies_path), Path(ratings_path)
    if not movies_path.exists() or not ratings_path.exists():
        raise FileNotFoundError(ERROR_MESSAGES["movielens_missing"])
    movies, ratings = pd.read_csv(movies_path), pd.read_csv(ratings_path)
    required_movies = {"movieId", "title", "genres"}
    required_ratings = {"userId", "movieId", "rating"}
    if not required_movies <= set(movies.columns) or not required_ratings <= set(ratings.columns):
        raise ValueError(ERROR_MESSAGES["invalid_movielens_catalog"])
    movies = movies.drop_duplicates("movieId").dropna(subset=["movieId", "title"])
    ratings = ratings.dropna(subset=["userId", "movieId", "rating"])
    ratings = ratings[ratings.rating.between(0.5, 5.0)]
    return movies, ratings

def _append_movie_catalog(movies: pd.DataFrame, path: Path | str | None,
                          error_message: str) -> pd.DataFrame:
    if not path or not Path(path).exists():
        return movies
    supplemental = pd.read_csv(path)
    required = {"movieId", "title", "genres"}
    if not required <= set(supplemental.columns):
        raise ValueError(error_message)
    combined = pd.concat([movies, supplemental[["movieId", "title", "genres"]]], ignore_index=True)
    return combined.drop_duplicates("movieId", keep="last")


def load_catalog(movies_path: Path | str, ratings_path: Path | str,
                 persian_path: Path | str | None = None,
                 expanded_path: Path | str | None = None) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load base ratings plus optional expanded and Iranian movie catalogs."""
    movies, ratings = load_movielens(movies_path, ratings_path)
    movies = _append_movie_catalog(movies, expanded_path, ERROR_MESSAGES["invalid_expanded_catalog"])
    movies = _append_movie_catalog(movies, persian_path, ERROR_MESSAGES["invalid_persian_catalog"])
    return movies, ratings

def build_user_item_matrix(ratings: pd.DataFrame) -> pd.DataFrame:
    """NaN means 'not rated'; zeros are used only inside cosine calculations."""
    return ratings.pivot_table(index="userId", columns="movieId", values="rating", aggfunc="mean")
