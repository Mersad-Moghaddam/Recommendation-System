import pandas as pd
from recommender.data import load_catalog

def test_catalog_appends_persian_movies_without_fake_ratings(tmp_path):
    movies_path = tmp_path / "movies.csv"
    ratings_path = tmp_path / "ratings.csv"
    persian_path = tmp_path / "persian.csv"
    pd.DataFrame([(1, "Movie (2000)", "Drama")], columns=["movieId", "title", "genres"]).to_csv(movies_path, index=False)
    pd.DataFrame([(1, 1, 4.0, 1)], columns=["userId", "movieId", "rating", "timestamp"]).to_csv(ratings_path, index=False)
    pd.DataFrame([(1000001, "Iranian Sample (2020)", "Drama")], columns=["movieId", "title", "genres"]).to_csv(persian_path, index=False)

    movies, ratings = load_catalog(movies_path, ratings_path, persian_path)

    assert set(movies.movieId) == {1, 1000001}
    assert len(ratings) == 1
    assert 1000001 not in set(ratings.movieId)


def test_catalog_appends_expanded_movies_and_prefers_expanded_metadata(tmp_path):
    movies_path = tmp_path / "movies.csv"
    ratings_path = tmp_path / "ratings.csv"
    expanded_path = tmp_path / "expanded.csv"
    persian_path = tmp_path / "persian.csv"
    pd.DataFrame([(1, "Old title (2000)", "Drama")], columns=["movieId", "title", "genres"]).to_csv(movies_path, index=False)
    pd.DataFrame([(1, 1, 4.0)], columns=["userId", "movieId", "rating"]).to_csv(ratings_path, index=False)
    pd.DataFrame([(1, "Updated title (2000)", "Drama"), (2, "Added (2001)", "Comedy")], columns=["movieId", "title", "genres"]).to_csv(expanded_path, index=False)
    pd.DataFrame([(1000001, "Iranian Sample (2020)", "Drama")], columns=["movieId", "title", "genres"]).to_csv(persian_path, index=False)

    movies, ratings = load_catalog(movies_path, ratings_path, persian_path, expanded_path)

    assert set(movies.movieId) == {1, 2, 1000001}
    assert movies.set_index("movieId").loc[1, "title"] == "Updated title (2000)"
    assert len(ratings) == 1
