"""
Middleware for FastAPI application.

Includes CSRF protection and other security middleware.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

from .csrf import require_csrf_token, is_safe_method

logger = logging.getLogger(__name__)


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection Middleware.
    
    Automatically validates CSRF tokens for unsafe HTTP methods
    (POST, PUT, DELETE, PATCH) on protected endpoints.
    """
    
    def __init__(self, app, exempt_paths: list = None):
        """
        Initialize CSRF middleware.
        
        Args:
            app: FastAPI application
            exempt_paths: List of paths to exempt from CSRF protection
        """
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            '/docs',
            '/redoc', 
            '/openapi.json',
            '/api/auth/csrf-token',  # CSRF token endpoint itself
            '/api/auth/login',       # Login doesn't need CSRF (uses credentials)
            '/api/public/',          # Public endpoints
        ]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and validate CSRF token if needed.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response from next handler or 403 error
        """
        # Skip CSRF validation for safe methods
        if is_safe_method(request.method):
            return await call_next(request)
        
        # Skip CSRF validation for exempt paths
        request_path = str(request.url.path)
        for exempt_path in self.exempt_paths:
            if request_path.startswith(exempt_path):
                return await call_next(request)
        
        # Validate CSRF token for unsafe methods
        try:
            require_csrf_token(request)
        except HTTPException as e:
            logger.warning(
                f"CSRF validation failed for {request.method} {request_path} "
                f"from {request.client.host if request.client else 'unknown'}"
            )
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        except Exception as e:
            logger.error(f"CSRF middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"}
            )
        
        # Continue to next handler
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Security Headers Middleware.
    
    Adds security-related HTTP headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Add security headers to response.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response with security headers added
        """
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Add CSRF token to response headers for JavaScript access
        if request.method == "GET" and not str(request.url.path).startswith('/api/public/'):
            from .csrf import get_csrf_token
            csrf_token = get_csrf_token()
            response.headers["X-CSRF-Token"] = csrf_token
            
            # Also set as cookie for double-submit pattern
            response.set_cookie(
                key="csrf_token",
                value=csrf_token,
                httponly=False,  # JavaScript needs to read this for the header
                secure=True,     # HTTPS only in production
                samesite="strict",  # CSRF protection
                max_age=3600     # 1 hour
            )
        
        return response
