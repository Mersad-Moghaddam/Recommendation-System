"""Leakage-free temporal ranking evaluation for the recommender."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np

from config import settings
from recommender import RecommendationEngine
from recommender.data import load_catalog


def _rank_metrics(predicted: list[int], target: int) -> tuple[float, float, float]:
    if target not in predicted:
        return 0.0, 0.0, 0.0
    rank = predicted.index(target) + 1
    return 1.0, 1.0 / np.log2(rank + 1), 1.0 / rank


def _diversity(engine: RecommendationEngine, movie_ids: list[int]) -> float:
    if len(movie_ids) < 2:
        return 0.0
    genre_sets = [set(str(engine.movie_lookup.loc[mid, "genres"]).split("|")) for mid in movie_ids]
    distances = []
    for left in range(len(genre_sets)):
        for right in range(left + 1, len(genre_sets)):
            union = genre_sets[left] | genre_sets[right]
            distances.append(1 - len(genre_sets[left] & genre_sets[right]) / max(1, len(union)))
    return float(np.mean(distances))


def evaluate(k: int = 10, user_limit: int = 50) -> dict[str, dict[str, float]]:
    movies, ratings = load_catalog(
        settings.movies_csv,
        settings.ratings_csv,
        settings.persian_movies_csv,
        settings.expanded_movies_csv,
    )
    if "timestamp" not in ratings:
        ratings["timestamp"] = np.arange(len(ratings))
    positive = ratings[ratings.rating >= 4].sort_values("timestamp")
    eligible = positive.groupby("userId").size().loc[lambda count: count >= 2].index[:user_limit]
    holdout = positive[positive.userId.isin(eligible)].groupby("userId").tail(1)
    train = ratings.drop(holdout.index)
    engine = RecommendationEngine(movies, train)
    methods = ("popular", "collaborative", "content", "hybrid")
    totals = {
        method: {"hits": [], "ndcg": [], "mrr": [], "diversity": [], "recommended": set()}
        for method in methods
    }
    for test in holdout.itertuples():
        history = train[train.userId == test.userId][["movieId", "rating"]]
        for method in methods:
            records = engine.recommend_history(history, method, k)
            predicted = [record["movie_id"] for record in records]
            hit, ndcg, mrr = _rank_metrics(predicted, int(test.movieId))
            totals[method]["hits"].append(hit)
            totals[method]["ndcg"].append(ndcg)
            totals[method]["mrr"].append(mrr)
            totals[method]["diversity"].append(_diversity(engine, predicted))
            totals[method]["recommended"].update(predicted)
    return {
        method: {
            f"HitRate@{k}": float(np.mean(values["hits"])),
            f"NDCG@{k}": float(np.mean(values["ndcg"])),
            f"MRR@{k}": float(np.mean(values["mrr"])),
            "coverage": len(values["recommended"]) / max(1, len(engine.movies)),
            "intra_list_diversity": float(np.mean(values["diversity"])),
        }
        for method, values in totals.items()
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=10)
    parser.add_argument("--users", type=int, default=50)
    args = parser.parse_args()
    report = evaluate(args.k, args.users)
    print(f"Temporal positive-item holdout on {args.users} users (seed=42)")
    for method, metrics in report.items():
        print(method)
        print("  " + " | ".join(f"{name}={value:.4f}" for name, value in metrics.items()))


if __name__ == "__main__":
    main()
