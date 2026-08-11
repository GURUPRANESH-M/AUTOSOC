from fastapi import APIRouter, Response
from autosoc_api.schemas.health import HealthResponse, VersionResponse
from autosoc_api.core.config import settings

router = APIRouter()

@router.get("/live", response_model=HealthResponse)
def get_liveness() -> HealthResponse:
    """Check if the API process is running."""
    return HealthResponse(status="alive", components={"api": "ok"})

@router.get("/ready", response_model=HealthResponse)
def get_readiness(response: Response) -> HealthResponse:
    """Check if the API is ready to accept traffic."""
    # Phase 3: No databases to check yet. Mark them as not_configured.
    components = {
        "api": "ok",
        "database": "not_configured",
        "opensearch": "not_configured",
        "redpanda": "not_configured"
    }
    
    return HealthResponse(status="ready", components=components)

@router.get("/version", response_model=VersionResponse)
def get_version() -> VersionResponse:
    """Get application version information."""
    return VersionResponse(
        app_name=settings.PROJECT_NAME,
        app_version=settings.APP_VERSION,
        api_version=settings.API_VERSION,
        environment=settings.ENVIRONMENT,
        commit_id=settings.COMMIT_ID
    )
