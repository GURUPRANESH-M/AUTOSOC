from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import UUID4
from datetime import datetime, UTC, timedelta

from autosoc_api.api import dependencies
from autosoc_api.auth.dependencies import get_current_principal, require_permission
from autosoc_api.auth.models import Principal
from autosoc_api.db.models.response import ResponseRecommendation, ResponseApproval, ResponseExecution
from autosoc_api.schemas.response import (
    ResponseRecommendationCreate, ResponseRecommendationResponse,
    ResponseApprovalRequest, ResponseApprovalResponse, ResponseApprovalAction,
    ResponseExecutionCreate, ResponseExecutionResponse
)
# Redpanda / Event bus can be published to later for worker processing

router = APIRouter()

@router.post("/incidents/{incident_id}/responses", response_model=ResponseRecommendationResponse)
def create_recommendation(
    incident_id: UUID4,
    recommendation_in: ResponseRecommendationCreate,
    db: Session = Depends(dependencies.get_db),
    current_user: Principal = Depends(require_permission("responses:recommend"))
) -> Any:
    """
    Create a new response recommendation.
    """
    if str(incident_id) != str(recommendation_in.incident_id):
        raise HTTPException(status_code=400, detail="Incident ID mismatch")
    
    recommendation = ResponseRecommendation(
        **recommendation_in.model_dump(),
        created_by=current_user.username
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return recommendation

@router.get("/incidents/{incident_id}/responses", response_model=List[ResponseRecommendationResponse])
def list_recommendations(
    incident_id: UUID4,
    db: Session = Depends(dependencies.get_db),
    current_user: Principal = Depends(require_permission("responses:read"))
) -> Any:
    """
    List response recommendations for an incident.
    """
    return db.query(ResponseRecommendation).filter(ResponseRecommendation.incident_id == incident_id).all()

@router.post("/responses/{recommendation_id}/request-approval", response_model=ResponseApprovalResponse)
def request_approval(
    recommendation_id: UUID4,
    db: Session = Depends(dependencies.get_db),
    current_user: Principal = Depends(require_permission("responses:recommend"))
) -> Any:
    """
    Request approval for a proposed recommendation.
    """
    recommendation = db.query(ResponseRecommendation).filter(ResponseRecommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    if recommendation.status != "proposed":
        raise HTTPException(status_code=400, detail="Recommendation is not in proposed state")
        
    recommendation.status = "pending_review"
    
    approval = ResponseApproval(
        recommendation_id=recommendation.id,
        incident_id=recommendation.incident_id,
        requested_by=current_user.username
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return approval

@router.post("/responses/{recommendation_id}/approve", response_model=ResponseApprovalResponse)
def approve_recommendation(
    recommendation_id: UUID4,
    action: ResponseApprovalAction,
    db: Session = Depends(dependencies.get_db),
    current_user: Principal = Depends(require_permission("responses:approve"))
) -> Any:
    """
    Approve or reject a recommendation.
    """
    recommendation = db.query(ResponseRecommendation).filter(ResponseRecommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    approval = db.query(ResponseApproval).filter(
        ResponseApproval.recommendation_id == recommendation_id,
        ResponseApproval.decision == "pending"
    ).first()
    
    if not approval:
        raise HTTPException(status_code=400, detail="No pending approval request found")
        
    # Optional separation of duties check could go here
    # if approval.requested_by == current_user.username:
    #     raise HTTPException(status_code=403, detail="Requester cannot approve their own request")
        
    approval.decision = action.decision
    approval.reviewer = current_user.username
    approval.decision_at = datetime.now(UTC)
    approval.reason = action.reason
    
    if action.decision == "approved":
        recommendation.status = "approved"
        # Set expiration to 60 minutes from now
        approval.expiration = datetime.now(UTC) + timedelta(minutes=60)
    else:
        recommendation.status = "rejected"
        
    db.commit()
    db.refresh(approval)
    return approval

@router.post("/responses/{recommendation_id}/execute", response_model=ResponseExecutionResponse)
def execute_recommendation(
    recommendation_id: UUID4,
    execution_in: ResponseExecutionCreate,
    db: Session = Depends(dependencies.get_db),
    current_user: Principal = Depends(require_permission("responses:execute"))
) -> Any:
    """
    Execute a response (dry-run, simulation, analyst_approved_execution).
    """
    recommendation = db.query(ResponseRecommendation).filter(ResponseRecommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    if execution_in.mode == "analyst_approved_execution":
        if recommendation.status != "approved":
            raise HTTPException(status_code=400, detail="Execution requires an approved recommendation")
            
        approval = db.query(ResponseApproval).filter(
            ResponseApproval.recommendation_id == recommendation_id,
            ResponseApproval.decision == "approved"
        ).first()
        
        if not approval or (approval.expiration and approval.expiration < datetime.now(UTC)):
            raise HTTPException(status_code=400, detail="Valid unexpired approval required for execution")
    
    # Check for idempotency / avoid duplicate executions
    # In a full impl, idempotency key might be sent by the client, here we generate one or use standard pattern
    idempotency_key = f"{recommendation_id}_{execution_in.mode}"
    
    existing = db.query(ResponseExecution).filter(ResponseExecution.idempotency_key == idempotency_key).first()
    if existing:
        return existing
        
    execution = ResponseExecution(
        recommendation_id=recommendation.id,
        approval_id=approval.id if execution_in.mode == "analyst_approved_execution" else None,
        playbook_id=recommendation.playbook_id,
        action_type=recommendation.action_type,
        mode=execution_in.mode,
        target=recommendation.target_reference,
        executor="pending", # To be filled by worker
        idempotency_key=idempotency_key
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # NOTE: Here we would dispatch an event to `security.response.tasks` via Redpanda for the worker to pick up
    # For MVP we can just enqueue it in DB, and let worker poll, or send Kafka event.
    return execution

@router.post("/response-executions/{execution_id}/rollback")
def rollback_execution(
    execution_id: UUID4,
    db: Session = Depends(dependencies.get_db),
    current_user: Principal = Depends(require_permission("responses:execute"))
) -> Any:
    """
    Request rollback of a completed execution.
    """
    execution = db.query(ResponseExecution).filter(ResponseExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    if execution.status not in ["succeeded", "failed"]:
        raise HTTPException(status_code=400, detail="Cannot rollback execution in current state")
        
    execution.status = "rollback_pending"
    db.commit()
    # Event dispatched to worker here
    return {"message": "Rollback initiated"}
