FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv (using pip for simplicity)
RUN pip install --no-cache-dir hatchling

# Copy project files
COPY workers/agents/pyproject.toml ./
COPY workers/agents/src/ ./src/

# Install the package
RUN pip install --no-cache-dir -e .

ENV ENVIRONMENT=development
ENV PYTHONPATH=/app/src

# We will run this via a simple script or FastAPI for polling
# Since MVP uses HTTP for triggering, we can expose a FastAPI app here or just poll
CMD ["python", "-m", "autosoc_agents.main"]
