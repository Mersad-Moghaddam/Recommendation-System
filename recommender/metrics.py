"""Small evaluation helpers kept separate from model training."""
import numpy as np

def precision_at_k(recommended: list[int], relevant: set[int], k: int) -> float:
    if k <= 0: raise ValueError("k must be positive")
    return len(set(recommended[:k]) & relevant) / k

def recall_at_k(recommended: list[int], relevant: set[int], k: int) -> float:
    if not relevant: return 0.0
    return len(set(recommended[:k]) & relevant) / len(relevant)

def mae(actual: list[float], predicted: list[float]) -> float:
    return float(np.mean(np.abs(np.asarray(actual) - np.asarray(predicted))))

def rmse(actual: list[float], predicted: list[float]) -> float:
    return float(np.sqrt(np.mean((np.asarray(actual) - np.asarray(predicted)) ** 2)))
