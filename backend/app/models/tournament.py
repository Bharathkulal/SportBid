from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SportType(str, Enum):
    VOLLEYBALL = "VOLLEYBALL"
    CRICKET = "CRICKET"
    FOOTBALL = "FOOTBALL"
    KABADDI = "KABADDI"
    BASKETBALL = "BASKETBALL"
    CUSTOM = "CUSTOM"


class TournamentStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    PUBLISHED = "PUBLISHED"
    REGISTRATION_CLOSED = "REGISTRATION_CLOSED"
    COMPLETED = "COMPLETED"


class RegistrationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PosterStatus(str, Enum):
    RENDERING = "RENDERING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class CustomFieldType(str, Enum):
    TEXT = "TEXT"
    NUMBER = "NUMBER"
    SELECT = "SELECT"


class CustomFieldDefinition(BaseModel):
    key: str
    label: str
    field_type: CustomFieldType = CustomFieldType.TEXT
    required: bool = True
    options: Optional[List[str]] = None  # For SELECT fields
    help_text: Optional[str] = None


class TournamentModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    organizer_id: str
    title: str
    slug: str
    sport: SportType
    description: str
    venue: str
    city: str
    state: str
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    entry_fee: float = 0.0
    rules: List[str] = []
    status: TournamentStatus = TournamentStatus.DRAFT
    custom_fields: List[CustomFieldDefinition] = []
    banner_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TournamentRegistrationModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    tournament_id: str
    player_id: str  # User ID of the player
    registration_number: str
    player_name: str
    player_phone: str
    player_photo_url: str
    custom_field_values: Dict[str, Any] = {}
    status: RegistrationStatus = RegistrationStatus.PENDING
    rejection_reason: Optional[str] = None
    poster_id: Optional[str] = None
    poster_url: Optional[str] = None
    poster_status: PosterStatus = PosterStatus.RENDERING
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
