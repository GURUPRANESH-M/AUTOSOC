import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from autosoc_api.db.session import get_db_session
from autosoc_api.auth.dependencies import get_current_principal, require_roles
from autosoc_api.auth.models import Principal
from autosoc_api.db.models.incident import Incident
from autosoc_api.db.models.agent_execution import AgentExecution
from autosoc_api.schemas.agent_execution import (
    AgentExecutionCreate,
    AgentExecutionResponse,
    AgentExecutionStatus
)
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

async def trigger_agent_worker(execution_id: str, incident_id: str, workflow_type: str):
    """
    In a real event-driven architecture, this might publish to Redpanda. 
    For simplicity in MVP, we can call an internal HTTP endpoint on the agent worker 
    or let the agent worker poll/listen to a specific topic.
    Here we simulate HTTP trigger or we can publish to a topic.
    """
    # Just a placeholder log for MVP if we rely on HTTP
    logger.info(f"Triggering agent worker for execution {execution_id}")
    try:
        # We can implement a direct call to the worker if we add an HTTP listener
        # Or we rely on Redpanda. Let's assume we use Redpanda.
        pass
    except Exception as e:
        logger.error(f"Failed to trigger agent worker: {e}")

@router.post("/{incident_id}/agents/investigate", response_model=AgentExecutionResponse)
async def investigate_incident(
    incident_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    request: AgentExecutionCreate = None,
    db: AsyncSession = Depends(get_db_session),
    # Only SOC Analysts and Admins can start an investigation
    current_user: Principal = Depends(require_roles(["soc_analyst", "admin"]))
) -> Any:
    """
    Start an Agentic AI investigation for an incident.
    """
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if not request:
        request = AgentExecutionCreate(incident_id=incident_id)

    # Check for existing running execution
    result = await db.execute(
        select(AgentExecution)
        .where(AgentExecution.incident_id == incident_id)
        .where(AgentExecution.status.in_([AgentExecutionStatus.QUEUED, AgentExecutionStatus.RUNNING]))
    )
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=409, 
            detail=f"An investigation is already running for this incident (execution_id: {existing.id})"
        )

    execution = AgentExecution(
        incident_id=incident_id,
        workflow_type=request.workflow_type,
        status=AgentExecutionStatus.QUEUED,
        requested_by=current_user.username
    )
    
    db.add(execution)
    await db.commit()
    await db.refresh(execution)
    
    # Trigger background execution (via Redpanda/HTTP)
    background_tasks.add_task(trigger_agent_worker, str(execution.id), str(incident_id), request.workflow_type)
    
    return execution

@router.get("/{incident_id}/agents", response_model=List[AgentExecutionResponse])
async def list_incident_investigations(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Principal = Depends(get_current_principal)
) -> Any:
    """
    List all agent investigations for an incident.
    """
    result = await db.execute(
        select(AgentExecution)
        .where(AgentExecution.incident_id == incident_id)
        .order_by(AgentExecution.created_at.desc())
    )
    executions = result.scalars().all()
    return executions

@router.get("/agent-executions/{execution_id}", response_model=AgentExecutionResponse)
async def get_agent_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Principal = Depends(get_current_principal)
) -> Any:
    """
    Get details of a specific agent execution.
    """
    execution = await db.get(AgentExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution

@router.post("/agent-executions/{execution_id}/cancel", status_code=202)
async def cancel_agent_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Principal = Depends(require_roles(["soc_analyst", "admin"]))
) -> Any:
    """
    Cancel a running agent execution safely.
    """
    execution = await db.get(AgentExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    if execution.status not in [AgentExecutionStatus.QUEUED, AgentExecutionStatus.RUNNING]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel execution in state {execution.status}")
        
    execution.status = AgentExecutionStatus.CANCELLED
    await db.commit()
    
    return {"message": "Cancellation requested successfully"}
