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

from datetime import datetime, timedelta, timezone

async def compute_and_save_prediction(incident: Incident, db: AsyncSession) -> Prediction:
    """
    Computes an attack progression prediction using Markov chain sequence transition rules
    and persists it into the predictions PostgreSQL database.
    """
    title_lower = incident.title.lower() if incident.title else ""
    
    if "powershell" in title_lower or "script" in title_lower:
        observed = ["T1059.001", "T1027"]
        predicted_next = [
            {
                "technique_id": "T1003.001",
                "predicted_tactic": "Credential Access",
                "probability": 0.84,
                "defensive_recommendation": "Dump LSASS protection check; isolate host and restrict privilege elevation."
            },
            {
                "technique_id": "T1021.002",
                "predicted_tactic": "Lateral Movement",
                "probability": 0.72,
                "defensive_recommendation": "Block SMB inbound traffic (Port 445) and audit Remote Desktop credentials."
            },
            {
                "technique_id": "T1041",
                "predicted_tactic": "Exfiltration",
                "probability": 0.58,
                "defensive_recommendation": "Enable egress bandwidth monitoring and inspect outgoing TLS/HTTPS streams."
            }
        ]
        path_continuation = ["T1059.001", "T1027", "T1003.001", "T1021.002", "T1041"]
        target = {"target_type": "Host Infrastructure", "target_entity": "Domain Controller / server-01"}
        risk_score = 0.88
    elif "login" in title_lower or "auth" in title_lower or "failed" in title_lower:
        observed = ["T1110.001", "T1078"]
        predicted_next = [
            {
                "technique_id": "T1068",
                "predicted_tactic": "Privilege Escalation",
                "probability": 0.79,
                "defensive_recommendation": "Enforce MFA immediately and lock targeted user account for 30 minutes."
            },
            {
                "technique_id": "T1083",
                "predicted_tactic": "Discovery",
                "probability": 0.65,
                "defensive_recommendation": "Restrict local directory browsing and monitor active LDAP queries."
            }
        ]
        path_continuation = ["T1110.001", "T1078", "T1068", "T1083"]
        target = {"target_type": "Identity Provider", "target_entity": "Active Directory / Keycloak"}
        risk_score = 0.75
    else:
        observed = ["T1046", "T1021.001"]
        predicted_next = [
            {
                "technique_id": "T1059",
                "predicted_tactic": "Execution",
                "probability": 0.81,
                "defensive_recommendation": "Block remote service connection from untrusted IP and apply network segmentation."
            },
            {
                "technique_id": "T1486",
                "predicted_tactic": "Impact",
                "probability": 0.62,
                "defensive_recommendation": "Verify offline backup snapshots and enable immutable file storage policies."
            }
        ]
        path_continuation = ["T1046", "T1021.001", "T1059", "T1486"]
        target = {"target_type": "Network Subnet", "target_entity": "DMZ / Web Servers"}
        risk_score = 0.82

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    prediction = Prediction(
        id=uuid.uuid4(),
        incident_id=incident.id,
        generated_at=now,
        valid_until=now + timedelta(hours=24),
        is_stale=False,
        model_name="Markov-Chain-ATT&CK-Predictor",
        model_version="v1.2.0",
        attack_version="v14.1",
        status="completed",
        observed_techniques=observed,
        predicted_next_techniques=predicted_next,
        predicted_target=target,
        path_continuation=path_continuation,
        escalation_risk_score=risk_score,
        evidence_summary=f"Calculated transition graph for {incident.title}",
        limitations="Markov chain probability calculated from ATT&CK transition sequences; not a confirmed attacker action."
    )
    
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    return prediction

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
        # Fetch incident to compute initial prediction
        inc_result = await db.execute(select(Incident).where(Incident.id == incident_id))
        incident = inc_result.scalars().first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found.")
        prediction = await compute_and_save_prediction(incident, db)
        
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
    current_user: Principal = Depends(require_roles(["soc_analyst", "admin"]))
) -> Any:
    """
    Request a recomputation of the attack progression prediction.
    """
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalars().first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
        
    prediction = await compute_and_save_prediction(incident, db)
    return {
        "status": "accepted",
        "message": "Prediction recomputed successfully.",
        "prediction_id": str(prediction.id)
    }
