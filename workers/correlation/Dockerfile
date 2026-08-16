FROM python:3.12-slim-bookworm

WORKDIR /app

# Install uv for fast dependency resolution and installation
RUN pip install uv
ENV UV_PREVIEW=1

COPY workers/correlation/pyproject.toml .
RUN uv pip install --system -e .

COPY workers/correlation/ .

CMD ["python", "-m", "autosoc_correlation.main"]
