from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from config import settings
from database.models import Base
from database.search import ensure_movie_search

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

def create_tables() -> None:
    Base.metadata.create_all(engine)
    ensure_movie_search(engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
