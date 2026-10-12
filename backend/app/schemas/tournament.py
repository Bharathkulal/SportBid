from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.models.tournament import SportType, TournamentStatus, CustomFieldDefinition, RegistrationStatus, PosterStatus


def default_fields_for_sport(sport: SportType) -> List[CustomFieldDefinition]:
    if sport == SportType.VOLLEYBALL:
        return [
            CustomFieldDefinition(
                key="position",
                label="Playing Position",
                field_type="SELECT",
                required=True,
                options=["Attacker / Outside Hitter", "Setter", "Middle Blocker", "Libero", "Opposite Hitter"],
            ),
            CustomFieldDefinition(
                key="jersey_number",
                label="Preferred Jersey Number",
                field_type="NUMBER",
                required=False,
            ),
            CustomFieldDefinition(
                key="spike_reach_cm",
                label="Spike Reach (cm)",
                field_type="NUMBER",
                required=False,
            ),
        ]
    elif sport == SportType.CRICKET:
        return [
            CustomFieldDefinition(
                key="role",
                label="Player Role",
                field_type="SELECT",
                required=True,
                options=["Top-order Batsman", "Middle-order Batsman", "Wicket-keeper Batsman", "All-rounder (Batting)", "All-rounder (Bowling)", "Fast Bowler", "Spin Bowler"],
            ),
            CustomFieldDefinition(
                key="batting_hand",
                label="Batting Hand",
                field_type="SELECT",
                required=True,
                options=["Right Hand", "Left Hand"],
            ),
            CustomFieldDefinition(
                key="bowling_style",
                label="Bowling Style",
                field_type="SELECT",
                required=False,
                options=["Right-arm Fast", "Right-arm Medium", "Right-arm Spin (Off)", "Right-arm Spin (Leg)", "Left-arm Fast", "Left-arm Spin", "None / Non-bowler"],
            ),
            CustomFieldDefinition(
                key="jersey_number",
                label="Preferred Jersey Number",
                field_type="NUMBER",
                required=False,
            ),
        ]
    else:
        return [
            CustomFieldDefinition(
                key="position",
                label="Primary Position / Role",
                field_type="TEXT",
                required=True,
            ),
            CustomFieldDefinition(
                key="jersey_number",
                label="Jersey Number",
                field_type="NUMBER",
                required=False,
            ),
        ]


class TournamentCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    sport: SportType
    description: str = Field(..., min_length=10)
    venue: str = Field(..., min_length=3, max_length=150)
    city: str = Field(..., min_length=2, max_length=80)
    state: str = Field(..., min_length=2, max_length=80)
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    entry_fee: float = Field(0.0, ge=0.0)
    rules: List[str] = []
    custom_fields: Optional[List[CustomFieldDefinition]] = None


class TournamentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    sport: Optional[SportType] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    entry_fee: Optional[float] = Field(None, ge=0.0)
    rules: Optional[List[str]] = None
    status: Optional[TournamentStatus] = None
    custom_fields: Optional[List[CustomFieldDefinition]] = None


class TournamentResponse(BaseModel):
    id: str
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
    entry_fee: float
    rules: List[str]
    status: TournamentStatus
    custom_fields: List[CustomFieldDefinition]
    created_at: datetime
    updated_at: datetime
    total_registrations: int = 0
    approved_registrations: int = 0


class RegistrationCreateRequest(BaseModel):
    player_name: str = Field(..., min_length=2, max_length=100)
    player_phone: str = Field(..., min_length=7, max_length=20)
    player_photo_base64: Optional[str] = None  # Or provided via multipart/upload
    custom_field_values: Dict[str, Any] = {}


class RegistrationReviewRequest(BaseModel):
    status: RegistrationStatus  # APPROVED or REJECTED
    rejection_reason: Optional[str] = None


class RegistrationResponse(BaseModel):
    id: str
    tournament_id: str
    player_id: str
    registration_number: str
    player_name: str
    player_phone: str
    player_photo_url: str
    custom_field_values: Dict[str, Any]
    status: RegistrationStatus
    rejection_reason: Optional[str] = None
    poster_url: Optional[str] = None
    poster_status: PosterStatus
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
