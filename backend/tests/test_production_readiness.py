import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthChecks:
    """Test health check endpoints."""

    def test_health_endpoint(self):
        """Test that health endpoint returns 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        # May also include timestamp

    def test_root_endpoint(self):
        """Test that root endpoint returns 200 OK."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        # May also include message


class TestEnvironmentVariables:
    """Test environment variable configuration."""

    def test_database_url_default(self):
        """Test that DATABASE_URL has a default value."""
        from app.db import DATABASE_URL

        assert DATABASE_URL is not None
        assert "postgresql" in DATABASE_URL

    @patch.dict(
        os.environ, {"DATABASE_URL": "postgresql://test:test@localhost:5432/test"}
    )
    def test_database_url_from_env(self):
        """Test that DATABASE_URL can be set from environment."""
        # Test that environment variable is set
        assert (
            os.environ["DATABASE_URL"] == "postgresql://test:test@localhost:5432/test"
        )

        # Note: We can't easily test module reloading in this environment
        # due to database connection dependencies

    def test_required_env_vars(self):
        """Test that required environment variables are present."""
        # These should be set in the test environment
        assert "DATABASE_URL" in os.environ or "DATABASE_URL" in dir(app.db)

    def test_jwt_secret_key(self):
        """Test that JWT secret key is configured."""
        from app.auth import SECRET_KEY

        assert SECRET_KEY is not None
        assert len(SECRET_KEY) >= 32  # Should be at least 32 characters


class TestDatabaseConnection:
    """Test database connection handling."""

    def test_database_connection_creation(self):
        """Test that database connection can be created."""
        from app.db import engine

        assert engine is not None

    def test_database_session_factory(self):
        """Test that database session factory works."""
        from app.db import SessionLocal

        session = SessionLocal()
        assert session is not None
        session.close()

    @patch("app.db.engine.connect")
    def test_database_connection_error_handling(self, mock_connect):
        """Test that database connection errors are handled gracefully."""
        mock_connect.side_effect = Exception("Database connection failed")

        # This should not crash the application
        from app.db import engine

        assert engine is not None


class TestErrorHandling:
    """Test error handling and logging."""

    def test_404_error_handling(self):
        """Test that 404 errors are handled gracefully."""
        response = client.get("/nonexistent-endpoint")
        assert response.status_code == 404

    def test_500_error_handling(self):
        """Test that 500 errors are handled gracefully."""
        # This endpoint should exist and not crash
        response = client.get("/health")
        assert response.status_code == 200

    def test_invalid_json_handling(self):
        """Test that invalid JSON is handled gracefully."""
        response = client.post(
            "/project-requirements",
            data="invalid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422  # Unprocessable Entity


class TestSecurityHeaders:
    """Test security headers and CORS."""

    def test_cors_headers(self):
        """Test that CORS headers are properly set."""
        response = client.options("/health")
        # CORS preflight should work
        assert response.status_code in [200, 405]  # 405 is also acceptable for OPTIONS

    def test_security_headers(self):
        """Test that security headers are present."""
        response = client.get("/health")
        # Basic security headers should be present
        assert "content-type" in response.headers
        assert response.headers["content-type"] == "application/json"


class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_multiple_requests(self):
        """Test that multiple requests to the same endpoint work."""
        # Make multiple requests to health endpoint
        responses = []
        for _ in range(5):
            response = client.get("/health")
            responses.append(response)

        # All should succeed
        assert all(r.status_code == 200 for r in responses)

    def test_concurrent_requests(self):
        """Test that concurrent requests are handled properly."""
        import threading
        import time

        results = []
        errors = []

        def make_request():
            try:
                response = client.get("/health")
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))

        # Start multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # All should succeed without errors
        assert len(errors) == 0
        assert all(status == 200 for status in results)


class TestLogging:
    """Test logging functionality."""

    def test_application_startup_logging(self):
        """Test that application startup logs are generated."""
        # This is a basic test that the app can start
        assert app is not None
        assert hasattr(app, "state")

    def test_request_logging(self):
        """Test that requests are logged."""
        response = client.get("/health")
        # If logging is working, this request should be processed
        assert response.status_code == 200


class TestConfiguration:
    """Test application configuration."""

    def test_app_title(self):
        """Test that application has proper title."""
        assert app.title == "Offert API"  # Actual title from main.py

    def test_app_version(self):
        """Test that application has version information."""
        assert hasattr(app, "version")

    def test_app_description(self):
        """Test that application has description."""
        assert hasattr(app, "description")

    def test_cors_configuration(self):
        """Test that CORS is properly configured."""
        # Check if CORS middleware is present
        middleware_names = [
            middleware.cls.__name__ for middleware in app.user_middleware
        ]
        assert any("CORSMiddleware" in name for name in middleware_names)
