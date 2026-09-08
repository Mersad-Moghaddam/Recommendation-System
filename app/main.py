from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.schemas import Credentials, MovieOut, QuizIn, RatingIn, RatingOut, RecommendationOut, TokenOut
from backend.security import create_token, read_token
from backend.services import MovieService, RatingService, RecommendationService, UserService
from database.database import create_tables, get_db
from database.models import Rating, User

@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    yield

app = FastAPI(title="CineMatch API", description="An explainable MovieLens recommendation system for a university project", version="1.0.0", lifespan=lifespan)

def current_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> User:
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer": raise ValueError
        user = db.get(User, read_token(token))
        if not user: raise ValueError
        return user
    except Exception:
        raise HTTPException(401, "Valid bearer token required")

def movie_out(movie) -> dict:
    return {"id": movie.id, "title": movie.title, "genres": movie.genres.split("|")}

@app.get("/health", tags=["System"])
def health(): return {"status": "ok"}

@app.post("/auth/register", response_model=TokenOut, status_code=201, tags=["Authentication"])
def register(body: Credentials, db: Session = Depends(get_db)):
    try:
        user = UserService.register(db, body.username, body.password)
        return {"access_token": create_token(user.id), "user": user}
    except ValueError as exc: raise HTTPException(409, str(exc))

@app.post("/auth/login", response_model=TokenOut, tags=["Authentication"])
def login(body: Credentials, db: Session = Depends(get_db)):
    try:
        user, token = UserService.login(db, body.username, body.password)
        return {"access_token": token, "user": user}
    except ValueError as exc: raise HTTPException(401, str(exc))

@app.get("/movies", response_model=list[MovieOut], tags=["Movies"])
def movies(q: str = "", skip: int = 0, limit: int = Query(24, ge=1, le=100), db: Session = Depends(get_db)):
    return [movie_out(m) for m in MovieService.list(db, q, skip, limit)]

@app.get("/movies/{movie_id}", response_model=MovieOut, tags=["Movies"])
def movie(movie_id: int, db: Session = Depends(get_db)):
    result = MovieService.get(db, movie_id)
    if not result: raise HTTPException(404, "Movie not found")
    return movie_out(result)

@app.post("/ratings", response_model=RatingOut, tags=["Ratings"])
def rate(body: RatingIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        result = RatingService.upsert(db, user.id, body.movie_id, body.rating)
        return {"id": result.id, "user_id": result.user_id, "movie_id": result.movie_id, "rating": result.value}
    except KeyError as exc: raise HTTPException(404, str(exc))

@app.get("/users/me/ratings", response_model=list[RatingOut], tags=["Ratings"])
def my_ratings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Rating).where(Rating.user_id == user.id)).all()
    return [{"id": r.id, "user_id": r.user_id, "movie_id": r.movie_id, "rating": r.value} for r in rows]

@app.get("/recommendations/me", response_model=list[RecommendationOut], tags=["Recommendations"])
def recommendations(method: str = "hybrid", n: int = Query(10, ge=1, le=50), user: User = Depends(current_user), db: Session = Depends(get_db)):
    try: return RecommendationService.recommend(db, user.id, method, n)
    except ValueError as exc: raise HTTPException(422, str(exc))

@app.post("/recommendations/quiz", response_model=list[RecommendationOut], tags=["Recommendations"])
def quiz_recommendations(body: QuizIn, db: Session = Depends(get_db)):
    """Recommend from a short mood-and-taste form; no history is required."""
    try:
        return RecommendationService.engine(db).preference_quiz(
            body.mood, body.genres, body.era, body.discovery, body.n
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc))

@app.get("/movies/{movie_id}/similar", response_model=list[RecommendationOut], tags=["Recommendations"])
def similar(movie_id: int, n: int = Query(8, ge=1, le=30), db: Session = Depends(get_db)):
    try: return RecommendationService.engine(db).similar_movies(movie_id, n)
    except KeyError as exc: raise HTTPException(404, str(exc))
