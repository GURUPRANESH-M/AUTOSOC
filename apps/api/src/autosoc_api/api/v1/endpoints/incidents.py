from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from autosoc_api.db.session import get_db_session
from autosoc_api.schemas.incident import IncidentResponse, IncidentUpdate, IncidentNoteResponse, IncidentNoteCreate
from autosoc_api.services.incident import IncidentService
from autosoc_api.services.incident_transition import IncidentTransitionService
from autosoc_api.db.models.incident import IncidentStatus

router = APIRouter()

@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db_session)
):
    service = IncidentService(db)
    return await service.get_all(skip=skip, limit=limit)

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)):
    service = IncidentService(db)
    return await service.get_by_id(incident_id)

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_status(
    incident_id: uuid.UUID, 
    status: IncidentStatus, 
    reason: str = None,
    db: AsyncSession = Depends(get_db_session)
):
    # Mock user_id for now
    user_id = "system"
    service = IncidentTransitionService(db)
    return await service.update_status(incident_id, status, user_id, reason)

@router.get("/{incident_id}/notes", response_model=List[IncidentNoteResponse])
async def get_notes(incident_id: uuid.UUID, db: AsyncSession = Depends(get_db_session)):
    service = IncidentService(db)
    return await service.get_notes(incident_id)

@router.post("/{incident_id}/notes", response_model=IncidentNoteResponse)
async def create_note(
    incident_id: uuid.UUID,
    note: IncidentNoteCreate,
    db: AsyncSession = Depends(get_db_session)
):
    # Mock user_id for now
    user_id = "system"
    service = IncidentService(db)
    return await service.create_note(incident_id, note, user_id)
