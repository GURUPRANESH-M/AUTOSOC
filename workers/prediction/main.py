import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from config import settings
from predictor import ProgressionService
# Assuming models are available in the path, but we'll import them locally
# to avoid duplicating the entire api structure here, we'll write a simple raw insert
# or reuse the api models if they are in PYTHONPATH. 
# For now we'll assume autosoc_api is available.
from autosoc_api.db.models.prediction import Prediction
from autosoc_api.db.models.attack import IncidentAttackMapping

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_message(msg_value, session, service: ProgressionService):
    """
    Process an incident update and generate predictions.
    msg_value should contain {"incident_id": "uuid"}
    """
    try:
        data = json.loads(msg_value)
        incident_id = data.get("incident_id")
        if not incident_id:
            return
            
        # Fetch mappings
        result = await session.execute(
            select(IncidentAttackMapping)
            .where(IncidentAttackMapping.incident_id == incident_id)
        )
        mappings = result.scalars().all()
        
        # We need them as dicts for the builder
        mapping_dicts = [
            {
                "technique_id": m.technique_id,
                "status": m.status,
                "mapped_at": m.mapped_at.isoformat() if m.mapped_at else None,
                "created_at": m.created_at.isoformat() if m.created_at else None
            } for m in mappings
        ]
        
        prediction_result = service.predict(mapping_dicts)
        predictions = prediction_result.get("predictions", [])
        observed = prediction_result.get("observed", [])
        
        if not predictions:
            return
            
        # Create prediction record
        pred_record = Prediction(
            incident_id=incident_id,
            model_name="Markov Baseline",
            model_version="1.0",
            attack_version="v14.1",
            observed_techniques=observed,
            predicted_next_techniques=predictions,
            escalation_risk_score=0.5
        )
        session.add(pred_record)
        await session.commit()
        logger.info(f"Generated prediction for incident {incident_id}")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        await session.rollback()

async def consume():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    service = ProgressionService(settings.MODEL_PATH, settings.VOCAB_PATH)

    consumer = AIOKafkaConsumer(
        settings.INCIDENTS_TOPIC,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="prediction-worker-group"
    )
    
    await consumer.start()
    try:
        logger.info("Prediction worker started consuming...")
        async for msg in consumer:
            async with async_session() as session:
                await process_message(msg.value, session, service)
    finally:
        await consumer.stop()
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(consume())
