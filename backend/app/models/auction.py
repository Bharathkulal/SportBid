from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class AuctionStatus(str, Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PlayerLotStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    IN_AUCTION = "IN_AUCTION"
    SOLD = "SOLD"
    UNSOLD = "UNSOLD"


class TeamModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    tournament_id: str
    name: str
    logo_url: Optional[str] = None
    owner_name: str
    owner_phone: str
    representative_user_id: Optional[str] = None  # User authorized to bid for team
    initial_budget: float
    remaining_budget: float
    roster_limit: int = 15
    purchased_players_count: int = 0
    created_at: datetime
    updated_at: datetime


class AuctionPlayerLot(BaseModel):
    registration_id: str
    player_id: str
    player_name: str
    sport: str
    role_or_pos: str
    jersey_number: Optional[str] = None
    poster_url: Optional[str] = None
    base_price: float
    current_bid: float = 0.0
    highest_bidder_team_id: Optional[str] = None
    highest_bidder_team_name: Optional[str] = None
    status: PlayerLotStatus = PlayerLotStatus.AVAILABLE
    sold_price: Optional[float] = None
    sold_to_team_id: Optional[str] = None
    sold_to_team_name: Optional[str] = None


class AuctionModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    tournament_id: str
    name: str
    start_time: datetime
    base_price_default: float = 1000.0
    min_bid_increment: float = 100.0
    status: AuctionStatus = AuctionStatus.DRAFT
    current_lot_index: int = -1
    timer_seconds: int = 30
    timer_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class BidModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    auction_id: str
    lot_registration_id: str
    team_id: str
    team_name: str
    bidder_user_id: str
    amount: float
    timestamp: datetime
