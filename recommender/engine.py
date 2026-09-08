"""Explainable content, collaborative, popularity and hybrid recommenders."""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
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

    def __init__(self, movies: pd.DataFrame, ratings: pd.DataFrame, cold_start_ratings: int = 3):
        self.movies = movies[["movieId", "title", "genres"]].drop_duplicates("movieId").copy()
        self.ratings = ratings[["userId", "movieId", "rating"]].copy()
        self.cold_start_ratings = cold_start_ratings
        self.movie_ids = self.movies.movieId.astype(int).tolist()
        self.id_to_position = {movie_id: i for i, movie_id in enumerate(self.movie_ids)}
        genre_text = self.movies.genres.fillna("").str.replace("|", " ", regex=False)
        self.genre_vectorizer = TfidfVectorizer(token_pattern=r"[^ ]+")
        self.genre_matrix = self.genre_vectorizer.fit_transform(genre_text)
        self.user_item = build_user_item_matrix(self.ratings)
        item_matrix = self.user_item.fillna(0).T
        self.item_ids = item_matrix.index.astype(int).tolist()
        # Avoid a quadratic dense movie-by-movie matrix. Similarities are
        # calculated only for movies rated by the active user.
        self.item_matrix = item_matrix.to_numpy(dtype=np.float32)

    @staticmethod
    def _normalize(scores: dict[int, float]) -> dict[int, float]:
        if not scores:
            return {}
        values = np.asarray(list(scores.values()), dtype=float)
        spread = values.max() - values.min()
        return {k: float((v - values.min()) / spread) if spread else 1.0 for k, v in scores.items()}

    def _records(self, scores: dict[int, float], n: int, reason: str) -> list[dict]:
        ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)[:n]
        lookup = self.movies.set_index("movieId")
        return [{"movie_id": int(mid), "title": lookup.loc[mid, "title"],
                 "genres": str(lookup.loc[mid, "genres"]).split("|"),
                 "score": round(float(score), 4), "reason": reason}
                for mid, score in ranked if mid in lookup.index]

    def popular(self, n: int = 10, exclude: set[int] | None = None) -> list[dict]:
        stats = self.ratings.groupby("movieId").rating.agg(["mean", "count"])
        global_mean = float(self.ratings.rating.mean()) if len(self.ratings) else 0.0
        confidence = max(5.0, float(stats["count"].quantile(.60))) if len(stats) else 5.0
        stats["score"] = ((stats["count"] * stats["mean"] + confidence * global_mean)
                          / (stats["count"] + confidence))
        scores = stats.score.to_dict()
        for mid in exclude or set():
            scores.pop(mid, None)
        return self._records(self._normalize(scores), n, "Popular and consistently well rated")

    def preference_quiz(self, mood: str, genres: list[str], era: str = "Any era",
                        discovery: int = 50, n: int = 12) -> list[dict]:
        """Rank real movies from a short preference form and rating confidence."""
        if mood not in self.MOOD_GENRES:
            raise ValueError("Unknown mood")
        chosen = list(dict.fromkeys(genres + self.MOOD_GENRES[mood]))
        if not chosen:
            chosen = ["Drama", "Comedy", "Adventure", "Thriller"]
        query_vector = self.genre_vectorizer.transform([" ".join(chosen)])
        fit = cosine_similarity(query_vector, self.genre_matrix)[0]

        stats = self.ratings.groupby("movieId").rating.agg(["mean", "count"])
        global_mean = float(self.ratings.rating.mean())
        confidence = max(5.0, float(stats["count"].quantile(.60)))
        quality_raw = ((stats["count"] * stats["mean"] + confidence * global_mean)
                       / (stats["count"] + confidence)).to_dict()
        quality = self._normalize(quality_raw)
        popular_weight = .35 * (1 - discovery / 100)

        years = self.movies.title.str.extract(r"\((\d{4})\)\s*$")[0].astype(float)
        def era_ok(year: float) -> bool:
            if pd.isna(year) or era == "Any era": return True
            if era == "Classics": return year < 1980
            if era == "80s & 90s": return 1980 <= year < 2000
            if era == "2000s": return 2000 <= year < 2015
            return year >= 2015

        scores = {}
        for pos, movie_id in enumerate(self.movie_ids):
            if era_ok(years.iloc[pos]) and fit[pos] > 0:
                scores[movie_id] = float((1 - popular_weight) * fit[pos] + popular_weight * quality.get(movie_id, 0))
        reason = f"Matches your {mood.lower()} mood and {', '.join(chosen[:3])} preference"
        return self._records(scores, n, reason)

    def similar_movies(self, movie_id: int, n: int = 10) -> list[dict]:
        if movie_id not in self.id_to_position:
            raise KeyError(f"Movie {movie_id} does not exist")
        row = cosine_similarity(self.genre_matrix[self.id_to_position[movie_id]], self.genre_matrix)[0]
        scores = {mid: float(row[pos]) for mid, pos in self.id_to_position.items() if mid != movie_id}
        return self._records(scores, n, "Similar genres")

    def collaborative_scores(self, user_id: int) -> dict[int, float]:
        history = self.ratings[self.ratings.userId == user_id]
        if history.empty or not self.item_ids:
            return {}
        index = {mid: i for i, mid in enumerate(self.item_ids)}
        scores, weights = {}, {}
        for row in history.itertuples():
            if int(row.movieId) not in index:
                continue
            centered = float(row.rating) - 3.0
            similarities = cosine_similarity(
                self.item_matrix[index[int(row.movieId)]].reshape(1, -1), self.item_matrix
            )[0]
            for pos, similarity in enumerate(similarities):
                candidate = self.item_ids[pos]
                if candidate == int(row.movieId) or similarity <= 0:
                    continue
                scores[candidate] = scores.get(candidate, 0.0) + similarity * centered
                weights[candidate] = weights.get(candidate, 0.0) + similarity
        rated = set(history.movieId.astype(int))
        return {mid: value / weights[mid] for mid, value in scores.items() if mid not in rated and weights[mid]}

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
            raise ValueError("method must be hybrid, collaborative, content, or popular")
        rated = set(self.ratings[self.ratings.userId == user_id].movieId.astype(int))
        if method == "popular" or len(rated) < self.cold_start_ratings:
            return self.popular(n, rated)
        collaborative = self._normalize(self.collaborative_scores(user_id))
        if method == "collaborative":
            return self._records(collaborative, n, "People with similar taste also enjoyed it")
        content = self._normalize(self.content_scores(user_id))
        if method == "content":
            return self._records(content, n, "Matches genres you rate highly")
        candidates = set(collaborative) | set(content)
        scores = {mid: alpha * collaborative.get(mid, 0) + (1-alpha) * content.get(mid, 0) for mid in candidates}
        return self._records(scores, n, "Blends similar taste with your favorite genres") or self.popular(n, rated)
