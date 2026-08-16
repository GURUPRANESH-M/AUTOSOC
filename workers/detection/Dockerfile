FROM python:3.12-slim-bookworm

WORKDIR /app

# Install uv for fast dependency resolution and installation
RUN pip install uv
ENV UV_PREVIEW=1

COPY workers/detection/pyproject.toml .
RUN uv pip install --system -e .

COPY workers/detection/ .

CMD ["python", "-m", "autosoc_detection.main"]
