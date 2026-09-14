from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    is_dataset_user: Mapped[bool] = mapped_column(default=False)
    ratings: Mapped[list["Rating"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    library_entries: Mapped[list["LibraryEntry"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    viewing_activities: Mapped[list["ViewingActivity"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    preference: Mapped["UserPreference | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )

class Movie(Base):
    __tablename__ = "movies"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), index=True)
    genres: Mapped[str] = mapped_column(String(300), default="(no genres listed)")
    media_type: Mapped[str] = mapped_column(String(12), default="movie", index=True)
    total_seasons: Mapped[int | None] = mapped_column(Integer)
    total_episodes: Mapped[int | None] = mapped_column(Integer)
    ratings: Mapped[list["Rating"]] = relationship(back_populates="movie", cascade="all, delete-orphan")
    library_entries: Mapped[list["LibraryEntry"]] = relationship(back_populates="movie", cascade="all, delete-orphan")
    viewing_activities: Mapped[list["ViewingActivity"]] = relationship(back_populates="movie", cascade="all, delete-orphan")
    metadata_record: Mapped["MovieMetadata | None"] = relationship(
        back_populates="movie", cascade="all, delete-orphan", uselist=False
    )


class MovieMetadata(Base):
    __tablename__ = "movie_metadata"

    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"), primary_key=True)
    tmdb_id: Mapped[int | None] = mapped_column(Integer, unique=True, index=True)
    imdb_id: Mapped[str | None] = mapped_column(String(20), index=True)
    overview_fa: Mapped[str | None] = mapped_column(Text)
    overview_en: Mapped[str | None] = mapped_column(Text)
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)
    original_language: Mapped[str | None] = mapped_column(String(12))
    countries: Mapped[list[str]] = mapped_column(JSON, default=list)
    runtime_minutes: Mapped[int | None] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(30), default="tmdb")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    movie: Mapped[Movie] = relationship(back_populates="metadata_record")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    onboarding_skipped: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    user: Mapped[User] = relationship(back_populates="preference")

class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_movie"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"), index=True)
    value: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="ratings")
    movie: Mapped[Movie] = relationship(back_populates="ratings")


class LibraryEntry(Base):
    """A user's durable watchlist/watched/progress state for one title."""

    __tablename__ = "library_entries"
    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_library_movie"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="watchlist", index=True)
    current_season: Mapped[int | None] = mapped_column(Integer)
    current_episode: Mapped[int | None] = mapped_column(Integer)
    watched_episodes: Mapped[int] = mapped_column(Integer, default=0)
    last_progress_mutation_id: Mapped[str | None] = mapped_column(String(64))
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    user: Mapped[User] = relationship(back_populates="library_entries")
    movie: Mapped[Movie] = relationship(back_populates="library_entries")


class ViewingActivity(Base):
    """Daily viewing units used by the GitHub-style activity graph."""

    __tablename__ = "viewing_activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id", ondelete="CASCADE"), index=True)
    activity_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    units: Mapped[int] = mapped_column(Integer, default=1)
    media_type: Mapped[str] = mapped_column(String(12), default="movie")
    season: Mapped[int | None] = mapped_column(Integer)
    episode: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="viewing_activities")
    movie: Mapped[Movie] = relationship(back_populates="viewing_activities")
