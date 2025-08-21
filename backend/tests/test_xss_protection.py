"""
Tests for XSS Protection

Verifies that input sanitization correctly blocks XSS attacks
and allows safe content through.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.sanitization import (
    sanitize_html, 
    sanitize_text, 
    sanitize_url, 
    sanitize_list
)


class TestXSSProtection:
    """Test XSS protection and input sanitization."""

    def setup_method(self):
        """Setup test client for each test."""
        self.client = TestClient(app)

    def test_sanitize_html_removes_script_tags(self):
        """Test that script tags are removed from HTML."""
        malicious_html = '<p>Hello <script>alert("xss")</script> World</p>'
        sanitized = sanitize_html(malicious_html)
        
        assert '<script>' not in sanitized
        # Bleach removes tags but keeps text content
        assert 'alert("xss")' in sanitized
        assert '<p>Hello alert("xss") World</p>' in sanitized

    def test_sanitize_html_removes_dangerous_attributes(self):
        """Test that dangerous attributes are removed."""
        malicious_html = '<div onclick="alert(\'xss\')" onload="evil()">Content</div>'
        sanitized = sanitize_html(malicious_html)
        
        assert 'onclick=' not in sanitized
        assert 'onload=' not in sanitized
        assert '<div>Content</div>' in sanitized

    def test_sanitize_html_allows_safe_tags(self):
        """Test that safe HTML tags are allowed."""
        safe_html = '<p><strong>Bold</strong> and <em>italic</em> text</p>'
        sanitized = sanitize_html(safe_html)
        
        assert '<strong>Bold</strong>' in sanitized
        assert '<em>italic</em>' in sanitized
        assert '<p>' in sanitized

    def test_sanitize_html_allows_safe_attributes(self):
        """Test that safe attributes are allowed."""
        safe_html = '<a href="https://example.com" title="Link">Link</a>'
        sanitized = sanitize_html(safe_html)
        
        assert 'href="https://example.com"' in sanitized
        assert 'title="Link"' in sanitized

    def test_sanitize_text_escapes_html(self):
        """Test that plain text is properly escaped."""
        malicious_text = '<script>alert("xss")</script>'
        sanitized = sanitize_text(malicious_text)
        
        assert '<script>' not in sanitized
        # Bleach removes tags completely when strip=True
        assert 'alert("xss")' in sanitized

    def test_sanitize_url_blocks_javascript_protocol(self):
        """Test that javascript: protocol is blocked."""
        malicious_url = 'javascript:alert("xss")'
        sanitized = sanitize_url(malicious_url)
        
        assert sanitized == ''

    def test_sanitize_url_blocks_data_protocol(self):
        """Test that data: protocol is blocked."""
        malicious_url = 'data:text/html,<script>alert("xss")</script>'
        sanitized = sanitize_url(malicious_url)
        
        assert sanitized == ''

    def test_sanitize_url_allows_http_protocol(self):
        """Test that http: protocol is allowed."""
        safe_url = 'https://example.com'
        sanitized = sanitize_url(safe_url)
        
        assert sanitized == 'https://example.com'

    def test_sanitize_url_allows_mailto_protocol(self):
        """Test that mailto: protocol is allowed."""
        safe_url = 'mailto:user@example.com'
        sanitized = sanitize_url(safe_url)
        
        assert sanitized == 'mailto:user@example.com'

    def test_sanitize_list_sanitizes_items(self):
        """Test that list items are sanitized."""
        malicious_list = ['<script>alert("xss")</script>', 'Safe text', '<img src=x onerror=alert(1)>']
        sanitized = sanitize_list(malicious_list)
        
        assert len(sanitized) == 3
        # Bleach removes tags but keeps text content
        assert 'alert("xss")' in sanitized[0]
        assert 'Safe text' in sanitized[1]
        # Bleach removes all content when no tags are allowed
        assert sanitized[2] == ''

    def test_sanitize_html_removes_iframe_tags(self):
        """Test that iframe tags are removed."""
        malicious_html = '<iframe src="javascript:alert(\'xss\')"></iframe>'
        sanitized = sanitize_html(malicious_html)
        
        assert '<iframe' not in sanitized
        assert 'javascript:alert' not in sanitized

    def test_sanitize_html_removes_object_tags(self):
        """Test that object tags are removed."""
        malicious_html = '<object data="evil.swf"></object>'
        sanitized = sanitize_html(malicious_html)
        
        assert '<object' not in sanitized

    def test_sanitize_html_removes_embed_tags(self):
        """Test that embed tags are removed."""
        malicious_html = '<embed src="evil.swf">'
        sanitized = sanitize_html(malicious_html)
        
        assert '<embed' not in sanitized

    def test_sanitize_html_removes_form_tags(self):
        """Test that form tags are removed."""
        malicious_html = '<form action="javascript:alert(\'xss\')"><input type="text"></form>'
        sanitized = sanitize_html(malicious_html)
        
        assert '<form' not in sanitized
        assert '<input' not in sanitized

    def test_sanitize_html_removes_style_tags(self):
        """Test that style tags are removed."""
        malicious_html = '<style>body { background: url(javascript:alert("xss")) }</style>'
        sanitized = sanitize_html(malicious_html)
        
        assert '<style>' not in sanitized
        # Bleach removes style tags but keeps CSS content
        assert 'body { background: url(javascript:alert("xss")) }' in sanitized

    def test_sanitize_html_removes_comments(self):
        """Test that HTML comments are removed."""
        malicious_html = '<!-- <script>alert("xss")</script> --><p>Content</p>'
        sanitized = sanitize_html(malicious_html)
        
        assert '<!--' not in sanitized
        assert '-->' not in sanitized
        assert '<p>Content</p>' in sanitized

    def test_sanitize_html_handles_nested_malicious_content(self):
        """Test that nested malicious content is handled."""
        malicious_html = '''
        <div>
            <p>Hello</p>
            <script>alert("xss")</script>
            <p>World</p>
            <iframe src="javascript:alert('more xss')"></iframe>
        </div>
        '''
        sanitized = sanitize_html(malicious_html)
        
        assert '<script>' not in sanitized
        assert '<iframe' not in sanitized
        assert '<p>Hello</p>' in sanitized
        assert '<p>World</p>' in sanitized

    def test_sanitize_html_preserves_safe_structure(self):
        """Test that safe HTML structure is preserved."""
        safe_html = '''
        <div class="container">
            <h1>Title</h1>
            <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
            </ul>
        </div>
        '''
        sanitized = sanitize_html(safe_html)
        
        assert '<h1>Title</h1>' in sanitized
        assert '<strong>bold</strong>' in sanitized
        assert '<em>italic</em>' in sanitized
        assert '<ul>' in sanitized
        assert '<li>Item 1</li>' in sanitized
        assert '<li>Item 2</li>' in sanitized

    def test_sanitize_text_handles_special_characters(self):
        """Test that special characters are properly escaped."""
        special_text = '<>&"\'/'
        sanitized = sanitize_text(special_text)
        
        # Bleach removes tags completely when strip=True
        assert '<' not in sanitized
        assert '>' not in sanitized
        # Other characters should remain
        assert '&' in sanitized
        assert '"' in sanitized
        assert "'" in sanitized
        assert '/' in sanitized

    def test_sanitize_url_handles_edge_cases(self):
        """Test that URL sanitization handles edge cases."""
        # Empty string
        assert sanitize_url('') == ''
        
        # None
        assert sanitize_url(None) == ''
        
        # Whitespace only
        assert sanitize_url('   ') == ''
        
        # Relative URLs
        assert sanitize_url('/path/to/page') == '/path/to/page'
        assert sanitize_url('#section') == '#section'

    def test_sanitize_list_handles_edge_cases(self):
        """Test that list sanitization handles edge cases."""
        # Empty list
        assert sanitize_list([]) == []
        
        # None
        assert sanitize_list(None) == []
        
        # List with None values
        assert sanitize_list(['text', None, 'more text']) == ['text', 'more text']
        
        # List with empty strings
        assert sanitize_list(['text', '', 'more text']) == ['text', '', 'more text']

    def test_sanitize_html_handles_edge_cases(self):
        """Test that HTML sanitization handles edge cases."""
        # Empty string
        assert sanitize_html('') == ''
        
        # None
        assert sanitize_html(None) == ''
        
        # Whitespace only
        assert sanitize_html('   ') == '   '
        
        # Non-string input
        assert sanitize_html(123) == '123'
        assert sanitize_html(True) == 'True'
