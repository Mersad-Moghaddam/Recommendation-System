"""Single-origin FastAPI application for the Cinematch PWA."""

from __future__ import annotations

import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.constants import API_META, API_TAGS, DEV_ORIGIN_PATTERN, ERROR_MESSAGES, PERSIAN_MOVIE_ID_START
from backend.schemas import (
    Credentials,
    MovieDetailOut,
    MovieOut,
    QuizIn,
    RatingBulkIn,
    RatingBulkOut,
    RatingDetailOut,
    RatingIn,
    RatingOut,
    RecommendationOut,
    SessionOut,
    StatsOut,
)
from backend.security import create_token, read_token
from backend.services import MovieService, RatingService, RecommendationService, UserService
from config import settings
from database.database import SessionLocal, create_tables, get_db
from database.models import Movie, Rating, User


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    with SessionLocal() as db:
        RecommendationService.engine(db)
    yield


app = FastAPI(
    title=API_META["title"],
    description=API_META["description"],
    version="2.0.0",
    lifespan=lifespan,
)
app.add_middleware(GZipMiddleware, minimum_size=700)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=DEV_ORIGIN_PATTERN,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
api = APIRouter(prefix="/api")


@app.middleware("http")
async def cache_static_assets(request: Request, call_next):
    """Give immutable UI resources a long HTTP lifetime without caching API data."""
    response = await call_next(request)
    path = request.url.path
    cacheable = (
        path.startswith(("/assets/", "/fonts/", "/images/"))
        or path in {"/favicon.svg", "/apple-touch-icon.png", "/pwa-192x192.png", "/pwa-512x512.png", "/pwa-maskable-512x512.png"}
    )
    if request.method == "GET" and cacheable and response.status_code == 200:
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


def _set_session(response: Response, user_id: int) -> None:
    response.set_cookie(
        key=settings.session_cookie,
        value=create_token(user_id),
        max_age=settings.session_seconds,
        httponly=True,
        secure=settings.environment.lower() == "production",
        samesite="strict",
        path="/",
    )


def _session_payload(db: Session, user: User) -> dict:
    return {
        "user": user,
        "onboarding_required": UserService.onboarding_required(db, user.id),
    }


def validate_origin(request: Request, origin: str | None = Header(default=None)) -> None:
    """Reject browser mutations initiated by a different origin."""
    configured = settings.api_url.rstrip("/")
    request_origin = f"{request.url.scheme}://{request.url.netloc}".rstrip("/")
    if origin is None or (
        origin.rstrip("/") not in {configured, request_origin}
        and not re.fullmatch(DEV_ORIGIN_PATTERN, origin)
    ):
        raise HTTPException(403, ERROR_MESSAGES["invalid_origin_header"])


def optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(settings.session_cookie, "")
    if not token:
        return None
    try:
        user = db.get(User, read_token(token))
        if not user or user.is_dataset_user:
            raise ValueError
        return user
    except Exception:
        return None


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = optional_user(request, db)
    if user is None:
        raise HTTPException(401, ERROR_MESSAGES["auth_required"]) from None
    return user


def _rating_out(rating: Rating) -> dict:
    return {
        "id": rating.id,
        "user_id": rating.user_id,
        "movie_id": rating.movie_id,
        "rating": rating.value,
    }


@app.get("/health", tags=[API_TAGS["system"]])
def health():
    return {"status": "ok"}


@api.get("/stats", response_model=StatsOut, tags=[API_TAGS["system"]])
def stats(db: Session = Depends(get_db)):
    return {
        "movies": db.scalar(select(func.count(Movie.id))),
        "ratings": db.scalar(select(func.count(Rating.id))),
        "users": db.scalar(select(func.count(User.id)).where(User.is_dataset_user.is_(False))),
        "persian_movies": db.scalar(select(func.count(Movie.id)).where(Movie.id >= PERSIAN_MOVIE_ID_START)),
    }


@api.post(
    "/auth/register",
    response_model=SessionOut,
    status_code=201,
    tags=[API_TAGS["auth"]],
    dependencies=[Depends(validate_origin)],
)
def register(body: Credentials, response: Response, db: Session = Depends(get_db)):
    try:
        user = UserService.register(db, body.username, body.password)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    _set_session(response, user.id)
    return _session_payload(db, user)


@api.post(
    "/auth/login",
    response_model=SessionOut,
    tags=[API_TAGS["auth"]],
    dependencies=[Depends(validate_origin)],
)
def login(body: Credentials, response: Response, db: Session = Depends(get_db)):
    try:
        user = UserService.login(db, body.username, body.password)
    except ValueError as exc:
        raise HTTPException(401, str(exc)) from exc
    _set_session(response, user.id)
    return _session_payload(db, user)


