"""Role-based access control and permission enforcement."""

from collections.abc import Callable

from fastapi import HTTPException, status

from driftsmith.api.schemas import Role, UserSchema


def check_role_permission(user: UserSchema, allowed_roles: tuple[Role, ...]) -> None:
    """Validate user has one of the allowed roles, raising 403 if unauthorized."""
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: {user.role} role does not have required permissions",
        )


def require_role(*allowed_roles: Role) -> Callable[[UserSchema], UserSchema]:
    """Factory creating FastAPI dependency that enforces role requirements."""

    def _role_checker(user: UserSchema) -> UserSchema:
        check_role_permission(user, allowed_roles)
        return user

    return _role_checker
