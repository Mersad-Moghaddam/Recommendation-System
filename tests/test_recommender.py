import pandas as pd
from recommender import RecommendationEngine
from recommender.data import build_user_item_matrix

def sample_engine():
    movies = pd.DataFrame([
        (1,"Space One (2020)","Sci-Fi|Adventure"),(2,"Space Two (2021)","Sci-Fi|Adventure"),
        (3,"Quiet Drama (2019)","Drama"),(4,"Big Drama (2018)","Drama"),
    ], columns=["movieId","title","genres"])
    ratings = pd.DataFrame([(1,1,5.),(1,3,2.),(2,1,5.),(2,2,4.5),(2,4,1.),(3,3,5.),(3,4,4.5)], columns=["userId","movieId","rating"])
    return RecommendationEngine(movies, ratings, cold_start_ratings=2)

def test_matrix_preserves_missing_values():
    matrix = build_user_item_matrix(sample_engine().ratings)
    assert pd.isna(matrix.loc[1, 2])

def test_similar_movies_uses_genres():
    assert sample_engine().similar_movies(1, 1)[0]["movie_id"] == 2

def test_hybrid_excludes_rated_movies():
    result = sample_engine().recommend(1, "hybrid", 3)
    assert {r["movie_id"] for r in result}.isdisjoint({1,3})

def test_cold_start_uses_popularity():
    assert sample_engine().recommend(999, "hybrid", 2) == sample_engine().popular(2)

def test_invalid_method():
    try: sample_engine().recommend(1, "magic")
    except ValueError: pass
    else: raise AssertionError("invalid method should fail")

def test_preference_quiz_uses_mood_and_era():
    results = sample_engine().preference_quiz("Escape", ["Sci-Fi"], "Modern", 60, 2)
    assert results
    assert results[0]["movie_id"] in {1, 2}
    assert "escape" in results[0]["reason"]
