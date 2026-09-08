"""Dependency-light password hashing and signed demo tokens."""
import base64, hashlib, hmac, json, os, time
from config import settings

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return base64.urlsafe_b64encode(salt + digest).decode()

def verify_password(password: str, stored: str) -> bool:
    raw = base64.urlsafe_b64decode(stored.encode())
    candidate = hashlib.scrypt(password.encode(), salt=raw[:16], n=2**14, r=8, p=1)
    return hmac.compare_digest(candidate, raw[16:])

def create_token(user_id: int) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "exp": int(time.time()) + 86400}).encode()).decode().rstrip("=")
    signature = hmac.new(settings.secret_key.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"

def read_token(token: str) -> int:
    payload, signature = token.split(".", 1)
    expected = hmac.new(settings.secret_key.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise ValueError("Invalid token")
    data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    if data["exp"] < time.time():
        raise ValueError("Expired token")
    return int(data["sub"])
