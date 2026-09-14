from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from config import settings
from database.models import Base
from database.search import ensure_movie_search

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

def create_tables() -> None:
    Base.metadata.create_all(engine)
    # create_all does not add columns to existing SQLite databases. Keep this
    # small migration idempotent so upgrades do not require deleting user data.
    with engine.begin() as connection:
        columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(movies)")}
        additions = {
            "media_type": "VARCHAR(12) NOT NULL DEFAULT 'movie'",
            "total_seasons": "INTEGER",
            "total_episodes": "INTEGER",
        }
        for name, definition in additions.items():
            if name not in columns:
                connection.exec_driver_sql(f"ALTER TABLE movies ADD COLUMN {name} {definition}")
        connection.exec_driver_sql("CREATE INDEX IF NOT EXISTS ix_movies_media_type ON movies (media_type)")
        library_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(library_entries)")}
        if "last_progress_mutation_id" not in library_columns:
            connection.exec_driver_sql("ALTER TABLE library_entries ADD COLUMN last_progress_mutation_id VARCHAR(64)")
    ensure_movie_search(engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
