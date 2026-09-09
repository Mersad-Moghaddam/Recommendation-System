"""Create SQLite tables and seed them with the downloaded MovieLens data."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import select
from config import settings
from database.database import SessionLocal, create_tables
from database.models import Movie, Rating, User
from recommender.data import load_catalog

def main():
    movies, ratings = load_catalog(
        settings.movies_csv, settings.ratings_csv,
        settings.persian_movies_csv, settings.expanded_movies_csv,
    )
    create_tables()
    with SessionLocal() as db:
        existing_movie_ids = set(db.scalars(select(Movie.id)))
        db.add_all([Movie(id=int(r.movieId), title=r.title, genres=r.genres)
                    for r in movies.itertuples() if int(r.movieId) not in existing_movie_ids])
        db.commit()
        existing_users = set(db.scalars(select(User.id).where(User.is_dataset_user.is_(True))))
        user_ids = set(ratings.userId.astype(int))
        db.add_all([User(id=uid, username=f"movielens_{uid}", password_hash="dataset-only", is_dataset_user=True) for uid in user_ids-existing_users])
        db.commit()
        existing_ratings = set(db.execute(select(Rating.user_id, Rating.movie_id)).tuples())
        batch = []
        for row in ratings.itertuples():
            key = (int(row.userId), int(row.movieId))
            if key in existing_ratings:
                continue
            batch.append(Rating(user_id=key[0], movie_id=key[1], value=float(row.rating)))
            if len(batch) == 5000:
                db.add_all(batch); db.commit(); batch = []
        db.add_all(batch); db.commit()
    print(f"Database initialized from {len(movies):,} movies and {len(ratings):,} ratings")

if __name__ == "__main__": main()
