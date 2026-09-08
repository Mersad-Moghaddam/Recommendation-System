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

class RatingIn(BaseModel):
    movie_id: int
    rating: float = Field(ge=0.5, le=5.0, multiple_of=0.5)

class RatingOut(RatingIn):
    id: int
    user_id: int

class RecommendationOut(BaseModel):
    movie_id: int
    title: str
    genres: list[str]
    score: float
    reason: str
