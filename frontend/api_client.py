"""All frontend-to-API communication lives here."""
from typing import Any
import requests
from config import settings

class APIError(RuntimeError): pass

def _request(method: str, path: str, token: str | None = None, **kwargs) -> Any:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        response = requests.request(method, f"{settings.api_url}{path}", headers=headers, timeout=12, **kwargs)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        detail = getattr(getattr(exc, "response", None), "text", "")
        raise APIError(detail or "ارتباط با API برقرار نشد؛ FastAPI را اجرا و دوباره تلاش کنید.") from exc

def register(username: str, password: str): return _request("POST", "/auth/register", json={"username": username, "password": password})
def login(username: str, password: str): return _request("POST", "/auth/login", json={"username": username, "password": password})
def get_movies(query: str = "", persian_only: bool = False): return _request("GET", "/movies", params={"q": query, "limit": 24, "persian_only": persian_only})
def rate_movie(token: str, movie_id: int, rating: float): return _request("POST", "/ratings", token, json={"movie_id": movie_id, "rating": rating})
def recommendations(token: str, method: str = "hybrid"): return _request("GET", "/recommendations/me", token, params={"method": method})
def quiz_recommendations(mood: str, genres: list[str], era: str, discovery: int, origin: str):
    return _request("POST", "/recommendations/quiz", json={"mood": mood, "genres": genres, "era": era, "discovery": discovery, "origin": origin, "n": 12})
def similar_movies(movie_id: int): return _request("GET", f"/movies/{movie_id}/similar")
def my_ratings(token: str): return _request("GET", "/users/me/ratings", token)
