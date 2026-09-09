"""Fast, explainable content, latent-factor, popularity and hybrid recommenders."""

from __future__ import annotations

import json
from typing import Iterable, TypedDict

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
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


class RecommendationRecord(TypedDict):
    movie_id: int
    title: str
    genres: list[str]
    score: float
    reason: str
    reason_sources: list[str]


class RecommendationEngine:
    """A static catalog model combined with a live per-user rating profile."""

    ARTIFACT_VERSION = 5
    MOOD_FEATURES = {
        "feel_good": ["Comedy", "Romance", "Animation", "uplifting", "friendship", "hopeful"],
        "need_laugh": ["Comedy", "satire", "funny", "witty", "lighthearted"],
        "low_energy": ["Comedy", "Drama", "Romance", "gentle", "cozy", "easy watching"],
        "thrill": ["Action", "Adventure", "Thriller", "tense", "suspense", "fast paced"],
        "thoughtful": ["Drama", "Documentary", "Mystery", "philosophical", "social", "thought provoking"],
        "emotional": ["Drama", "Romance", "family", "moving", "human", "tearjerker"],
        "cozy": ["Comedy", "Children", "Romance", "warm", "family", "comfort"],
        "romantic": ["Romance", "Drama", "Comedy", "love", "relationship"],
        "inspired": ["Drama", "Documentary", "Adventure", "biography", "achievement", "hope"],
        "nostalgic": ["Drama", "Comedy", "Children", "coming of age", "memory", "classic"],
        "escape": ["Fantasy", "Sci-Fi", "Adventure", "world building", "epic", "imaginative"],
        "surprise": [],
    }
    LEGACY_MOODS = {
        "Feel-good": "feel_good", "Thrilled": "thrill", "Thoughtful": "thoughtful",
        "Escape": "escape", "Comfort": "cozy", "Surprise me": "surprise",
    }
    MOOD_LABELS = {
        "feel_good": "حال‌خوب‌کن", "need_laugh": "نیاز به خنده", "low_energy": "کم‌انرژی",
        "thrill": "پرهیجان", "thoughtful": "فکری", "emotional": "احساسی",
        "cozy": "آرام و صمیمی", "romantic": "عاشقانه", "inspired": "الهام‌بخش",
        "nostalgic": "نوستالژیک", "escape": "فرار از روزمرگی", "surprise": "غافلگیرم کن",
    }
    VALID_ERAS = {"Any era", "Classics", "80s & 90s", "2000s", "Modern"}
    VALID_ORIGINS = {"Any", "Iranian", "International"}
    VALID_MODES = {"balanced", "familiar", "explore"}

    def __init__(self, movies: pd.DataFrame, ratings: pd.DataFrame, cold_start_ratings: int = 3):
        required = ["movieId", "title", "genres"]
        optional = ["overview", "keywords", "original_language", "countries", "runtime_minutes"]
        available = required + [column for column in optional if column in movies.columns]
        self.movies = movies[available].drop_duplicates("movieId").copy()
        for column in optional:
            if column not in self.movies:
                self.movies[column] = "" if column != "runtime_minutes" else np.nan
        self.ratings = ratings[["userId", "movieId", "rating"]].copy()
        self.cold_start_ratings = cold_start_ratings
        self.movie_ids = self.movies.movieId.astype(int).tolist()
        self.movie_id_array = np.asarray(self.movie_ids, dtype=np.int64)
        self.id_to_position = {movie_id: index for index, movie_id in enumerate(self.movie_ids)}
        self.movie_lookup = self.movies.set_index("movieId")
        self.movie_years = self.movies.title.str.extract(r"\((\d{4})\)\s*$")[0].astype(float).to_numpy()
        self.is_iranian = np.asarray([
            int(row.movieId) >= PERSIAN_MOVIE_ID_START
            or any(country.upper() in {"IR", "IRAN"} for country in self._list_text(row.countries).split())
            for row in self.movies.itertuples(index=False)
        ], dtype=bool)

        feature_text = self.movies.apply(self._feature_text, axis=1)
        self.content_vectorizer = TfidfVectorizer(
            token_pattern=r"(?u)\b[\w-]+\b",
            ngram_range=(1, 2),
            max_features=60_000,
            sublinear_tf=True,
            dtype=np.float32,
        )
        self.content_matrix: csr_matrix = csr_matrix(self.content_vectorizer.fit_transform(feature_text))

        self.user_item = build_user_item_matrix(self.ratings)
        self.global_mean = float(self.ratings.rating.mean()) if not self.ratings.empty else 3.0
        if self.ratings.empty:
            self.user_biases = {}
            self.movie_biases = {}
        else:
            user_means = self.ratings.groupby("userId").rating.mean()
            user_counts = self.ratings.groupby("userId").rating.count()
            self.user_biases = (
                (user_means - self.global_mean) * user_counts / (user_counts + 10.0)
            ).astype(float).to_dict()
            residuals = self.ratings.rating - self.ratings.userId.map(user_means)
            bias_stats = residuals.groupby(self.ratings.movieId).agg(["sum", "count"])
            self.movie_biases = (
                bias_stats["sum"] / (bias_stats["count"] + 10.0)
            ).astype(float).to_dict()
        item_matrix = self.user_item.T
        self.item_ids = item_matrix.index.astype(int).tolist()
        self.item_index = {movie_id: index for index, movie_id in enumerate(self.item_ids)}
        self.item_catalog_positions = np.asarray(
            [self.id_to_position.get(movie_id, -1) for movie_id in self.item_ids], dtype=np.int64
        )
        self.item_bias_vector = np.asarray(
            [self.movie_biases.get(movie_id, 0.0) for movie_id in self.item_ids], dtype=np.float32
        )
        self.collaborative_svd: TruncatedSVD | None = None
        if not self.user_item.empty and min(self.user_item.shape) > 1:
            centered = self.user_item.sub(self.user_item.mean(axis=1), axis=0).fillna(0).to_numpy(dtype=np.float32)
            components = min(64, centered.shape[0] - 1, centered.shape[1] - 1)
            if components > 0:
                self.collaborative_svd = TruncatedSVD(n_components=components, random_state=42)
                self.collaborative_svd.fit(csr_matrix(centered))
        self.quality_scores = self._quality_scores()
        self.quality_vector = np.asarray(
            [self.quality_scores.get(movie_id, .5) for movie_id in self.movie_ids], dtype=np.float32
        )

    @staticmethod
    def _list_text(value) -> str:
        if isinstance(value, (list, tuple, set)):
            return " ".join(str(item) for item in value)
        if not value or (isinstance(value, float) and np.isnan(value)):
            return ""
        if isinstance(value, str) and value.startswith("["):
            try:
                parsed = json.loads(value)
                return " ".join(str(item) for item in parsed)
            except (json.JSONDecodeError, TypeError):
                pass
        return str(value)

    def _feature_text(self, row) -> str:
        genres = str(row.genres or "").replace("|", " ")
        year_match = pd.Series([row.title]).str.extract(r"\((\d{4})\)\s*$")[0].iloc[0]
        year_bucket = f"decade_{str(year_match)[:3]}0" if isinstance(year_match, str) else ""
        return " ".join(filter(None, [
            genres, genres, genres,
            self._list_text(row.keywords), self._list_text(row.keywords),
            str(row.overview or ""),
            f"language_{row.original_language}" if row.original_language else "",
            self._list_text(row.countries), year_bucket,
        ]))

    def _quality_scores(self) -> dict[int, float]:
        if self.ratings.empty:
            return {}
        stats = self.ratings.groupby("movieId").rating.agg(["mean", "count"])
        global_mean = float(self.ratings.rating.mean())
        confidence = max(5.0, float(stats["count"].quantile(.60)))
        raw = ((stats["count"] * stats["mean"] + confidence * global_mean)
               / (stats["count"] + confidence)).to_dict()
        return self._normalize({int(movie_id): float(score) for movie_id, score in raw.items()})

    @staticmethod
    def _normalize(scores: dict[int, float]) -> dict[int, float]:
        if not scores:
            return {}
        values = np.asarray(list(scores.values()), dtype=np.float32)
        minimum = float(values.min())
        spread = float(values.max() - minimum)
        return {key: float((value - minimum) / spread) if spread else 1.0 for key, value in scores.items()}

    @staticmethod
    def _history_frame(history: pd.DataFrame | Iterable[tuple[int, float]]) -> pd.DataFrame:
        if isinstance(history, pd.DataFrame):
            frame = history.copy()
            if "movie_id" in frame and "movieId" not in frame:
                frame = frame.rename(columns={"movie_id": "movieId", "value": "rating"})
            return frame[["movieId", "rating"]] if not frame.empty else pd.DataFrame(columns=["movieId", "rating"])
        return pd.DataFrame(list(history), columns=["movieId", "rating"])

    def _mmr_rank(self, scores: dict[int, float], n: int, relevance_weight: float) -> list[tuple[int, float]]:
        ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)[:100]
        if len(ranked) <= 1 or n <= 1:
            return ranked[:n]
        ids = [movie_id for movie_id, _ in ranked]
        positions = [self.id_to_position[movie_id] for movie_id in ids]
        similarities = cosine_similarity(self.content_matrix[positions])
        selected = [0]
        remaining = set(range(1, len(ranked)))
        while remaining and len(selected) < n:
            next_index = max(
                remaining,
                key=lambda index: relevance_weight * ranked[index][1]
                - (1 - relevance_weight) * float(similarities[index, selected].max()),
            )
            selected.append(next_index)
            remaining.remove(next_index)
        return [ranked[index] for index in selected]

    def _records(self, scores: dict[int, float], n: int, reason: str,
                 reason_sources: list[str] | None = None, relevance_weight: float = .80) -> list[RecommendationRecord]:
        if n <= 0:
            raise ValueError(ERROR_MESSAGES["invalid_limit"])
        ranked = self._mmr_rank(scores, n, relevance_weight)
        return [
            {
                "movie_id": int(movie_id),
                "title": str(self.movie_lookup.loc[movie_id, "title"]),
                "genres": str(self.movie_lookup.loc[movie_id, "genres"]).split("|"),
                "score": round(float(score), 4),
                "reason": reason,
                "reason_sources": reason_sources or [],
            }
            for movie_id, score in ranked if movie_id in self.movie_lookup.index
        ]

    def _records_array(self, scores: np.ndarray, n: int, reason: str,
                       reason_sources: list[str], relevance_weight: float) -> list[RecommendationRecord]:
        if n <= 0:
            raise ValueError(ERROR_MESSAGES["invalid_limit"])
        valid = np.flatnonzero(np.isfinite(scores))
        if not len(valid):
            return []
        window = min(100, len(valid))
        values = scores[valid]
        selected = valid[np.argpartition(values, -window)[-window:]]
        selected = selected[np.argsort(scores[selected])[::-1]]
        candidates = {self.movie_ids[position]: float(scores[position]) for position in selected}
        return self._records(candidates, n, reason, reason_sources, relevance_weight)

    @staticmethod
    def _normalize_vector(values: np.ndarray) -> np.ndarray:
        normalized = np.asarray(values, dtype=np.float32).copy()
        finite = np.isfinite(normalized)
        if not finite.any():
            return normalized
        minimum = float(normalized[finite].min())
        spread = float(normalized[finite].max() - minimum)
        normalized[finite] = (normalized[finite] - minimum) / spread if spread else 1.0
        return normalized

    def popular(self, n: int = 10, exclude: set[int] | None = None,
                relevance_weight: float = .85) -> list[RecommendationRecord]:
        scores = self.quality_scores.copy()
        for movie_id in exclude or set():
            scores.pop(movie_id, None)
        return self._records(scores, n, RECOMMENDATION_REASONS["popular"], ["quality"], relevance_weight)

    def _validate_quiz(self, moods: list[str], genres: list[str], era: str,
                       discovery: int, origin: str) -> None:
        if not 1 <= len(moods) <= 2 or len(set(moods)) != len(moods):
            raise ValueError(ERROR_MESSAGES["invalid_moods"])
        if any(mood not in self.MOOD_FEATURES for mood in moods):
            raise ValueError(ERROR_MESSAGES["invalid_mood"])
        if "surprise" in moods and len(moods) > 1:
            raise ValueError(ERROR_MESSAGES["surprise_exclusive"])
        if any(genre not in GENRE_LABELS for genre in genres):
            raise ValueError(ERROR_MESSAGES["invalid_genre"])
        if era not in self.VALID_ERAS:
            raise ValueError(ERROR_MESSAGES["invalid_era"])
        if origin not in self.VALID_ORIGINS:
            raise ValueError(ERROR_MESSAGES["invalid_origin"])
        if not 0 <= discovery <= 100:
            raise ValueError(ERROR_MESSAGES["invalid_discovery"])

    def preference_quiz(self, moods: list[str] | str, genres: list[str], era: str = "Any era",
                        discovery: int = 50, n: int = 12, origin: str = "Any",
                        history: pd.DataFrame | Iterable[tuple[int, float]] | None = None) -> list[RecommendationRecord]:
        """Rank movies from two ordered moods, optional history and catalog metadata."""
        if isinstance(moods, str):
            moods = [self.LEGACY_MOODS.get(moods, moods)]
        self._validate_quiz(moods, genres, era, discovery, origin)
        mood_features = list(self.MOOD_FEATURES[moods[0]])
        if len(moods) == 2:
            mood_features.extend(self.MOOD_FEATURES[moods[1]])
        chosen = list(dict.fromkeys(genres + mood_features))
        if not chosen:
            chosen = ["Drama", "Comedy", "Adventure", "Thriller"]
        query_vector = self.content_vectorizer.transform([" ".join(chosen)])
        fit = np.asarray((self.content_matrix @ query_vector.T).toarray()).reshape(-1)

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
            eligible &= self.is_iranian
        elif origin == "International":
            eligible &= ~self.is_iranian

        history_frame = self._history_frame(history if history is not None else [])
        rated = set(history_frame.movieId.astype(int)) if not history_frame.empty else set()
        if rated:
            eligible &= ~np.isin(self.movie_id_array, list(rated))
        positions = np.flatnonzero(eligible)
        if not len(positions):
            return self.popular(n, rated)

        quality_weight = .05 + .30 * (1 - discovery / 100)
        history_weight = .30 if not history_frame.empty else 0.0
        form_weight = 1 - quality_weight - history_weight
        history_scores = self._normalize(self.content_scores_history(history_frame)) if history_weight else {}
        combined: dict[int, float] = {}
        for position in positions:
            movie_id = self.movie_ids[position]
            combined[movie_id] = (
                form_weight * float(fit[position])
                + history_weight * history_scores.get(movie_id, 0.0)
                + quality_weight * self.quality_scores.get(movie_id, .5)
            )
        labels = [GENRE_LABELS.get(item, item) for item in genres[:3]]
        genre_label = TEXT_SEPARATORS["list"].join(labels) if labels else "انتخاب‌های احساسی تو"
        sources = ["mood"] + (["genres"] if genres else []) + (["history"] if history_weight else [])
        relevance_weight = .90 - .25 * discovery / 100
        mood_label = self.MOOD_LABELS[moods[0]]
        reason = f"{RECOMMENDATION_REASONS['quiz'].format(genres=genre_label)}؛ نزدیک به حس «{mood_label}»"
        return self._records(self._normalize(combined), n, reason, sources, relevance_weight)

    def similar_movies(self, movie_id: int, n: int = 10) -> list[RecommendationRecord]:
        if movie_id not in self.id_to_position:
            raise KeyError(ERROR_MESSAGES["movie_not_found"])
        position = self.id_to_position[movie_id]
        values = np.asarray((self.content_matrix @ self.content_matrix[position].T).toarray()).reshape(-1)
        source_genres = set(str(self.movie_lookup.loc[movie_id, "genres"]).split("|")) - {"(no genres listed)"}
        scores = {
            candidate: float(values[index])
            for index, candidate in enumerate(self.movie_ids)
            if candidate != movie_id
            and values[index] > 0
            and source_genres.intersection(str(self.movie_lookup.loc[candidate, "genres"]).split("|"))
        }
        return self._records(scores, n, RECOMMENDATION_REASONS["similar"], ["content"], .78)

    def collaborative_scores_history(self, history) -> dict[int, float]:
        values = self.collaborative_values_history(history)
        return {
            movie_id: float(values[position])
            for position, movie_id in enumerate(self.movie_ids)
            if np.isfinite(values[position]) and values[position] != 0
        }

    def collaborative_values_history(self, history) -> np.ndarray:
        frame = self._history_frame(history)
        catalog_values = np.zeros(len(self.movie_ids), dtype=np.float32)
        if frame.empty or self.collaborative_svd is None or not self.item_ids:
            return catalog_values
        row = np.zeros(len(self.item_ids), dtype=np.float32)
        rated = set(frame.movieId.astype(int))
        for item in frame.itertuples(index=False):
            index = self.item_index.get(int(item.movieId))
            if index is not None:
                row[index] = float(item.rating) - float(frame.rating.mean())
        if not np.any(row):
            return catalog_values
        latent = self.collaborative_svd.transform(csr_matrix(row.reshape(1, -1)))
        values = (latent @ self.collaborative_svd.components_).ravel() + self.item_bias_vector
        valid = self.item_catalog_positions >= 0
        catalog_values[self.item_catalog_positions[valid]] = values[valid]
        for movie_id in rated:
            position = self.id_to_position.get(movie_id)
            if position is not None:
                catalog_values[position] = -np.inf
        return catalog_values

    def collaborative_scores(self, user_id: int) -> dict[int, float]:
        return self.collaborative_scores_history(self.ratings[self.ratings.userId == user_id])

    def content_scores_history(self, history) -> dict[int, float]:
        values = self.content_values_history(history)
        return {
            movie_id: float(values[position])
            for position, movie_id in enumerate(self.movie_ids)
            if np.isfinite(values[position])
        }

    def content_values_history(self, history) -> np.ndarray:
        frame = self._history_frame(history)
        if frame.empty:
            return np.zeros(len(self.movie_ids), dtype=np.float32)
        rated = set(frame.movieId.astype(int))
        rows: list[int] = []
        weights: list[float] = []
        for item in frame.itertuples(index=False):
            position = self.id_to_position.get(int(item.movieId))
            weight = float(item.rating) - 3.0
            if position is not None and weight:
                rows.append(position)
                weights.append(weight)
        if not rows:
            return np.zeros(len(self.movie_ids), dtype=np.float32)
        profile = self.content_matrix[rows].multiply(np.asarray(weights, dtype=np.float32)[:, None]).sum(axis=0)
        profile = csr_matrix(profile)
        norm = float(np.sqrt(profile.multiply(profile).sum()))
        if not norm:
            return np.zeros(len(self.movie_ids), dtype=np.float32)
        profile /= norm
        values = np.asarray((self.content_matrix @ profile.T).toarray()).reshape(-1)
        for movie_id in rated:
            position = self.id_to_position.get(movie_id)
            if position is not None:
                values[position] = -np.inf
        return values.astype(np.float32, copy=False)

    def content_scores(self, user_id: int) -> dict[int, float]:
        return self.content_scores_history(self.ratings[self.ratings.userId == user_id])

    def recommend_history(self, history, method: str = "hybrid", n: int = 10,
                          mode: str = "balanced") -> list[RecommendationRecord]:
        if method not in {"hybrid", "collaborative", "content", "popular"}:
            raise ValueError(ERROR_MESSAGES["invalid_method"])
        if mode not in self.VALID_MODES:
            raise ValueError(ERROR_MESSAGES["invalid_mode"])
        frame = self._history_frame(history)
        rated = set(frame.movieId.astype(int)) if not frame.empty else set()
        relevance_weight = .65 if mode == "explore" else .90 if mode == "familiar" else .85
        if method == "popular" or not rated:
            return self.popular(n, rated, relevance_weight)

        collaborative = self._normalize_vector(self.collaborative_values_history(frame))
        content = self._normalize_vector(self.content_values_history(frame))
        if method == "collaborative":
            return self._records_array(collaborative, n, RECOMMENDATION_REASONS["collaborative"], ["collaborative"], .80) or self.popular(n, rated)
        if method == "content":
            return self._records_array(content, n, RECOMMENDATION_REASONS["content"], ["content", "history"], .78) or self.popular(n, rated)

        if len(rated) <= 2:
            content_weight, collaborative_weight, quality_weight = .70, .15, .15
        elif len(rated) <= 9:
            content_weight, collaborative_weight, quality_weight = .50, .35, .15
        else:
            content_weight, collaborative_weight, quality_weight = .35, .55, .10
        scores = (
            content_weight * content
            + collaborative_weight * collaborative
            + quality_weight * self.quality_vector
        )
        for movie_id in rated:
            position = self.id_to_position.get(movie_id)
            if position is not None:
                scores[position] = -np.inf
        scores = self._normalize_vector(scores)
        records = self._records_array(
            scores, n, RECOMMENDATION_REASONS["hybrid"],
            ["content", "collaborative", "quality"], relevance_weight,
        )
        if not records:
            return self.popular(n, rated)
        liked = frame[frame.rating >= 4].sort_values("rating", ascending=False)
        liked_title = None
        if not liked.empty:
            liked_id = int(liked.iloc[0].movieId)
            if liked_id in self.movie_lookup.index:
                liked_title = str(self.movie_lookup.loc[liked_id, "title"]).rsplit(" (", 1)[0]
        for record in records:
            position = self.id_to_position[record["movie_id"]]
            signals = {
                "content": content_weight * float(content[position]),
                "collaborative": collaborative_weight * float(collaborative[position]),
                "quality": quality_weight * float(self.quality_vector[position]),
            }
            strongest = max(signals, key=signals.get)
            if strongest == "content" and liked_title:
                record["reason"] = f"از نظر فضا به «{liked_title}» که پسندیده‌ای نزدیک است"
                record["reason_sources"] = ["liked_movie", "content"]
            elif strongest == "content":
                record["reason"] = RECOMMENDATION_REASONS["content"]
                record["reason_sources"] = ["content", "history"]
            elif strongest == "collaborative":
                record["reason"] = RECOMMENDATION_REASONS["collaborative"]
                record["reason_sources"] = ["collaborative"]
            else:
                record["reason"] = RECOMMENDATION_REASONS["popular"]
                record["reason_sources"] = ["quality"]
        return records

    def recommend(self, user_id: int, method: str = "hybrid", n: int = 10,
                  alpha: float = .65, mode: str = "balanced") -> list[RecommendationRecord]:
        if not 0 <= alpha <= 1:
            raise ValueError(ERROR_MESSAGES["invalid_alpha"])
        return self.recommend_history(self.ratings[self.ratings.userId == user_id], method, n, mode)
