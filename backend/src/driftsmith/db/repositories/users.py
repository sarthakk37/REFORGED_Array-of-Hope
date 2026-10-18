"""Repository for User persistence and query operations."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from driftsmith.api.schemas import Role, UserSchema
from driftsmith.db.models import UserModel


def get_by_email(db: Session, email: str) -> UserModel | None:
    """Retrieve user entity by email address."""
    stmt = select(UserModel).where(UserModel.email == email)
    return db.scalars(stmt).first()


def get_by_id(db: Session, user_id: str) -> UserModel | None:
    """Retrieve user entity by unique ID."""
    stmt = select(UserModel).where(UserModel.id == user_id)
    return db.scalars(stmt).first()


def create_user(
    db: Session,
    email: str,
    hashed_password: str,
    role: Role,
    user_id: str | None = None,
) -> UserModel:
    """Insert or update a user record."""
    existing = get_by_email(db, email)
    if existing:
        existing.hashed_password = hashed_password
        existing.role = role
        db.commit()
        db.refresh(existing)
        return existing

    uid = user_id or f"usr-{uuid.uuid4().hex[:8]}"
    user = UserModel(
        id=uid,
        email=email,
        hashed_password=hashed_password,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def to_schema(model: UserModel) -> UserSchema:
    """Convert ORM UserModel to contract UserSchema DTO."""
    return UserSchema(
        id=model.id,
        email=model.email,
        role=model.role,  # type: ignore[arg-type]
    )
