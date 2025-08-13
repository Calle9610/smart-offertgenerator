import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test that health endpoint returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_root_endpoint(self):
        """Test that root endpoint returns 200."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "message" in data


class TestAuthentication:
    """Test authentication endpoints."""

    def test_login_without_credentials(self):
        """Test login endpoint without credentials."""
        response = client.post("/token", data={})
        assert response.status_code == 422  # Validation error

    def test_login_with_invalid_credentials(self):
        """Test login endpoint with invalid credentials."""
        response = client.post(
            "/token", data={"username": "invalid", "password": "invalid"}
        )
        assert response.status_code == 401  # Unauthorized


class TestQuoteEndpoints:
    """Test quote-related endpoints."""

    def test_calc_quote_without_auth(self):
        """Test quote calculation without authentication."""
        response = client.post(
            "/quotes/calc",
            json={
                "customer_name": "Test Customer",
                "project_name": "Test Project",
                "profile_id": "test-profile-id",
                "currency": "SEK",
                "vat_rate": 25.0,
                "items": [
                    {
                        "kind": "labor",
                        "description": "Test work",
                        "qty": 10,
                        "unit": "hour",
                        "unit_price": 500,
                    }
                ],
            },
        )
        assert response.status_code == 401  # Unauthorized

    def test_create_quote_without_auth(self):
        """Test quote creation without authentication."""
        response = client.post(
            "/quotes",
            json={
                "customer_name": "Test Customer",
                "project_name": "Test Project",
                "profile_id": "test-profile-id",
                "currency": "SEK",
                "vat_rate": 25.0,
                "items": [
                    {
                        "kind": "labor",
                        "description": "Test work",
                        "qty": 10,
                        "unit": "hour",
                        "unit_price": 500,
                    }
                ],
            },
        )
        assert response.status_code == 401  # Unauthorized


class TestCompanyEndpoints:
    """Test company-related endpoints."""

    def test_get_companies_without_auth(self):
        """Test getting companies without authentication."""
        response = client.get("/companies")
        assert response.status_code == 401  # Unauthorized


class TestUserEndpoints:
    """Test user-related endpoints."""

    def test_get_current_user_without_auth(self):
        """Test getting current user without authentication."""
        response = client.get("/users/me")
        assert response.status_code == 401  # Unauthorized

    def test_create_user_without_auth(self):
        """Test creating user without authentication."""
        response = client.post(
            "/users",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "testpass123",
                "full_name": "Test User",
            },
        )
        assert response.status_code == 401  # Unauthorized
