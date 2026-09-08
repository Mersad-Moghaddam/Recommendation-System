from recommender.metrics import mae, precision_at_k, recall_at_k, rmse

def test_ranking_metrics():
    recommended, relevant = [1, 2, 3, 4], {2, 4, 9}
    assert precision_at_k(recommended, relevant, 4) == .5
    assert recall_at_k(recommended, relevant, 4) == 2/3

def test_error_metrics():
    assert mae([3, 5], [2, 5]) == .5
    assert round(rmse([3, 5], [2, 5]), 4) == .7071
