import pytest
from fastapi.testclient import TestClient
from autosoc_api.main import app

client = TestClient(app)

def test_root() -> None:
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "AutoSOC Backend"
    assert any(phase in data["phase"] for phase in ["Phase 5", "Phase 7"])

def test_health_live() -> None:
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"

def test_health_ready() -> None:
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
    assert response.json()["components"]["database"] == "not_configured"

def test_version() -> None:
    response = client.get("/api/v1/health/version")
    assert response.status_code == 200
    assert response.json()["app_version"] == "0.1.0-dev"

def test_request_id_injected() -> None:
    response = client.get("/")
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 0
