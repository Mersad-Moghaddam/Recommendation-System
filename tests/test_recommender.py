import pandas as pd
import pytest
from backend.constants import ERROR_MESSAGES, GENRE_LABELS, RECOMMENDATION_REASONS
from recommender import RecommendationEngine
from recommender.data import build_user_item_matrix

def sample_engine():
    movies = pd.DataFrame([
        (1,"Space One (2020)","Sci-Fi|Adventure"),(2,"Space Two (2021)","Sci-Fi|Adventure"),
        (3,"Quiet Drama (2019)","Drama"),(4,"Big Drama (2018)","Drama"),
        (1000001,"Iranian Sample (2020)","Drama|Mystery"),
    ], columns=["movieId","title","genres"])
    ratings = pd.DataFrame([(1,1,5.),(1,3,2.),(2,1,5.),(2,2,4.5),(2,4,1.),(3,3,5.),(3,4,4.5)], columns=["userId","movieId","rating"])
    return RecommendationEngine(movies, ratings, cold_start_ratings=2)

def test_matrix_preserves_missing_values():
    matrix = build_user_item_matrix(sample_engine().ratings)
    assert pd.isna(matrix.loc[1, 2])

def test_similar_movies_uses_genres():
    results = sample_engine().similar_movies(1, 5)
    assert [item["movie_id"] for item in results] == [2]

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
    assert RECOMMENDATION_REASONS["quiz"].split("{genres}")[0] in results[0]["reason"]
    assert GENRE_LABELS["Sci-Fi"] in results[0]["reason"]
    assert results[0]["score"] == 1.0

def test_quiz_can_limit_results_to_iranian_cinema():
    results = sample_engine().preference_quiz("Thoughtful", ["Drama"], origin="Iranian")
    assert results[0]["movie_id"] == 1000001


@pytest.mark.parametrize(("kwargs", "message_key"), [
    ({"mood": "Unknown", "genres": []}, "invalid_mood"),
    ({"mood": "Feel-good", "genres": ["Unknown"]}, "invalid_genre"),
    ({"mood": "Feel-good", "genres": [], "era": "Future"}, "invalid_era"),
    ({"mood": "Feel-good", "genres": [], "origin": "Local"}, "invalid_origin"),
    ({"mood": "Feel-good", "genres": [], "discovery": 101}, "invalid_discovery"),
])
def test_preference_quiz_validates_direct_calls(kwargs, message_key):
    with pytest.raises(ValueError, match=ERROR_MESSAGES[message_key]):
        sample_engine().preference_quiz(**kwargs)


def test_content_method_falls_back_when_user_has_no_positive_ratings():
    base = sample_engine()
    low_ratings = pd.DataFrame([(4, 1, 1.0), (4, 3, 2.0)], columns=["userId", "movieId", "rating"])
    engine = RecommendationEngine(base.movies, pd.concat([base.ratings, low_ratings]), cold_start_ratings=2)

    results = engine.recommend(4, "content", 2)

    assert results
    assert all(item["reason"] == RECOMMENDATION_REASONS["popular"] for item in results)


def test_recommend_validates_hybrid_weight_and_limit():
    engine = sample_engine()
    with pytest.raises(ValueError, match=ERROR_MESSAGES["invalid_alpha"]):
        engine.recommend(1, alpha=1.1)
    with pytest.raises(ValueError, match=ERROR_MESSAGES["invalid_limit"]):
        engine.popular(0)
