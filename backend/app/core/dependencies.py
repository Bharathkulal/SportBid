from typing import Callable, List
from fastapi import Depends, HTTPException, status, Request
from app.models.user import UserRole
from app.schemas.auth import UserResponse
from app.services.auth_service import AuthService


async def get_current_user(request: Request) -> UserResponse:
    """Dependency that resolves the authenticated user from the active session cookie."""
    return await AuthService.get_current_user_from_request(request)


def require_roles(*allowed_roles: UserRole) -> Callable:
    """Dependency factory enforcing role-based authorization."""
    async def role_checker(
        current_user: UserResponse = Depends(get_current_user),
    ) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires role {', '.join([r.value for r in allowed_roles])}.",
            )
        return current_user

    return role_checker


# Convenient pre-configured role dependencies
require_player = require_roles(UserRole.PLAYER)
require_organizer = require_roles(UserRole.ORGANIZER)
require_super_admin = require_roles(UserRole.SUPER_ADMIN)
require_player_or_organizer = require_roles(UserRole.PLAYER, UserRole.ORGANIZER)
