from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.db.mongodb import db_manager
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Returns API service health, environment info, and database reachability status.",
)
async def health_check() -> HealthResponse:
    db_ok = await db_manager.ping()
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version="0.1.0",
        environment=settings.APP_ENV,
        database="connected" if db_ok else "disconnected",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
