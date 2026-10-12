from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.auction import AuctionStatus, PlayerLotStatus, AuctionPlayerLot


# --- TEAM SCHEMAS ---
class TeamCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    logo_url: Optional[str] = None
    owner_name: str = Field(..., min_length=2, max_length=100)
    owner_phone: str = Field(..., min_length=7, max_length=20)
    representative_email: Optional[str] = None  # Authorize existing user as bidder
    initial_budget: float = Field(..., gt=0.0)
    roster_limit: int = Field(15, ge=1, le=50)


class TeamUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    logo_url: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    representative_email: Optional[str] = None
    initial_budget: Optional[float] = Field(None, gt=0.0)
    roster_limit: Optional[int] = Field(None, ge=1, le=50)


class PurchasedPlayerSummary(BaseModel):
    registration_id: str
    player_name: str
    role_or_pos: str
    sold_price: float
    poster_url: Optional[str] = None


class TeamResponse(BaseModel):
    id: str
    tournament_id: str
    name: str
    logo_url: Optional[str] = None
    owner_name: str
    owner_phone: str
    representative_user_id: Optional[str] = None
    initial_budget: float
    remaining_budget: float
    roster_limit: int
    purchased_players_count: int
    purchased_players: List[PurchasedPlayerSummary] = []
    created_at: datetime
    updated_at: datetime


# --- AUCTION SCHEMAS ---
class AuctionCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    start_time: datetime
    base_price_default: float = Field(1000.0, ge=100.0)
    min_bid_increment: float = Field(100.0, ge=10.0)
    timer_seconds: int = Field(30, ge=10, le=180)


class AuctionUpdateRequest(BaseModel):
    name: Optional[str] = None
    start_time: Optional[datetime] = None
    base_price_default: Optional[float] = None
    min_bid_increment: Optional[float] = None
    timer_seconds: Optional[int] = None
    status: Optional[AuctionStatus] = None


class BidPlacementRequest(BaseModel):
    team_id: str
    amount: float = Field(..., gt=0.0)


class BidResponse(BaseModel):
    id: str
    auction_id: str
    lot_registration_id: str
    team_id: str
    team_name: str
    amount: float
    timestamp: datetime


class AuctionStateResponse(BaseModel):
    id: str
    tournament_id: str
    name: str
    status: AuctionStatus
    base_price_default: float
    min_bid_increment: float
    timer_seconds: int
    timer_deadline: Optional[datetime] = None
    current_lot_index: int
    current_lot: Optional[AuctionPlayerLot] = None
    total_lots_count: int
    sold_lots_count: int
    unsold_lots_count: int
    bids_history: List[BidResponse] = []
    teams: List[TeamResponse] = []
