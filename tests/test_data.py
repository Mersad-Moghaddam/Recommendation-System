import pandas as pd
from recommender.data import load_catalog

def test_catalog_appends_persian_movies_without_fake_ratings(tmp_path):
    movies_path = tmp_path / "movies.csv"
    ratings_path = tmp_path / "ratings.csv"
    persian_path = tmp_path / "persian.csv"
    pd.DataFrame([(1, "Movie (2000)", "Drama")], columns=["movieId", "title", "genres"]).to_csv(movies_path, index=False)
    pd.DataFrame([(1, 1, 4.0, 1)], columns=["userId", "movieId", "rating", "timestamp"]).to_csv(ratings_path, index=False)
    pd.DataFrame([(1000001, "فیلم ایرانی (2020)", "Drama")], columns=["movieId", "title", "genres"]).to_csv(persian_path, index=False)

    movies, ratings = load_catalog(movies_path, ratings_path, persian_path)

    assert set(movies.movieId) == {1, 1000001}
    assert len(ratings) == 1
    assert 1000001 not in set(ratings.movieId)
