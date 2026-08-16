FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY workers/prediction/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML package
COPY ml/autosoc_ml /app/autosoc_ml

COPY workers/prediction/ .

CMD ["python", "main.py"]
