"""
Test rate limiting functionality.

This module tests that rate limiting is working correctly:
- Over 10 requests per minute should return 429
- Rate limits are enforced per IP address
- Custom error responses are returned

How to run:
1. Install dependencies: pip install -r requirements-dev.txt
2. Run tests: pytest tests/test_rate_limiting.py -v
"""

import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_rate_limit_enforcement(self, client):
        """Test that rate limiting is enforced after 10 requests."""
        # Make 10 requests - should all succeed
        for i in range(10):
            response = client.get("/health")
            assert response.status_code == 200
        
        # 11th request should be rate limited
        response = client.get("/health")
        assert response.status_code == 429
        assert "Rate limit exceeded" in response.json()["error"]
        assert "Du har överskridit gränsen" in response.json()["message"]

    def test_rate_limit_reset_after_minute(self, client):
        """Test that rate limit resets after a minute."""
        # Make 10 requests
        for i in range(10):
            response = client.get("/health")
            assert response.status_code == 200
        
        # 11th request should be rate limited
        response = client.get("/health")
        assert response.status_code == 429
        
        # Mock time to advance by 1 minute
        with patch('time.time') as mock_time:
            mock_time.return_value = time.time() + 60
            
            # Should work again after time reset
            response = client.get("/health")
            assert response.status_code == 200

    def test_rate_limit_per_ip(self, client):
        """Test that rate limits are per IP address."""
        # Mock different IP addresses
        with patch('app.rate_limiting.get_remote_address') as mock_ip:
            # First IP makes 10 requests
            mock_ip.return_value = "192.168.1.1"
            for i in range(10):
                response = client.get("/health")
                assert response.status_code == 200
            
            # 11th request from first IP should be rate limited
            response = client.get("/health")
            assert response.status_code == 429
            
            # Different IP should still work
            mock_ip.return_value = "192.168.1.2"
            response = client.get("/health")
            assert response.status_code == 200

    def test_rate_limit_error_response_format(self, client):
        """Test that rate limit error responses have correct format."""
        # Make 10 requests to trigger rate limit
        for i in range(10):
            client.get("/health")
        
        # 11th request should return proper error format
        response = client.get("/health")
        assert response.status_code == 429
        
        error_data = response.json()
        assert "error" in error_data
        assert "message" in error_data
        assert "retry_after" in error_data
        assert "limit" in error_data
        assert "detail" in error_data
        
        assert error_data["error"] == "Rate limit exceeded"
        assert "Du har överskridit gränsen" in error_data["message"]

    def test_rate_limit_on_different_endpoints(self, client):
        """Test that rate limiting works on different endpoints."""
        # Make 10 requests to health endpoint
        for i in range(10):
            response = client.get("/health")
            assert response.status_code == 200
        
        # Try different endpoint - should still be rate limited
        response = client.get("/")
        assert response.status_code == 429

    def test_rate_limit_headers(self, client):
        """Test that rate limit headers are present."""
        # Make 10 requests
        for i in range(10):
            response = client.get("/health")
            assert response.status_code == 200
        
        # 11th request should have rate limit headers
        response = client.get("/health")
        assert response.status_code == 429
        
        # Check for rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
