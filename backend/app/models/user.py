from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    PLAYER = "PLAYER"
    ORGANIZER = "ORGANIZER"
    SUPER_ADMIN = "SUPER_ADMIN"


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    SUSPENDED = "SUSPENDED"


class UserModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    full_name: str
    email: str
    phone_number: str
    password_hash: str
    role: UserRole
    account_status: AccountStatus = AccountStatus.ACTIVE
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None


class SessionModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    session_token_hash: str
    created_at: datetime
    expires_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
