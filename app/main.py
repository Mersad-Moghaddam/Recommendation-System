from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.constants import API_META, API_TAGS, DEV_ORIGIN_PATTERN, ERROR_MESSAGES, PERSIAN_MOVIE_ID_START
from backend.schemas import Credentials, MovieDetailOut, MovieOut, QuizIn, RatingDetailOut, RatingIn, RatingOut, RecommendationOut, StatsOut, TokenOut
from backend.security import create_token, read_token
from backend.services import MovieService, RatingService, RecommendationService, UserService
from database.database import create_tables, get_db
from database.models import Movie, Rating, User

@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    yield

app = FastAPI(title=API_META["title"], description=API_META["description"], version="1.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=DEV_ORIGIN_PATTERN,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def current_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> User:
    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer": raise ValueError
        user = db.get(User, read_token(token))
        if not user: raise ValueError
        return user
    except Exception:
        raise HTTPException(401, ERROR_MESSAGES["auth_required"])

def movie_out(movie) -> dict:
    return {"id": movie.id, "title": movie.title, "genres": movie.genres.split("|")}

@app.get("/health", tags=[API_TAGS["system"]])
def health(): return {"status": "ok"}

@app.get("/stats", response_model=StatsOut, tags=[API_TAGS["system"]])
def stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    return {
        "movies": db.scalar(select(func.count(Movie.id))),
        "ratings": db.scalar(select(func.count(Rating.id))),
        "users": db.scalar(select(func.count(User.id)).where(User.is_dataset_user.is_(False))),
        "persian_movies": db.scalar(select(func.count(Movie.id)).where(Movie.id >= PERSIAN_MOVIE_ID_START)),
    }

@app.post("/auth/register", response_model=TokenOut, status_code=201, tags=[API_TAGS["auth"]])
def register(body: Credentials, db: Session = Depends(get_db)):
    try:
        user = UserService.register(db, body.username, body.password)
        return {"access_token": create_token(user.id), "user": user}
    except ValueError as exc: raise HTTPException(409, str(exc))

@app.post("/auth/login", response_model=TokenOut, tags=[API_TAGS["auth"]])
def login(body: Credentials, db: Session = Depends(get_db)):
    try:
        user, token = UserService.login(db, body.username, body.password)
        return {"access_token": token, "user": user}
    except ValueError as exc: raise HTTPException(401, str(exc))

@app.get("/movies", response_model=list[MovieOut], tags=[API_TAGS["movies"]])
def movies(q: str = "", skip: int = 0, limit: int = Query(24, ge=1, le=100), persian_only: bool = False, genre: str = "", db: Session = Depends(get_db)):
    return [movie_out(m) for m in MovieService.list(db, q, skip, limit, persian_only, genre)]

@app.get("/movies/{movie_id}", response_model=MovieOut, tags=[API_TAGS["movies"]])
def movie(movie_id: int, db: Session = Depends(get_db)):
    result = MovieService.get(db, movie_id)
    if not result: raise HTTPException(404, ERROR_MESSAGES["movie_not_found"])
    return movie_out(result)

@app.get("/movies/{movie_id}/details", response_model=MovieDetailOut, tags=[API_TAGS["movies"]])
def movie_details(movie_id: int, db: Session = Depends(get_db)):
    result = MovieService.details(db, movie_id)
    if result is None:
        raise HTTPException(404, ERROR_MESSAGES["movie_not_found"])
    return result

@app.post("/ratings", response_model=RatingOut, tags=[API_TAGS["ratings"]])
def rate(body: RatingIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        result = RatingService.upsert(db, user.id, body.movie_id, body.rating)
        return {"id": result.id, "user_id": result.user_id, "movie_id": result.movie_id, "rating": result.value}
    except KeyError as exc: raise HTTPException(404, str(exc))

@app.get("/users/me/ratings", response_model=list[RatingDetailOut], tags=[API_TAGS["ratings"]])
def my_ratings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(select(Rating, Movie).join(Movie).where(Rating.user_id == user.id).order_by(Rating.created_at.desc())).all()
    return [{"id": r.id, "user_id": r.user_id, "movie_id": r.movie_id, "rating": r.value,
             "title": movie.title, "genres": movie.genres.split("|")} for r, movie in rows]

@app.get("/recommendations/me", response_model=list[RecommendationOut], tags=[API_TAGS["recommendations"]])
def recommendations(method: str = "hybrid", n: int = Query(10, ge=1, le=50), user: User = Depends(current_user), db: Session = Depends(get_db)):
    try: return RecommendationService.recommend(db, user.id, method, n)
    except ValueError as exc: raise HTTPException(422, str(exc))

@app.post("/recommendations/quiz", response_model=list[RecommendationOut], tags=[API_TAGS["recommendations"]])
def quiz_recommendations(body: QuizIn, db: Session = Depends(get_db)):
    """Recommend from a short mood-and-taste form; no history is required."""
    try:
        return RecommendationService.engine(db).preference_quiz(
            body.mood, body.genres, body.era, body.discovery, body.n, body.origin
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc))

@app.get("/movies/{movie_id}/similar", response_model=list[RecommendationOut], tags=[API_TAGS["recommendations"]])
def similar(movie_id: int, n: int = Query(8, ge=1, le=30), db: Session = Depends(get_db)):
    try: return RecommendationService.engine(db).similar_movies(movie_id, n)
    except KeyError as exc: raise HTTPException(404, str(exc))
