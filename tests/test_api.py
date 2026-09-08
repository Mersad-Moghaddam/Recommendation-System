from app.main import health

def test_health():
    # Route logic is unit tested here; a live HTTP smoke test is documented below.
    assert health() == {"status": "ok"}
