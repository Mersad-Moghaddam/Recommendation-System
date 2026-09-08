"""Simple offline leave-one-out ranking evaluation for a classroom report."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import numpy as np
from config import settings
from recommender import RecommendationEngine
from recommender.data import load_catalog

def main(k: int = 10, users: int = 50):
    movies, ratings = load_catalog(
        settings.movies_csv, settings.ratings_csv,
        settings.persian_movies_csv, settings.expanded_movies_csv,
    )
    eligible = ratings.groupby("userId").size().loc[lambda x: x >= 10].index[:users]
    results = {name: [] for name in ("popular", "collaborative", "content", "hybrid")}
    for uid in eligible:
        user_rows = ratings[ratings.userId == uid]
        test = user_rows.sort_values("timestamp").iloc[-1]
        train = ratings.drop(test.name)
        engine = RecommendationEngine(movies, train)
        for method in results:
            predicted = {r["movie_id"] for r in engine.recommend(int(uid), method, k)}
            results[method].append(int(test.movieId) in predicted)
    print(f"Leave-one-out HitRate@{k} on {len(eligible)} users")
    for method, hits in results.items(): print(f"{method:14} {np.mean(hits):.3f}")

if __name__ == "__main__": main()
