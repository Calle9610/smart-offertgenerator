"""
Tests for CSRF Protection

Verifies that CSRF middleware correctly blocks requests without valid tokens
and allows requests with valid tokens.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.csrf import csrf_protection


class TestCSRFProtection:
    """Test CSRF protection middleware."""

    def setup_method(self):
        """Setup test client for each test."""
        self.client = TestClient(app)

    def test_get_requests_allowed_without_csrf_token(self):
        """Test that GET requests are allowed without CSRF token."""
        # GET requests should work without CSRF token
        response = self.client.get("/api/auth/csrf-token")
        assert response.status_code == 200
        assert "csrf_token" in response.json()

    def test_post_request_blocked_without_csrf_token(self):
        """Test that POST requests are blocked without CSRF token."""
        # POST request without CSRF token should be blocked
        response = self.client.post(
            "/api/quotes",
            json={"test": "data"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "CSRF token validation failed"

    def test_put_request_blocked_without_csrf_token(self):
        """Test that PUT requests are blocked without CSRF token."""
        # PUT request without CSRF token should be blocked
        response = self.client.put(
            "/api/quotes/test-id",
            json={"test": "data"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "CSRF token validation failed"

    def test_delete_request_blocked_without_csrf_token(self):
        """Test that DELETE requests are blocked without CSRF token."""
        # DELETE request without CSRF token should be blocked
        response = self.client.delete("/api/quotes/test-id")
        assert response.status_code == 403
        assert response.json()["detail"] == "CSRF token validation failed"

    def test_post_request_allowed_with_valid_csrf_token(self):
        """Test that POST requests are allowed with valid CSRF token."""
        # First get a CSRF token
        token_response = self.client.get("/api/auth/csrf-token")
        assert token_response.status_code == 200
        csrf_token = token_response.json()["csrf_token"]

        # Mock the CSRF validation to return True for this test
        with patch('app.csrf.validate_csrf_token', return_value=True):
            # POST request with valid CSRF token should work
            response = self.client.post(
                "/api/quotes",
                json={"test": "data"},
                headers={
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrf_token
                },
                cookies={"csrf_token": csrf_token}
            )
            # Note: This might still fail due to authentication or other validation,
            # but it should NOT fail with 403 CSRF error
            assert response.status_code != 403 or response.json()["detail"] != "CSRF token validation failed"

    def test_exempt_paths_allowed_without_csrf_token(self):
        """Test that exempt paths are allowed without CSRF token."""
        # Login endpoint should be exempt from CSRF protection
        response = self.client.post(
            "/api/auth/login",
            json={"username": "test", "password": "test"},
            headers={"Content-Type": "application/json"}
        )
        # Should not fail with CSRF error (might fail with auth error, but that's different)
        assert response.status_code != 403 or response.json()["detail"] != "CSRF token validation failed"

    def test_public_endpoints_exempt_from_csrf(self):
        """Test that public endpoints are exempt from CSRF protection."""
        # Public endpoints should be exempt
        response = self.client.post(
            "/api/public/test",
            json={"test": "data"},
            headers={"Content-Type": "application/json"}
        )
        # Should not fail with CSRF error (might fail with 404, but that's different)
        assert response.status_code != 403 or response.json()["detail"] != "CSRF token validation failed"

    def test_csrf_token_generation(self):
        """Test CSRF token generation."""
        # Generate token
        token1 = csrf_protection.generate_token()
        token2 = csrf_protection.generate_token()
        
        # Tokens should be different
        assert token1 != token2
        
        # Tokens should be the right length
        assert len(token1) == 43
        assert len(token2) == 43
        
        # Tokens should be URL-safe
        assert token1.replace('-', '').replace('_', '').isalnum()
        assert token2.replace('-', '').replace('_', '').isalnum()

    def test_csrf_token_validation_double_submit(self):
        """Test CSRF token validation using double-submit pattern."""
        # Generate a token
        token = csrf_protection.generate_token()
        
        # Valid case: both cookie and header have same token
        assert csrf_protection.validate_token(token, token) == True
        
        # Invalid case: no cookie token
        assert csrf_protection.validate_token(None, token) == False
        
        # Invalid case: no header token
        assert csrf_protection.validate_token(token, None) == False
        
        # Invalid case: tokens don't match
        token2 = csrf_protection.generate_token()
        assert csrf_protection.validate_token(token, token2) == False

    def test_options_request_allowed_without_csrf_token(self):
        """Test that OPTIONS requests are allowed without CSRF token."""
        # OPTIONS requests should work without CSRF token (CORS preflight)
        response = self.client.options("/api/quotes")
        # Should not fail with CSRF error
        assert response.status_code != 403 or (
            response.status_code == 403 and 
            response.json().get("detail") != "CSRF token validation failed"
        )

    def test_head_request_allowed_without_csrf_token(self):
        """Test that HEAD requests are allowed without CSRF token."""
        # HEAD requests should work without CSRF token
        response = self.client.head("/api/quotes")
        # Should not fail with CSRF error
        assert response.status_code != 403 or (
            response.status_code == 403 and 
            response.json().get("detail", "") != "CSRF token validation failed"
        )

    def test_csrf_token_endpoint_returns_valid_token(self):
        """Test that CSRF token endpoint returns a valid token."""
        response = self.client.get("/api/auth/csrf-token")
        assert response.status_code == 200
        
        data = response.json()
        assert "csrf_token" in data
        
        token = data["csrf_token"]
        assert isinstance(token, str)
        assert len(token) == 43
        assert token.replace('-', '').replace('_', '').isalnum()

    def test_security_headers_added(self):
        """Test that security headers are added to responses."""
        response = self.client.get("/api/auth/csrf-token")
        
        # Check for security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
