from pathlib import Path
from streamlit.testing.v1 import AppTest

def test_persian_rtl_frontend_loads():
    app_path = Path(__file__).resolve().parents[1] / "frontend/streamlit_app.py"
    app = AppTest.from_file(app_path).run(timeout=15)
    assert not app.exception
    assert app.radio[0].options == ["پیشنهادگر هوشمند", "ورود یا ثبت‌نام"]
    assert "دوست داری فیلم چه حسی به تو بدهد؟" in [item.label for item in app.selectbox]
    assert any("پیشنهادگر هوشمند" in item.value for item in app.markdown)
