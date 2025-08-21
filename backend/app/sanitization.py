"""
Input Sanitization Module

Provides functions to sanitize user input to prevent XSS attacks.
Uses Bleach library for HTML sanitization.
"""

import bleach
from typing import Optional, Union, List
from pydantic import field_validator


# Bleach configuration for safe HTML
ALLOWED_TAGS = [
    # Basic formatting
    'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'div', 'span',
    # Lists
    'ul', 'ol', 'li',
    # Headers
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    # Links (with restrictions)
    'a',
    # Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    # Code
    'code', 'pre',
    # Blockquotes
    'blockquote',
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target'],
    'div': ['class', 'id'],
    'span': ['class', 'id'],
    'p': ['class'],
    'h1': ['class'], 'h2': ['class'], 'h3': ['class'],
    'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
    'table': ['class', 'border', 'cellpadding', 'cellspacing'],
    'th': ['class', 'colspan', 'rowspan'],
    'td': ['class', 'colspan', 'rowspan'],
    'ul': ['class'], 'ol': ['class'], 'li': ['class'],
}

ALLOWED_PROTOCOLS = ['http', 'https', 'mailto', 'tel']

# Bleach cleaner instance
cleaner = bleach.Cleaner(
    tags=ALLOWED_TAGS,
    attributes=ALLOWED_ATTRIBUTES,
    protocols=ALLOWED_PROTOCOLS,
    strip=True,  # Remove disallowed tags/attributes
    strip_comments=True,  # Remove HTML comments
)


def sanitize_html(html_content: Optional[str]) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    
    Args:
        html_content: Raw HTML content to sanitize
        
    Returns:
        Sanitized HTML content with only allowed tags and attributes
    """
    if not html_content:
        return ""
    
    # Convert to string if needed
    if not isinstance(html_content, str):
        html_content = str(html_content)
    
    # Clean the HTML
    cleaned = cleaner.clean(html_content)
    
    return cleaned


def sanitize_text(text_content: Optional[str]) -> str:
    """
    Sanitize plain text content by escaping HTML.
    
    Args:
        text_content: Raw text content to sanitize
        
    Returns:
        HTML-escaped text content
    """
    if not text_content:
        return ""
    
    # Convert to string if needed
    if not isinstance(text_content, str):
        text_content = str(text_content)
    
    # Use bleach.clean with no allowed tags to escape HTML
    escaped = bleach.clean(text_content, tags=[], attributes=[], protocols=[], strip=True)
    
    return escaped


def sanitize_url(url: Optional[str]) -> str:
    """
    Sanitize URL to ensure it's safe.
    
    Args:
        url: Raw URL to sanitize
        
    Returns:
        Sanitized URL or empty string if invalid
    """
    if not url:
        return ""
    
    # Convert to string if needed
    if not isinstance(url, str):
        url = str(url)
    
    url_str = url.strip()
    if not url_str:
        return ""
    
    # Check for dangerous protocols
    url_lower = url_str.lower()
    if 'javascript:' in url_lower or 'data:' in url_lower or 'vbscript:' in url_lower:
        return ""
    
    # Allow relative URLs and URLs with allowed protocols
    if (url_str.startswith('/') or 
        url_str.startswith('#') or 
        any(url_lower.startswith(protocol + ':') for protocol in ALLOWED_PROTOCOLS)):
        return url_str
    
    return ""


def sanitize_list(items: Optional[List[str]]) -> List[str]:
    """
    Sanitize a list of text items.
    
    Args:
        items: List of text items to sanitize
        
    Returns:
        List of sanitized text items
    """
    if not items:
        return []
    
    sanitized_items = []
    for item in items:
        if item is not None:
            sanitized_items.append(sanitize_text(item))
    
    return sanitized_items


# Pydantic field validators for automatic sanitization
def validate_and_sanitize_html(value: Optional[str]) -> str:
    """Pydantic validator that sanitizes HTML content."""
    return sanitize_html(value)


def validate_and_sanitize_text(value: Optional[str]) -> str:
    """Pydantic validator that sanitizes plain text."""
    return sanitize_text(value)


def validate_and_sanitize_url(value: Optional[str]) -> str:
    """Pydantic validator that sanitizes URLs."""
    return sanitize_url(value)


def validate_and_sanitize_list(value: Optional[List[str]]) -> List[str]:
    """Pydantic validator that sanitizes lists of text."""
    return sanitize_list(value)


# Convenience function for Pydantic models
def html_field(**kwargs):
    """Create a Pydantic field with HTML sanitization."""
    return Field(..., **kwargs, description=kwargs.get('description', '') + ' (HTML sanitized)')
