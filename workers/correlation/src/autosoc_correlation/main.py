import logging
import asyncio
from typing import Dict, Any

from fastkafka import FastKafka
from autosoc_schemas.events.detection import DetectionResult
from autosoc_correlation.consumer import setup_consumer
from autosoc_correlation.publisher import setup_publisher

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("autosoc_correlation.main")

# We mock Kafka connection handling similarly to detection worker
app = FastKafka(
    kafka_brokers={"default": {"url": "localhost:9092", "description": "Local Redpanda broker"}},
)

setup_consumer(app)
publish_incident = setup_publisher(app)

if __name__ == "__main__":
    logger.info("AutoSOC Correlation Worker Starting...")
    # asyncio.run(app.run())
