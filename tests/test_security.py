import pytest
from backend.constants import ERROR_MESSAGES
from backend.security import create_token, hash_password, read_token, verify_password
from config import DEFAULT_SECRET_KEY, Settings, validate_settings

def test_passwords_are_salted_and_verifiable():
    first, second = hash_password("student123"), hash_password("student123")
    assert first != second
    assert verify_password("student123", first)
    assert not verify_password("wrong", first)
    assert not verify_password("student123", "malformed")

def test_signed_token_round_trip():
    assert read_token(create_token(42)) == 42


def test_malformed_token_has_consistent_error():
    with pytest.raises(ValueError, match=ERROR_MESSAGES["invalid_token"]):
        read_token("malformed")


def test_production_rejects_default_or_short_session_secrets():
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        validate_settings(Settings(environment="production", secret_key=DEFAULT_SECRET_KEY))
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        validate_settings(Settings(environment="production", secret_key="too-short"))

    validate_settings(Settings(environment="production", secret_key="x" * 32))
