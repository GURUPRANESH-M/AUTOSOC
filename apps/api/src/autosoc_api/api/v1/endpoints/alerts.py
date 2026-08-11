from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from uuid import UUID

from autosoc_api.db.session import get_db_session
from autosoc_api.db.models.alert import Alert
from autosoc_api.schemas.alert import AlertResponse, AlertUpdate
from autosoc_api.auth.dependencies import require_roles
from autosoc_api.auth.models import Principal
from autosoc_api.audit.audit_service import audit_log

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    db: AsyncSession = Depends(get_db_session),
    user: Principal = Depends(require_roles(["soc_analyst", "admin", "security_manager", "auditor"])),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = 0
):
    stmt = select(Alert).order_by(desc(Alert.created_at)).limit(limit).offset(offset)
    if status:
        stmt = stmt.where(Alert.status == status)
    if severity:
        stmt = stmt.where(Alert.severity == severity)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: Principal = Depends(require_roles(["soc_analyst", "admin", "security_manager", "auditor"]))
):
    stmt = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: UUID,
    update_data: AlertUpdate,
    db: AsyncSession = Depends(get_db_session),
    user: Principal = Depends(require_roles(["soc_analyst", "admin"]))
):
    stmt = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    old_status = alert.status
    if update_data.status:
        alert.status = update_data.status
        
    await db.commit()
    await db.refresh(alert)
    
    await audit_log(
        db,
        user.subject_id,
        "UPDATE_ALERT_STATUS",
        f"Alert {alert_id} status changed from {old_status} to {alert.status}",
        True
    )
    
    return alert
