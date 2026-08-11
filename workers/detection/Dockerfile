FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency resolution and installation
RUN pip install uv

COPY pyproject.toml .
RUN uv pip install --system -e .

COPY . .

CMD ["python", "-m", "autosoc_detection.main"]
