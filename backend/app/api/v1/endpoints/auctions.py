from typing import List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status, HTTPException

from app.schemas.auth import UserResponse
from app.models.user import UserRole
from app.schemas.auction import (
    TeamCreateRequest,
    TeamResponse,
    AuctionCreateRequest,
    AuctionStateResponse,
    BidPlacementRequest,
    BidResponse,
)
from app.services.auction_service import TeamService, AuctionService
from app.services.auction_ws import auction_ws_manager
from app.core.dependencies import get_current_user, require_organizer

router = APIRouter(prefix="/tournaments/{tournament_id}")


# --- TEAMS ENDPOINTS ---
@router.post(
    "/teams",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Tournament Team",
)
async def create_team(
    tournament_id: str,
    payload: TeamCreateRequest,
    current_user: UserResponse = Depends(require_organizer),
):
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    return await TeamService.create_team(tournament_id, current_user.id, is_admin, payload)


@router.get(
    "/teams",
    response_model=List[TeamResponse],
    summary="List Tournament Teams with Budgets & Rosters",
)
async def list_teams(tournament_id: str):
    return await TeamService.get_tournament_teams(tournament_id)


# --- AUCTION CONFIGURATION & STATE ---
@router.post(
    "/auction/config",
    summary="Configure Auction for Tournament",
)
async def configure_auction(
    tournament_id: str,
    payload: AuctionCreateRequest,
    current_user: UserResponse = Depends(require_organizer),
):
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    doc = await AuctionService.get_or_create_auction(tournament_id, current_user.id, is_admin, payload)
    return {"status": "success", "auction_id": str(doc["_id"])}


@router.get(
    "/auction/state",
    response_model=AuctionStateResponse,
    summary="Get Authoritative Live Auction Room State",
)
async def get_auction_state(tournament_id: str):
    return await AuctionService.get_auction_state(tournament_id)


# --- LIVE BIDDING & AUCTIONEER CONTROLS ---
@router.post(
    "/auction/bid",
    response_model=BidResponse,
    summary="Place Verified Bid in Live Auction",
)
async def place_bid(
    tournament_id: str,
    payload: BidPlacementRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    return await AuctionService.place_bid(
        tournament_id=tournament_id,
        user_id=current_user.id,
        user_role=current_user.role.value,
        payload=payload,
    )


@router.post(
    "/auction/control/{action}",
    summary="Auctioneer / Organizer Real-Time Controls",
)
async def auctioneer_control(
    tournament_id: str,
    action: str,  # START, PAUSE, SOLD, UNSOLD, COMPLETE
    current_user: UserResponse = Depends(get_current_user),
):
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    return await AuctionService.auctioneer_action(
        tournament_id=tournament_id,
        user_id=current_user.id,
        is_super_admin=is_admin,
        action=action.upper(),
    )


# --- WEBSOCKET LIVE STREAM ---
@router.websocket("/auction/ws")
async def auction_websocket(websocket: WebSocket, tournament_id: str):
    state = await AuctionService.get_auction_state(tournament_id)
    auction_id = state.id
    await auction_ws_manager.connect(auction_id, websocket)
    try:
        while True:
            # Keep-alive receive loop
            await websocket.receive_text()
    except WebSocketDisconnect:
        auction_ws_manager.disconnect(auction_id, websocket)
