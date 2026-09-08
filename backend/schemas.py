from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=100)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class MovieOut(BaseModel):
    id: int
    title: str
    genres: list[str]

class MovieDetailOut(MovieOut):
    display_title: str
    year: int | None
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

class StatsOut(BaseModel):
    movies: int
    ratings: int
    users: int
    persian_movies: int

class RecommendationOut(BaseModel):
    movie_id: int
    title: str
    genres: list[str]
    score: float
    reason: str

class QuizIn(BaseModel):
    mood: Literal["Feel-good", "Thrilled", "Thoughtful", "Escape", "Comfort", "Surprise me"]
    genres: list[str] = Field(default_factory=list, max_length=5)
    era: Literal["Any era", "Classics", "80s & 90s", "2000s", "Modern"] = "Any era"
    origin: Literal["Any", "Iranian", "International"] = "Any"
    discovery: int = Field(default=50, ge=0, le=100)
    n: int = Field(default=12, ge=1, le=30)
