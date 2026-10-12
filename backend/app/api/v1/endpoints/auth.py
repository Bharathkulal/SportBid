from fastapi import APIRouter, Depends, Request, Response, status
from app.schemas.auth import (
    PlayerRegisterRequest,
    OrganizerRegisterRequest,
    LoginRequest,
    UserResponse,
    AuthSuccessResponse,
)
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth")


@router.post(
    "/register/player",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Player Account",
    description="Registers a new player account with email uniqueness validation and password hashing.",
)
async def register_player(payload: PlayerRegisterRequest) -> UserResponse:
    return await AuthService.register_player(payload)


@router.post(
    "/register/organizer",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Organizer Account",
    description="Registers a new tournament organizer account.",
)
async def register_organizer(payload: OrganizerRegisterRequest) -> UserResponse:
    return await AuthService.register_organizer(payload)


@router.post(
    "/login",
    response_model=AuthSuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Login User",
    description="Authenticates credentials and establishes a secure HttpOnly session cookie.",
)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
) -> AuthSuccessResponse:
    user, _ = await AuthService.authenticate_user(payload, request, response)
    return AuthSuccessResponse(
        message="Login successful.",
        user=user,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout User",
    description="Invalidates current session and clears the session cookie.",
)
async def logout(request: Request, response: Response):
    await AuthService.logout_session(request, response)
    return {"message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current Authenticated User",
    description="Retrieves the authenticated user from the active session.",
)
async def get_me(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    return current_user
