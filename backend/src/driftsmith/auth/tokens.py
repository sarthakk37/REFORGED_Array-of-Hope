"""JWT access token generation and validation."""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from driftsmith.api.schemas import Role
from driftsmith.config import settings

ALGORITHM = "HS256"


def create_access_token(user_id: str, email: str, role: Role) -> str:
    """Generate signed JWT access token with expiration timestamp."""
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expiry_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate signature and expiry of a JWT access token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
