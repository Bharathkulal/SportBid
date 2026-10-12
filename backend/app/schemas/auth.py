import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import UserRole, AccountStatus


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    if not (7 <= len(re.sub(r"\D", "", cleaned)) <= 15):
        raise ValueError("Invalid phone number format. Must contain 7 to 15 digits.")
    return cleaned


class PlayerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)


class OrganizerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    organization_name: Optional[str] = Field(None, max_length=150)
    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: str
    role: UserRole
    account_status: AccountStatus
    created_at: datetime
    last_login_at: Optional[datetime] = None


class AuthSuccessResponse(BaseModel):
    message: str
    user: UserResponse
