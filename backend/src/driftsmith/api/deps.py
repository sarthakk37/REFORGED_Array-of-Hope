"""FastAPI route dependencies for database sessions and authentication."""

from collections.abc import Generator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from driftsmith.api.schemas import UserSchema
from driftsmith.auth.permissions import check_role_permission
from driftsmith.auth.tokens import decode_access_token
from driftsmith.config import settings
from driftsmith.db.repositories import users as users_repo
from driftsmith.db.session import get_db

DEFAULT_ADMIN = UserSchema(id="usr-admin", email="admin@demo.local", role="admin")


def get_db_session() -> Generator[Session, None, None]:
    """Yield database session from session pool."""
    yield from get_db()


def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db_session),
) -> UserSchema:
    """Resolve authenticated user profile from Bearer token or demo fallback."""
    if not settings.auth_enabled:
        return DEFAULT_ADMIN

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication expired. Please sign in again.",
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    user = users_repo.get_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return users_repo.to_schema(user)


def require_approver(user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Enforce that current user possesses approver or admin privileges."""
    check_role_permission(user, ("approver", "admin"))
    return user


def require_admin(user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Enforce that current user possesses administrator privileges."""
    check_role_permission(user, ("admin",))
    return user
