"""Small evaluation helpers kept separate from model training."""
import numpy as np
from backend.constants import ERROR_MESSAGES

def _validate_k(k: int) -> None:
    if k <= 0:
        raise ValueError(ERROR_MESSAGES["invalid_k"])

def _metric_arrays(actual: list[float], predicted: list[float]) -> tuple[np.ndarray, np.ndarray]:
    if not actual or len(actual) != len(predicted):
        raise ValueError(ERROR_MESSAGES["invalid_metric_data"])
    return np.asarray(actual, dtype=float), np.asarray(predicted, dtype=float)

def precision_at_k(recommended: list[int], relevant: set[int], k: int) -> float:
    _validate_k(k)
    return len(set(recommended[:k]) & relevant) / k

def recall_at_k(recommended: list[int], relevant: set[int], k: int) -> float:
    _validate_k(k)
    if not relevant: return 0.0
    return len(set(recommended[:k]) & relevant) / len(relevant)

def mae(actual: list[float], predicted: list[float]) -> float:
    actual_values, predicted_values = _metric_arrays(actual, predicted)
    return float(np.mean(np.abs(actual_values - predicted_values)))

def rmse(actual: list[float], predicted: list[float]) -> float:
    actual_values, predicted_values = _metric_arrays(actual, predicted)
    return float(np.sqrt(np.mean((actual_values - predicted_values) ** 2)))
