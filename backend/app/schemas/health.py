from pydantic import BaseModel, Field
from typing import Optional


class HealthResponse(BaseModel):
    status: str = Field(..., description="Application operational status")
    app: str = Field(..., description="Application name")
    version: str = Field(..., description="API Version")
    environment: str = Field(..., description="Deployment environment")
    database: str = Field(..., description="Database connection status: connected or disconnected")
    timestamp: str = Field(..., description="Current ISO UTC timestamp")


class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: Optional[dict] = None
