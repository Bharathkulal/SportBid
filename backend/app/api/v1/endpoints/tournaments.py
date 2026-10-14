from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, status, HTTPException

from app.schemas.auth import UserResponse
from app.models.user import UserRole
from app.models.tournament import RegistrationStatus, TournamentStatus
from app.schemas.tournament import (
    TournamentCreateRequest,
    TournamentUpdateRequest,
    TournamentResponse,
    RegistrationCreateRequest,
    RegistrationResponse,
    RegistrationReviewRequest,
)
from app.services.tournament_service import (
    TournamentService,
    doc_to_tournament_response,
    doc_to_registration_response,
)
from app.core.dependencies import get_current_user, require_organizer, require_player, require_player_or_organizer
from app.db.mongodb import db_manager

router = APIRouter(prefix="/tournaments")


# --- PUBLIC TOURNAMENT ENDPOINTS ---
@router.get(
    "/public",
    response_model=List[TournamentResponse],
    summary="List Public Published Tournaments",
)
async def list_public_tournaments():
    db = db_manager.db
    if db is None:
        return []
    cursor = db.tournaments.find({"status": TournamentStatus.PUBLISHED.value}).sort("start_date", 1)
    tournaments = await cursor.to_list(length=50)
    results = []
    for t in tournaments:
        total = await db.tournament_registrations.count_documents({"tournament_id": t["_id"]})
        approved = await db.tournament_registrations.count_documents(
            {"tournament_id": t["_id"], "status": RegistrationStatus.APPROVED.value}
        )
        results.append(doc_to_tournament_response(t, total, approved))
    return results


@router.get(
    "/{tournament_id}",
    response_model=TournamentResponse,
    summary="Get Tournament Details",
)
async def get_tournament(tournament_id: str):
    doc = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
    db = db_manager.db
    total = await db.tournament_registrations.count_documents({"tournament_id": doc["_id"]})
    approved = await db.tournament_registrations.count_documents(
        {"tournament_id": doc["_id"], "status": RegistrationStatus.APPROVED.value}
    )
    return doc_to_tournament_response(doc, total, approved)


@router.get(
    "/{tournament_id}/approved-posters",
    response_model=List[RegistrationResponse],
    summary="List Approved Player Posters for Public Gallery",
)
async def get_approved_posters(tournament_id: str):
    doc = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
    db = db_manager.db
    cursor = db.tournament_registrations.find({
        "tournament_id": doc["_id"],
        "status": RegistrationStatus.APPROVED.value,
    }).sort("created_at", -1)
    regs = await cursor.to_list(length=100)
    return [doc_to_registration_response(r) for r in regs]


# --- ORGANIZER TOURNAMENT MANAGEMENT ---
@router.post(
    "",
    response_model=TournamentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Tournament",
)
async def create_tournament(
    payload: TournamentCreateRequest,
    current_user: UserResponse = Depends(require_organizer),
):
    return await TournamentService.create_tournament(current_user.id, payload)


@router.get(
    "/organizer/mine",
    response_model=List[TournamentResponse],
    summary="List Organizer Tournaments",
)
async def get_my_tournaments(
    current_user: UserResponse = Depends(require_organizer),
):
    return await TournamentService.get_organizer_tournaments(current_user.id)


@router.patch(
    "/{tournament_id}",
    response_model=TournamentResponse,
    summary="Update Tournament Settings & Status",
)
async def update_tournament(
    tournament_id: str,
    payload: TournamentUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    return await TournamentService.update_tournament(
        tournament_id, current_user.id, is_admin, payload
    )


@router.get(
    "/{tournament_id}/registrations",
    response_model=List[RegistrationResponse],
    summary="List Tournament Registrations for Review",
)
async def list_tournament_registrations(
    tournament_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    doc = await TournamentService.get_tournament_by_id_or_slug(tournament_id)
    # Ownership authorization check
    if str(doc["organizer_id"]) != current_user.id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this tournament.",
        )
    db = db_manager.db
    cursor = db.tournament_registrations.find({"tournament_id": doc["_id"]}).sort("created_at", -1)
    regs = await cursor.to_list(length=200)
    return [doc_to_registration_response(r) for r in regs]


@router.post(
    "/{tournament_id}/registrations/{registration_id}/review",
    response_model=RegistrationResponse,
    summary="Approve or Reject Player Registration & Poster",
)
async def review_registration(
    tournament_id: str,
    registration_id: str,
    payload: RegistrationReviewRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    return await TournamentService.review_registration(
        tournament_id, registration_id, current_user.id, is_admin, payload
    )


# --- PLAYER REGISTRATION ENDPOINTS ---
@router.post(
    "/{tournament_id}/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Player Registers For Tournament",
)
async def register_player_for_tournament(
    tournament_id: str,
    payload: RegistrationCreateRequest,
    current_user: UserResponse = Depends(require_player_or_organizer),
):
    return await TournamentService.register_player(
        tournament_id=tournament_id,
        player_user_id=current_user.id,
        payload=payload,
    )


@router.get(
    "/player/my-registrations",
    response_model=List[RegistrationResponse],
    summary="List Player's Active Registrations & Posters",
)
async def get_my_registrations(
    current_user: UserResponse = Depends(require_player),
):
    db = db_manager.db
    if db is None:
        return []
    cursor = db.tournament_registrations.find({"player_id": ObjectId(current_user.id)}).sort("created_at", -1)
    regs = await cursor.to_list(length=100)
    return [doc_to_registration_response(r) for r in regs]
