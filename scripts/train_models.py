"""Validate the data and build model structures once as a preparation check."""
from pathlib import Path
import sys, time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import settings
from recommender import RecommendationEngine
from recommender.data import load_movielens

def main():
    started = time.perf_counter()
    movies, ratings = load_movielens(settings.movies_csv, settings.ratings_csv)
    engine = RecommendationEngine(movies, ratings)
    elapsed = time.perf_counter() - started
    print(f"Prepared {len(engine.movies):,} movies and {len(engine.ratings):,} ratings in {elapsed:.2f}s")
    print("No model file is required: the API caches these structures in memory.")

if __name__ == "__main__": main()
