from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, text
import httpx

from autosoc_api.db.session import get_db_session
from autosoc_api.db.models.alert import Alert
from autosoc_api.db.models.incident import Incident
from autosoc_api.db.models.incident_alert import IncidentAlert
from autosoc_api.db.models.incident_event import IncidentEvent
from autosoc_api.db.models.incident_note import IncidentNote
from autosoc_api.db.models.incident_timeline import IncidentTimeline
from autosoc_api.db.models.attack import IncidentAttackMapping
from autosoc_api.db.models.prediction import Prediction
from autosoc_api.db.models.agent_execution import AgentExecution
from autosoc_api.db.models.response import ResponseRecommendation, ResponseApproval, ResponseExecution
from autosoc_api.db.models.audit_log import AuditLog
from autosoc_api.core.config import settings

router = APIRouter()

@router.delete("/purge-all")
@router.post("/purge-all")
async def purge_all_database_records(db: AsyncSession = Depends(get_db_session)):
    """
    Purges all Incidents, Alerts, Notes, Timelines, Predictions from PostgreSQL
    and wipes all ingested security event indexes from OpenSearch.
    """
    try:
        # 1. Purge PostgreSQL Tables in child-first dependency order
        try:
            await db.execute(delete(IncidentAlert))
            await db.execute(delete(IncidentEvent))
            await db.execute(delete(IncidentNote))
            await db.execute(delete(IncidentTimeline))
            await db.execute(delete(IncidentAttackMapping))
            await db.execute(delete(Prediction))
            await db.execute(delete(AgentExecution))
            await db.execute(delete(ResponseApproval))
            await db.execute(delete(ResponseExecution))
            await db.execute(delete(ResponseRecommendation))
            await db.execute(delete(AuditLog))
            await db.execute(delete(Alert))
            await db.execute(delete(Incident))
            await db.commit()
        except Exception:
            await db.rollback()
            # Fallback to TRUNCATE CASCADE for all operational tables
            await db.execute(text(
                "TRUNCATE TABLE incident_alerts, incident_events, incident_notes, "
                "incident_timelines, incident_attack_mappings, predictions, agent_executions, "
                "response_approvals, response_executions, response_recommendations, "
                "audit_logs, alerts, incidents RESTART IDENTITY CASCADE;"
            ))
            await db.commit()

        # 2. Wipe OpenSearch Events Index
        opensearch_url = settings.OPENSEARCH_HOSTS.rstrip("/")

        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            try:
                # Delete all events indexes matching autosoc-events-*
                await client.delete(f"{opensearch_url}/autosoc-events-*")
            except Exception as os_err:
                print("OpenSearch purge warning:", os_err)

        return {
            "status": "success",
            "message": "All database records, alerts, incidents, predictions, and log events have been completely purged.",
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to purge database records: {str(e)}"
        )