@api.get("/auth/me", response_model=SessionOut, tags=[API_TAGS["auth"]])
def auth_me(user: User | None = Depends(optional_user), db: Session = Depends(get_db)):
    if user is None:
        return {"user": None, "onboarding_required": False}
    return _session_payload(db, user)


@api.post(
    "/auth/logout",
    status_code=204,
    tags=[API_TAGS["auth"]],
    dependencies=[Depends(validate_origin)],
)
def logout(response: Response):
    response.delete_cookie(
        settings.session_cookie,
        path="/",
        secure=settings.environment.lower() == "production",
        httponly=True,
        samesite="strict",
    )


@api.get("/movies", response_model=list[MovieOut], tags=[API_TAGS["movies"]])
def movies(
    q: str = "",
    skip: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
    persian_only: bool = False,
    genre: str = "",
    db: Session = Depends(get_db),
):
    try:
        return MovieService.list(db, q, skip, limit, persian_only, genre)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@api.get("/movies/{movie_id}", response_model=MovieOut, tags=[API_TAGS["movies"]])
def movie(movie_id: int, db: Session = Depends(get_db)):
    result = MovieService.get(db, movie_id)
    if not result:
        raise HTTPException(404, ERROR_MESSAGES["movie_not_found"])
    return result


@api.get("/movies/{movie_id}/details", response_model=MovieDetailOut, tags=[API_TAGS["movies"]])
def movie_details(movie_id: int, db: Session = Depends(get_db)):
    result = MovieService.details(db, movie_id)
    if result is None:
        raise HTTPException(404, ERROR_MESSAGES["movie_not_found"])
    return result


@api.post(
    "/ratings",
    response_model=RatingOut,
    tags=[API_TAGS["ratings"]],
    dependencies=[Depends(validate_origin)],
)
def rate(body: RatingIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        return _rating_out(RatingService.upsert(db, user.id, body.movie_id, body.rating))
    except KeyError as exc:
        raise HTTPException(404, str(exc)) from exc


@api.post(
    "/ratings/bulk",
    response_model=RatingBulkOut,
    tags=[API_TAGS["ratings"]],
    dependencies=[Depends(validate_origin)],
)
def bulk_rate(body: RatingBulkIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        ratings, complete = RatingService.bulk(
            db, user.id, [(item.movie_id, item.rating) for item in body.ratings]
        )
        return {
            "ratings": [_rating_out(rating) for rating in ratings],
            "onboarding_complete": complete,
        }
    except KeyError as exc:
        db.rollback()
        raise HTTPException(404, str(exc)) from exc


@api.get("/users/me/ratings", response_model=list[RatingDetailOut], tags=[API_TAGS["ratings"]])
def my_ratings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Rating, Movie)
        .join(Movie)
        .where(Rating.user_id == user.id)
        .order_by(Rating.created_at.desc())
    ).all()
    return [
        {
            **_rating_out(rating),
            "title": movie.title,
            "genres": movie.genres.split("|"),
        }
        for rating, movie in rows
    ]


@api.get("/onboarding/movies", response_model=list[RecommendationOut], tags=[API_TAGS["recommendations"]])
def onboarding_movies(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return RecommendationService.onboarding(db)


@api.post(
    "/onboarding/skip",
    status_code=204,
    tags=[API_TAGS["recommendations"]],
    dependencies=[Depends(validate_origin)],
)
def onboarding_skip(user: User = Depends(current_user), db: Session = Depends(get_db)):
    UserService.skip_onboarding(db, user.id)


@api.get("/recommendations/me", response_model=list[RecommendationOut], tags=[API_TAGS["recommendations"]])
def recommendations(
    mode: str = "balanced",
    n: int = Query(10, ge=1, le=50),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    try:
        return RecommendationService.recommend(db, user.id, "hybrid", n, mode)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@api.post(
    "/recommendations/quiz",
    response_model=list[RecommendationOut],
    tags=[API_TAGS["recommendations"]],
    dependencies=[Depends(validate_origin)],
)
def quiz_recommendations(body: QuizIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    try:
        return RecommendationService.quiz(
            db,
            user.id,
            moods=body.moods,
            genres=body.genres,
            era=body.era,
            discovery=body.discovery,
            n=body.n,
            origin=body.origin,
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@api.get("/movies/{movie_id}/similar", response_model=list[RecommendationOut], tags=[API_TAGS["recommendations"]])
def similar(movie_id: int, n: int = Query(8, ge=1, le=30), db: Session = Depends(get_db)):
    try:
        return RecommendationService.similar(db, movie_id, n)
    except KeyError as exc:
        raise HTTPException(404, str(exc)) from exc


app.include_router(api)

frontend_dist = Path(settings.frontend_dist)
if frontend_dist.is_dir():
    assets = frontend_dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def pwa(full_path: str):
        candidate = (frontend_dist / full_path).resolve()
        if candidate.is_file() and frontend_dist.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(frontend_dist / "index.html")
