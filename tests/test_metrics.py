from recommender.metrics import mae, precision_at_k, recall_at_k, rmse
import pytest

def test_ranking_metrics():
    recommended, relevant = [1, 2, 3, 4], {2, 4, 9}
    assert precision_at_k(recommended, relevant, 4) == .5
    assert recall_at_k(recommended, relevant, 4) == 2/3

def test_error_metrics():
    assert mae([3, 5], [2, 5]) == .5
    assert round(rmse([3, 5], [2, 5]), 4) == .7071


def test_metrics_reject_invalid_inputs():
    with pytest.raises(ValueError):
        precision_at_k([1], {1}, 0)
    with pytest.raises(ValueError):
        recall_at_k([1], {1}, 0)
    with pytest.raises(ValueError):
        mae([], [])
    with pytest.raises(ValueError):
        rmse([1, 2], [1])
