from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status, Request, Response

from app.core.config import settings
from app.core.security import hash_password, verify_password, generate_session_token, hash_session_token
from app.core.logging import logger
from app.db.mongodb import db_manager
from app.models.user import UserRole, AccountStatus
from app.schemas.auth import (
    PlayerRegisterRequest,
    OrganizerRegisterRequest,
    LoginRequest,
    UserResponse,
)


def user_doc_to_response(doc: dict) -> UserResponse:
    """Safely converts MongoDB user document to UserResponse, never returning password_hash."""
    return UserResponse(
        id=str(doc["_id"]),
        full_name=doc["full_name"],
        email=doc["email"],
        phone_number=doc["phone_number"],
        role=doc["role"],
        account_status=doc["account_status"],
        created_at=doc["created_at"],
        last_login_at=doc.get("last_login_at"),
    )


class AuthService:
    @staticmethod
    async def register_player(payload: PlayerRegisterRequest) -> UserResponse:
        db = db_manager.db
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable",
            )

        # Check existing email
        existing = await db.users.find_one({"email": payload.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "full_name": payload.full_name,
            "email": payload.email,
            "phone_number": payload.phone_number,
            "password_hash": hash_password(payload.password),
            "role": UserRole.PLAYER.value,
            "account_status": AccountStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now,
            "last_login_at": None,
        }

        try:
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id

            # Create default player profile document
            await db.player_profiles.insert_one({
                "user_id": result.inserted_id,
                "full_name": payload.full_name,
                "phone_number": payload.phone_number,
                "created_at": now,
                "updated_at": now,
            })

            logger.info(f"Registered new PLAYER account: {payload.email} (id: {result.inserted_id})")
            return user_doc_to_response(user_doc)
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

    @staticmethod
    async def register_organizer(payload: OrganizerRegisterRequest) -> UserResponse:
        db = db_manager.db
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable",
            )

        existing = await db.users.find_one({"email": payload.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

        now = datetime.now(timezone.utc)
        user_doc = {
            "full_name": payload.full_name,
            "email": payload.email,
            "phone_number": payload.phone_number,
            "organization_name": payload.organization_name,
            "password_hash": hash_password(payload.password),
            "role": UserRole.ORGANIZER.value,
            "account_status": AccountStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now,
            "last_login_at": None,
        }

        try:
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id

            # Create organizer profile document
            await db.organizer_profiles.insert_one({
                "user_id": result.inserted_id,
                "organization_name": payload.organization_name or payload.full_name,
                "created_at": now,
                "updated_at": now,
            })

            logger.info(f"Registered new ORGANIZER account: {payload.email} (id: {result.inserted_id})")
            return user_doc_to_response(user_doc)
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

    @staticmethod
    async def authenticate_user(
        payload: LoginRequest,
        request: Request,
        response: Response,
    ) -> Tuple[UserResponse, str]:
        db = db_manager.db
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable",
            )

        # Generic failure message to prevent email enumeration
        generic_error = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Cookie"},
        )

        user_doc = await db.users.find_one({"email": payload.email})
        if not user_doc:
            raise generic_error

        if not verify_password(payload.password, user_doc["password_hash"]):
            raise generic_error

        if user_doc.get("account_status") == AccountStatus.SUSPENDED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is suspended. Please contact support.",
            )

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.SESSION_EXPIRE_DAYS)

        # Generate secure session token and store SHA-256 hash in database
        raw_session_token = generate_session_token()
        session_token_hash = hash_session_token(raw_session_token)

        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        await db.sessions.insert_one({
            "user_id": str(user_doc["_id"]),
            "session_token_hash": session_token_hash,
            "created_at": now,
            "expires_at": expires_at,
            "ip_address": client_ip,
            "user_agent": user_agent,
        })

        # Update last_login_at on user
        await db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"last_login_at": now, "updated_at": now}},
        )
        user_doc["last_login_at"] = now

        # Set HttpOnly, Secure session cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=raw_session_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=int(timedelta(days=settings.SESSION_EXPIRE_DAYS).total_seconds()),
            path="/",
        )

        logger.info(f"User logged in successfully: {user_doc['email']} (role: {user_doc['role']})")
        return user_doc_to_response(user_doc), raw_session_token

    @staticmethod
    async def logout_session(request: Request, response: Response) -> None:
        db = db_manager.db
        token = request.cookies.get(settings.SESSION_COOKIE_NAME)
        if db is not None and token:
            token_hash = hash_session_token(token)
            await db.sessions.delete_many({"session_token_hash": token_hash})

        # Clear cookie
        response.delete_cookie(
            key=settings.SESSION_COOKIE_NAME,
            path="/",
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
        )

    @staticmethod
    async def get_current_user_from_request(request: Request) -> UserResponse:
        db = db_manager.db
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable",
            )

        token = request.cookies.get(settings.SESSION_COOKIE_NAME)
        # Also check Authorization header Bearer token as secondary fallback for programmatic clients/tests
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.replace("Bearer ", "").strip()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated.",
            )

        token_hash = hash_session_token(token)
        now = datetime.now(timezone.utc)

        session_doc = await db.sessions.find_one({
            "session_token_hash": token_hash,
            "expires_at": {"$gt": now},
        })

        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has expired or is invalid.",
            )

        user_id = session_doc["user_id"]
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session user reference.",
            )

        user_doc = await db.users.find_one({"_id": obj_id})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with this session no longer exists.",
            )

        if user_doc.get("account_status") == AccountStatus.SUSPENDED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is suspended.",
            )

        return user_doc_to_response(user_doc)
