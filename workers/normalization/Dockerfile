FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.2.11 /uv /bin/uv
ENV UV_SYSTEM_PYTHON=1

WORKDIR /app

# Copy local dependencies
COPY packages/ packages/
COPY apps/api apps/api

WORKDIR /app/workers/normalization

# Install dependencies via uv
COPY workers/normalization/pyproject.toml workers/normalization/README.md ./
RUN uv pip install -e .

# Copy application code
COPY workers/normalization/src ./src

CMD ["python", "-m", "autosoc_normalization.main"]
