# scripts/setup-dev.ps1
# Setup development environment for AutoSOC

Write-Host "=== AutoSOC Development Setup ===" -ForegroundColor Cyan

# 1. Environment Config
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..."
    Copy-Item .env.example .env
    Write-Host ".env created. Please update passwords if necessary." -ForegroundColor Yellow
} else {
    Write-Host ".env already exists." -ForegroundColor Green
}

# 2. Infrastructure
Write-Host "Building Docker images sequentially to conserve memory..."
$env:DOCKER_BUILDKIT="0"
$env:COMPOSE_DOCKER_CLI_BUILD="0"

$workers = @("ingestion-worker", "normalization-worker", "detection-worker", "correlation-worker", "prediction-worker", "agent-worker")
foreach ($worker in $workers) {
    Write-Host "Building $worker..." -ForegroundColor Cyan
    docker compose -f infrastructure/docker/compose.yml build $worker
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to build $worker. Aborting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Infrastructure via Docker Compose..."
docker compose -f infrastructure/docker/compose.yml up -d

Write-Host "Waiting for database to be ready (30 seconds)..."
Start-Sleep -Seconds 30

# 3. Database Migrations
Write-Host "Running Database Migrations..."
$env:ENVIRONMENT="development"
$env:PYTHONPATH="$PWD/apps/api/src"
# Assuming venv is set up or we can just run hatch/poetry/pip based tool
# For now we assume pipenv or venv is activated.
if (Test-Path "apps/api/.venv/Scripts/alembic.exe") {
    & "apps/api/.venv/Scripts/alembic.exe" -c apps/api/alembic.ini upgrade head
} else {
    Write-Host "Alembic not found in apps/api/.venv/Scripts. Please install backend dependencies." -ForegroundColor Red
}

# 4. Redpanda Topics
Write-Host "Creating Redpanda topics..."
$topics = @(
    "security.events.raw",
    "security.events.normalized",
    "security.events.enriched",
    "security.detections",
    "security.alerts",
    "security.incidents",
    "security.predictions",
    "security.agent.tasks",
    "security.response.tasks",
    "security.audit.events"
)
foreach ($topic in $topics) {
    docker exec autosoc-redpanda rpk topic create $topic
}

Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "You can now run apps/api and apps/web."
