from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse
from app.core.dependencies import require_super_admin
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin")


class StatusUpdateRequest(BaseModel):
    new_status: str = Field(..., min_length=2)


class TeamBudgetUpdateRequest(BaseModel):
    new_budget: float = Field(..., ge=0.0)


class SystemSettingsUpdateRequest(BaseModel):
    platform_name: Optional[str] = None
    support_email: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    allow_new_registrations: Optional[bool] = None
    default_currency: Optional[str] = None
    max_poster_upload_mb: Optional[int] = None
    auto_approval_enabled: Optional[bool] = None
    banner_announcement: Optional[str] = None


@router.get("/stats", summary="Get Super Admin Overview Stats")
async def get_admin_overview(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_overview_stats()


@router.get("/tournaments", summary="List All Tournaments (Admin)")
async def list_tournaments_admin(
    status: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_all_tournaments(status, sport, search)


@router.patch("/tournaments/{tournament_id}/status", summary="Update Tournament Status (Admin)")
async def update_tournament_status_admin(
    tournament_id: str,
    payload: StatusUpdateRequest,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.update_tournament_status(tournament_id, payload.new_status, current_user)


@router.delete("/tournaments/{tournament_id}", summary="Delete Tournament (Admin)")
async def delete_tournament_admin(
    tournament_id: str,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.delete_tournament(tournament_id, current_user)


@router.get("/organizers", summary="List All Organizers (Admin)")
async def list_organizers_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_all_organizers()


@router.patch("/organizers/{user_id}/status", summary="Verify/Suspend Organizer (Admin)")
async def update_organizer_status_admin(
    user_id: str,
    payload: StatusUpdateRequest,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.update_user_status(user_id, payload.new_status, current_user)


@router.get("/players", summary="List All Players (Admin)")
async def list_players_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_all_players()


@router.patch("/players/{user_id}/status", summary="Update Player Account Status (Admin)")
async def update_player_status_admin(
    user_id: str,
    payload: StatusUpdateRequest,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.update_user_status(user_id, payload.new_status, current_user)


@router.get("/teams", summary="List All Teams (Admin)")
async def list_teams_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_all_teams()


@router.patch("/teams/{team_id}/budget", summary="Update Team Budget (Admin)")
async def update_team_budget_admin(
    team_id: str,
    payload: TeamBudgetUpdateRequest,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.update_team_budget(team_id, payload.new_budget, current_user)


@router.get("/auctions", summary="Monitor Live and Scheduled Auctions (Admin)")
async def list_auctions_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_all_auctions()


@router.patch("/auctions/{auction_id}/status", summary="Override Auction Status (Admin)")
async def update_auction_status_admin(
    auction_id: str,
    payload: StatusUpdateRequest,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.update_auction_status(auction_id, payload.new_status, current_user)


@router.get("/results", summary="Get Global Auction Results (Admin)")
async def get_auction_results_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_auction_results()


@router.get("/analytics", summary="Get Platform Analytics (Admin)")
async def get_analytics_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_platform_analytics()


@router.get("/activity-logs", summary="Get Admin Activity History Logs")
async def get_activity_logs_admin(
    limit: int = Query(50, ge=1, le=200),
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_activity_logs(limit)


@router.get("/settings", summary="Get System Settings (Admin)")
async def get_system_settings_admin(
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.get_system_settings()


@router.patch("/settings", summary="Update System Settings (Admin)")
async def update_system_settings_admin(
    payload: SystemSettingsUpdateRequest,
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.update_system_settings(payload.model_dump(exclude_unset=True), current_user)


@router.get("/reports/export", summary="Export Data Report (Admin)")
async def export_data_admin(
    type: str = Query("tournaments", pattern="^(tournaments|organizers|players|teams)$"),
    current_user: UserResponse = Depends(require_super_admin),
):
    return await AdminService.export_data(type)
