"""Authentication router for session login and user profile inspection."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from driftsmith.api.deps import get_current_user, get_db_session
from driftsmith.api.schemas import LoginRequest, LoginResponse, UserSchema
from driftsmith.auth.passwords import verify_password
from driftsmith.auth.tokens import create_access_token
from driftsmith.db.repositories import users as users_repo

router = APIRouter(tags=["auth"])


@router.post("/api/auth/login", response_model=LoginResponse)
@router.post("/auth/login", response_model=LoginResponse)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db_session),
) -> LoginResponse:
    """Authenticate email and password, issuing a JWT access token."""
    user = users_repo.get_by_email(db, credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_dto = users_repo.to_schema(user)
    token = create_access_token(user.id, user.email, user_dto.role)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user_dto,
    )


@router.get("/api/auth/me", response_model=UserSchema)
@router.get("/auth/me", response_model=UserSchema)
def get_me(user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Return profile information for currently authenticated user."""
    return user
