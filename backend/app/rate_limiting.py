"""
Simple in-memory rate limiting middleware.

This module provides rate limiting functionality to prevent abuse of the API.
Rate limits are set to 10 requests per minute per IP address.

How to run:
1. No external dependencies required
2. The middleware is automatically added to the FastAPI app in main.py
3. Rate limits are enforced per IP address
4. Exceeds 10 req/min returns 429 Too Many Requests
"""

import time
from collections import defaultdict
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""
    
    def __init__(self, app, requests_per_minute: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = defaultdict(list)
        self.window_size = 60  # 60 seconds
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Clean old requests outside the window
        self._clean_old_requests(client_ip, current_time)
        
        # Check if client has exceeded rate limit
        if len(self.request_counts[client_ip]) >= self.requests_per_minute:
            return self._create_rate_limit_response()
        
        # Add current request to count
        self.request_counts[client_ip].append(current_time)
        
        # Process request
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address, handling proxy headers."""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Fall back to direct connection
        return request.client.host if request.client else "unknown"
    
    def _clean_old_requests(self, client_ip: str, current_time: float):
        """Remove requests older than the window size."""
        cutoff_time = current_time - self.window_size
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if req_time > cutoff_time
        ]
    
    def _create_rate_limit_response(self) -> Response:
        """Create rate limit exceeded response."""
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": "Du har överskridit gränsen på 10 förfrågningar per minut. Försök igen senare.",
                "retry_after": 60,
                "limit": 10,
                "detail": "Rate limit exceeded. Try again later."
            }
        )


def apply_rate_limits(app):
    """
    Apply rate limiting to the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(RateLimitMiddleware, requests_per_minute=10)


# Placeholder decorator for compatibility
def rate_limit_10_per_minute(func):
    """
    Decorator to apply 10 requests per minute rate limiting to an endpoint.
    Note: This is handled by the middleware, so this decorator is a no-op.
    
    Args:
        func: The endpoint function to decorate
        
    Returns:
        Decorated function (no-op)
    """
    return func
