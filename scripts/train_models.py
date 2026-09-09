"""Build and persist the versioned recommender artifact used by the API."""
from pathlib import Path
import sys, time
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from config import settings
from backend.services import RecommendationService
from database.database import SessionLocal, create_tables

def main():
    started = time.perf_counter()
    create_tables()
    with SessionLocal() as db:
        engine = RecommendationService.engine(db, force_rebuild=True)
    elapsed = time.perf_counter() - started
    print(f"Prepared {len(engine.movies):,} movies and {len(engine.ratings):,} dataset ratings in {elapsed:.2f}s")
    print(f"Versioned artifact written to {settings.model_artifact}")

if __name__ == "__main__": main()
