from typing import List, Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from autosoc_api.db.session import get_db_session
from autosoc_api.auth.dependencies import get_current_principal, require_roles
from autosoc_api.auth.models import Principal
from autosoc_api.db.models.prediction import Prediction
from autosoc_api.db.models.incident import Incident
from autosoc_api.schemas.prediction import PredictionResult, TechniquePrediction, PredictionTarget

router = APIRouter()

@router.get("/{incident_id}/predictions/latest", response_model=PredictionResult)
async def get_latest_prediction(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Principal = Depends(get_current_principal)
) -> Any:
    """
    Get the latest attack progression prediction for an incident.
    """
    result = await db.execute(
        select(Prediction)
        .where(Prediction.incident_id == incident_id)
        .order_by(Prediction.generated_at.desc())
        .limit(1)
    )
    prediction = result.scalars().first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="No prediction found for this incident.")
        
    return PredictionResult(
        prediction_id=prediction.id,
        incident_id=prediction.incident_id,
        generated_at=prediction.generated_at,
        valid_until=prediction.valid_until,
        observed_techniques=prediction.observed_techniques,
        predicted_next_techniques=[TechniquePrediction(**t) for t in prediction.predicted_next_techniques],
        predicted_target=PredictionTarget(**prediction.predicted_target) if prediction.predicted_target else None,
        path_continuation=prediction.path_continuation,
        escalation_risk_score=prediction.escalation_risk_score,
        model_name=prediction.model_name,
        model_version=prediction.model_version,
        attack_version=prediction.attack_version,
        limitations=prediction.limitations
    )

@router.get("/{incident_id}/predictions", response_model=List[PredictionResult])
async def get_all_predictions(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Principal = Depends(get_current_principal)
) -> Any:
    """
    Get all historical predictions for an incident.
    """
    result = await db.execute(
        select(Prediction)
        .where(Prediction.incident_id == incident_id)
        .order_by(Prediction.generated_at.desc())
    )
    predictions = result.scalars().all()
    
    return [
        PredictionResult(
            prediction_id=p.id,
            incident_id=p.incident_id,
            generated_at=p.generated_at,
            valid_until=p.valid_until,
            observed_techniques=p.observed_techniques,
            predicted_next_techniques=[TechniquePrediction(**t) for t in p.predicted_next_techniques],
            predicted_target=PredictionTarget(**p.predicted_target) if p.predicted_target else None,
            path_continuation=p.path_continuation,
            escalation_risk_score=p.escalation_risk_score,
            model_name=p.model_name,
            model_version=p.model_version,
            attack_version=p.attack_version,
            limitations=p.limitations
        ) for p in predictions
    ]

@router.post("/{incident_id}/predictions/recompute", status_code=202)
async def request_recompute(
    incident_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    # Only SOC Analyst / Admin can request a manual recompute
    current_user: Principal = Depends(require_roles(["soc_analyst", "admin"]))
) -> Any:
    """
    Request a recomputation of the attack progression prediction.
    """
    # Verify incident exists
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    # In a full implementation, this pushes a message to `security.predictions.recompute`
    # or `security.incidents` Kafka topic to trigger the prediction worker.
    # For now, we return accepted.
    return {"status": "accepted", "message": "Prediction recomputation requested."}
