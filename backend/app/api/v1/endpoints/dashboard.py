from fastapi import APIRouter, Depends
from app.schemas.auth import UserResponse
from app.core.dependencies import require_player, require_organizer, require_super_admin

router = APIRouter(prefix="/dashboard")


@router.get("/player", summary="Player Dashboard Protected Data")
async def get_player_dashboard(current_user: UserResponse = Depends(require_player)):
    return {
        "status": "success",
        "message": f"Welcome to the Player Arena, {current_user.full_name}",
        "profile": current_user,
        "tournaments_registered": 0,
        "approved_posters": 0,
    }


@router.get("/organizer", summary="Organizer Dashboard Protected Data")
async def get_organizer_dashboard(current_user: UserResponse = Depends(require_organizer)):
    return {
        "status": "success",
        "message": f"Welcome to Organizer Command, {current_user.full_name}",
        "profile": current_user,
        "active_tournaments": 0,
        "pending_registrations": 0,
    }


@router.get("/admin", summary="Super Admin Dashboard Protected Data")
async def get_admin_dashboard(current_user: UserResponse = Depends(require_super_admin)):
    return {
        "status": "success",
        "message": f"Welcome Super Administrator {current_user.full_name}",
        "profile": current_user,
        "system_status": "operational",
    }
