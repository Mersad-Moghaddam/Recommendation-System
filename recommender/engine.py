"""Explainable content, collaborative, popularity and hybrid recommenders."""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.constants import (
    ERROR_MESSAGES,
    GENRE_LABELS,
    PERSIAN_MOVIE_ID_START,
    RECOMMENDATION_REASONS,
    TEXT_SEPARATORS,
)
from recommender.data import build_user_item_matrix

class RecommendationEngine:
    MOOD_GENRES = {
        "Feel-good": ["Comedy", "Romance", "Animation", "Musical"],
        "Thrilled": ["Action", "Adventure", "Thriller"],
        "Thoughtful": ["Drama", "Documentary", "Mystery"],
        "Escape": ["Fantasy", "Sci-Fi", "Adventure"],
        "Comfort": ["Comedy", "Children", "Romance"],
        "Surprise me": [],
    }
    VALID_ERAS = {"Any era", "Classics", "80s & 90s", "2000s", "Modern"}
    VALID_ORIGINS = {"Any", "Iranian", "International"}

    def __init__(self, movies: pd.DataFrame, ratings: pd.DataFrame, cold_start_ratings: int = 3):
        self.movies = movies[["movieId", "title", "genres"]].drop_duplicates("movieId").copy()
        self.ratings = ratings[["userId", "movieId", "rating"]].copy()
        self.cold_start_ratings = cold_start_ratings
        self.movie_ids = self.movies.movieId.astype(int).tolist()
        self.movie_id_array = np.asarray(self.movie_ids, dtype=np.int64)
        self.id_to_position = {movie_id: i for i, movie_id in enumerate(self.movie_ids)}
        self.movie_lookup = self.movies.set_index("movieId")
        self.movie_years = self.movies.title.str.extract(r"\((\d{4})\)\s*$")[0].astype(float).to_numpy()
        genre_text = self.movies.genres.fillna("").str.replace("|", " ", regex=False)
        self.genre_vectorizer = TfidfVectorizer(token_pattern=r"[^ ]+")
        self.genre_matrix = self.genre_vectorizer.fit_transform(genre_text)
        self.user_item = build_user_item_matrix(self.ratings)
        item_matrix = self.user_item.fillna(0).T
        self.item_ids = item_matrix.index.astype(int).tolist()
        # Avoid a quadratic dense movie-by-movie matrix. Similarities are
        # calculated only for movies rated by the active user.
        raw_item_matrix = item_matrix.to_numpy(dtype=np.float32)
        norms = np.linalg.norm(raw_item_matrix, axis=1, keepdims=True)
        self.normalized_item_matrix = np.divide(
            raw_item_matrix,
            norms,
            out=np.zeros_like(raw_item_matrix),
            where=norms != 0,
        )
        self.quality_scores = self._quality_scores()

    def _quality_scores(self) -> dict[int, float]:
        if self.ratings.empty:
            return {}
        stats = self.ratings.groupby("movieId").rating.agg(["mean", "count"])
        global_mean = float(self.ratings.rating.mean())
        confidence = max(5.0, float(stats["count"].quantile(.60)))
        scores = ((stats["count"] * stats["mean"] + confidence * global_mean)
                  / (stats["count"] + confidence)).to_dict()
        return self._normalize(scores)

    @staticmethod
    def _normalize(scores: dict[int, float]) -> dict[int, float]:
        if not scores:
            return {}
        values = np.asarray(list(scores.values()), dtype=float)
        minimum = float(values.min())
        spread = float(values.max() - minimum)
        return {key: float((value - minimum) / spread) if spread else 1.0
                for key, value in scores.items()}

    def _records(self, scores: dict[int, float], n: int, reason: str) -> list[dict]:
        if n <= 0:
            raise ValueError(ERROR_MESSAGES["invalid_limit"])
        ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)[:n]
        return [{"movie_id": int(mid), "title": self.movie_lookup.loc[mid, "title"],
                 "genres": str(self.movie_lookup.loc[mid, "genres"]).split("|"),
                 "score": round(float(score), 4), "reason": reason}
                for mid, score in ranked if mid in self.movie_lookup.index]

    def popular(self, n: int = 10, exclude: set[int] | None = None) -> list[dict]:
        scores = self.quality_scores.copy()
        for mid in exclude or set():
            scores.pop(mid, None)
        return self._records(scores, n, RECOMMENDATION_REASONS["popular"])

    def _validate_quiz(self, mood: str, genres: list[str], era: str,
                       discovery: int, origin: str) -> None:
        if mood not in self.MOOD_GENRES:
            raise ValueError(ERROR_MESSAGES["invalid_mood"])
        if any(genre not in GENRE_LABELS for genre in genres):
            raise ValueError(ERROR_MESSAGES["invalid_genre"])
        if era not in self.VALID_ERAS:
            raise ValueError(ERROR_MESSAGES["invalid_era"])
        if origin not in self.VALID_ORIGINS:
            raise ValueError(ERROR_MESSAGES["invalid_origin"])
        if not 0 <= discovery <= 100:
            raise ValueError(ERROR_MESSAGES["invalid_discovery"])

    def preference_quiz(self, mood: str, genres: list[str], era: str = "Any era",
                        discovery: int = 50, n: int = 12, origin: str = "Any") -> list[dict]:
        """Rank real movies from a short preference form and rating confidence."""
        self._validate_quiz(mood, genres, era, discovery, origin)
        chosen = list(dict.fromkeys(genres + self.MOOD_GENRES[mood]))
        if not chosen:
            chosen = ["Drama", "Comedy", "Adventure", "Thriller"]
        query_vector = self.genre_vectorizer.transform([" ".join(chosen)])
        fit = cosine_similarity(query_vector, self.genre_matrix)[0]

        popular_weight = .35 * (1 - discovery / 100)

        eligible = fit > 0
        known_year = ~np.isnan(self.movie_years)
        if era == "Classics":
            eligible &= ~known_year | (self.movie_years < 1980)
        elif era == "80s & 90s":
            eligible &= ~known_year | ((self.movie_years >= 1980) & (self.movie_years < 2000))
        elif era == "2000s":
            eligible &= ~known_year | ((self.movie_years >= 2000) & (self.movie_years < 2015))
        elif era == "Modern":
            eligible &= ~known_year | (self.movie_years >= 2015)
        if origin == "Iranian":
            eligible &= self.movie_id_array >= PERSIAN_MOVIE_ID_START
        elif origin == "International":
            eligible &= self.movie_id_array < PERSIAN_MOVIE_ID_START

        positions = np.flatnonzero(eligible)
        quality = np.fromiter(
            (self.quality_scores.get(self.movie_ids[pos], .5) for pos in positions),
            dtype=float,
            count=len(positions),
        )
        combined = (1 - popular_weight) * fit[positions] + popular_weight * quality
        scores = {self.movie_ids[pos]: float(score) for pos, score in zip(positions, combined)}
        labels = [GENRE_LABELS.get(genre, genre) for genre in chosen[:3]]
        reason = RECOMMENDATION_REASONS["quiz"].format(genres=TEXT_SEPARATORS["list"].join(labels))
        return self._records(self._normalize(scores), n, reason)

    def similar_movies(self, movie_id: int, n: int = 10) -> list[dict]:
        if movie_id not in self.id_to_position:
            raise KeyError(ERROR_MESSAGES["movie_not_found"])
        row = cosine_similarity(self.genre_matrix[self.id_to_position[movie_id]], self.genre_matrix)[0]
        scores = {mid: float(row[pos]) for mid, pos in self.id_to_position.items()
                  if mid != movie_id and row[pos] > 0}
        return self._records(scores, n, RECOMMENDATION_REASONS["similar"])

    def collaborative_scores(self, user_id: int) -> dict[int, float]:
        history = self.ratings[self.ratings.userId == user_id]
        if history.empty or not self.item_ids:
            return {}
        index = {mid: i for i, mid in enumerate(self.item_ids)}
        rated_rows = [(index[int(row.movieId)], float(row.rating) - 3.0)
                      for row in history.itertuples() if int(row.movieId) in index]
        if not rated_rows:
            return {}
        positions, centered = zip(*rated_rows)
        similarities = self.normalized_item_matrix[list(positions)] @ self.normalized_item_matrix.T
        similarities = np.maximum(similarities, 0)
        weights = similarities.sum(axis=0)
        weighted_scores = np.asarray(centered) @ similarities
        rated = set(history.movieId.astype(int))
        return {self.item_ids[pos]: float(weighted_scores[pos] / weights[pos])
                for pos in np.flatnonzero(weights > 0) if self.item_ids[pos] not in rated}

    def content_scores(self, user_id: int) -> dict[int, float]:
        history = self.ratings[(self.ratings.userId == user_id) & (self.ratings.rating >= 3.5)]
        if history.empty:
            return {}
        positions = [self.id_to_position[int(mid)] for mid in history.movieId if int(mid) in self.id_to_position]
        if not positions:
            return {}
        profile = np.asarray(self.genre_matrix[positions].mean(axis=0))
        values = cosine_similarity(profile, self.genre_matrix)[0]
        rated = set(self.ratings[self.ratings.userId == user_id].movieId.astype(int))
        return {mid: float(values[pos]) for mid, pos in self.id_to_position.items() if mid not in rated}

    def recommend(self, user_id: int, method: str = "hybrid", n: int = 10, alpha: float = .65) -> list[dict]:
        if method not in {"hybrid", "collaborative", "content", "popular"}:
            raise ValueError(ERROR_MESSAGES["invalid_method"])
        if not 0 <= alpha <= 1:
            raise ValueError(ERROR_MESSAGES["invalid_alpha"])
        rated = set(self.ratings[self.ratings.userId == user_id].movieId.astype(int))
        if method == "popular" or len(rated) < self.cold_start_ratings:
            return self.popular(n, rated)
        collaborative = self._normalize(self.collaborative_scores(user_id))
        if method == "collaborative":
            return self._records(collaborative, n, RECOMMENDATION_REASONS["collaborative"]) or self.popular(n, rated)
        content = self._normalize(self.content_scores(user_id))
        if method == "content":
            return self._records(content, n, RECOMMENDATION_REASONS["content"]) or self.popular(n, rated)
        candidates = set(collaborative) | set(content)
        scores = self._normalize({mid: alpha * collaborative.get(mid, 0) + (1-alpha) * content.get(mid, 0) for mid in candidates})
        return self._records(scores, n, RECOMMENDATION_REASONS["hybrid"]) or self.popular(n, rated)
