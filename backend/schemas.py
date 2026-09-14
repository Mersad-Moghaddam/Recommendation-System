from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MoodCode = Literal[
    "feel_good", "need_laugh", "low_energy", "thrill", "thoughtful", "emotional",
    "cozy", "romantic", "inspired", "nostalgic", "escape", "surprise",
]
MediaType = Literal["movie", "serial"]
LibraryStatus = Literal["watchlist", "watching", "completed"]

class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=100)

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("نام کاربری باید دست‌کم سه نویسه داشته باشد.")
        return value

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str

class SessionOut(BaseModel):
    user: UserOut | None
    onboarding_required: bool

class MovieOut(BaseModel):
    id: int
    title: str
    display_title: str
    year: int | None
    genres: list[str]
    overview_short: str | None = None
    overview_locale: Literal["fa", "en"] | None = None
    overview_source: str = "catalog"
    media_type: MediaType = "movie"
    total_seasons: int | None = None
    total_episodes: int | None = None

class MovieDetailOut(MovieOut):
    overview: str
    experience: str
    best_for: str
    rating_average: float | None
    rating_count: int
    community_note: str
    source: str
    is_persian: bool
    data_note: str

class RatingIn(BaseModel):
    movie_id: int
    rating: float = Field(ge=0.5, le=5.0, multiple_of=0.5)

class RatingOut(RatingIn):
    id: int
    user_id: int

class RatingDetailOut(RatingOut):
    title: str
    genres: list[str]

class RatingBulkIn(BaseModel):
    ratings: list[RatingIn] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def unique_movies(self):
        ids = [rating.movie_id for rating in self.ratings]
        if len(ids) != len(set(ids)):
            raise ValueError("هر فیلم در ثبت گروهی فقط یک‌بار مجاز است.")
        return self

class RatingBulkOut(BaseModel):
    ratings: list[RatingOut]
    onboarding_complete: bool

class StatsOut(BaseModel):
    movies: int
    serials: int
    ratings: int
    users: int
    persian_movies: int

class RecommendationOut(MovieOut):
    movie_id: int
    score: float
    reason: str
    reason_sources: list[str] = Field(default_factory=list)

class QuizIn(BaseModel):
    moods: list[MoodCode] = Field(min_length=1, max_length=2)
    genres: list[str] = Field(default_factory=list, max_length=5)
    era: Literal["Any era", "Classics", "80s & 90s", "2000s", "Modern"] = "Any era"
    origin: Literal["Any", "Iranian", "International"] = "Any"
    discovery: int = Field(default=50, ge=0, le=100)
    n: int = Field(default=12, ge=1, le=30)
    media_type: MediaType = "movie"

    @model_validator(mode="after")
    def validate_moods(self):
        if len(set(self.moods)) != len(self.moods):
            raise ValueError("حس‌های تکراری مجاز نیستند.")
        if "surprise" in self.moods and len(self.moods) > 1:
            raise ValueError("گزینهٔ غافلگیرم کن باید به‌تنهایی انتخاب شود.")
        return self


class LibraryEntryIn(BaseModel):
    status: LibraryStatus
    current_season: int | None = Field(default=None, ge=1)
    current_episode: int | None = Field(default=None, ge=1)
    watched_episodes: int = Field(default=0, ge=0)


class LibraryEntryOut(MovieOut):
    entry_id: int
    movie_id: int
    status: LibraryStatus
    current_season: int | None
    current_episode: int | None
    watched_episodes: int
    remaining_episodes: int | None
    progress_percent: int
    started_at: str | None
    completed_at: str | None
    updated_at: str


class ActivityDayOut(BaseModel):
    date: str
    count: int
    level: int


class ActivitySummaryOut(BaseModel):
    days: list[ActivityDayOut]
    total_units: int
    active_days: int
    current_streak: int
    longest_streak: int


class ProfileSummaryOut(BaseModel):
    movies_watched: int
    series_watched: int
    episodes_watched: int
    watchlist_count: int
    ratings_count: int
    active_series_count: int
