import pytest
from backend.constants import ERROR_MESSAGES
from backend.security import create_token, hash_password, read_token, verify_password

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
