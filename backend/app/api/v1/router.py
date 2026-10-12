from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, dashboard, tournaments

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(dashboard.router, tags=["Dashboards"])
api_router.include_router(tournaments.router, tags=["Tournaments"])
