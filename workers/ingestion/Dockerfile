FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency resolution
RUN pip install uv

# Copy schemas package and ingestion worker
COPY packages/event-schemas /packages/event-schemas
COPY workers/ingestion /app

# Install dependencies (schemas package is local)
RUN uv pip install --system -e /packages/event-schemas
RUN uv pip install --system -e .

EXPOSE 8000
EXPOSE 5140/udp

CMD ["uvicorn", "autosoc_ingestion.main:app", "--host", "0.0.0.0", "--port", "8000"]
