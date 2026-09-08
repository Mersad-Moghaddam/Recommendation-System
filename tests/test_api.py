from app.main import health
from backend.schemas import QuizIn

def test_health():
    # Route logic is unit tested here; a live HTTP smoke test is documented below.
    assert health() == {"status": "ok"}

def test_quiz_input_validation():
    quiz = QuizIn(mood="Thoughtful", genres=["Drama"], era="Classics", discovery=25, origin="Iranian")
    assert quiz.n == 12
    assert quiz.origin == "Iranian"
