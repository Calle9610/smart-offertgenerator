/**
 * Frontend Input Sanitization
 * 
 * Provides functions to sanitize user input to prevent XSS attacks.
 * Uses isomorphic-dompurify for HTML sanitization.
 */

import * as DOMPurify from 'isomorphic-dompurify';

// DOMPurify configuration for safe HTML
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // Basic formatting
    'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'div', 'span',
    // Lists
    'ul', 'ol', 'li',
    // Headers
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Links (with restrictions)
    'a',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Code
    'code', 'pre',
    // Blockquotes
    'blockquote',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'class', 'id', 'colspan', 'rowspan',
    'border', 'cellpadding', 'cellspacing'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param htmlContent - Raw HTML content to sanitize
 * @returns Sanitized HTML content with only allowed tags and attributes
 */
export function sanitizeHtml(htmlContent: string | null | undefined): string {
  if (!htmlContent) {
    return '';
  }

  // Convert to string if needed
  const content = String(htmlContent);
  
  // Sanitize the HTML
  const sanitized = DOMPurify.sanitize(content, PURIFY_CONFIG);
  
  return sanitized;
}

/**
 * Sanitize plain text content by escaping HTML
 * 
 * @param textContent - Raw text content to sanitize
 * @returns HTML-escaped text content
 */
export function sanitizeText(textContent: string | null | undefined): string {
  if (!textContent) {
    return '';
  }

  // Convert to string if needed
  const content = String(textContent);
  
  // Escape HTML characters
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return escaped;
}

/**
 * Sanitize URL to ensure it's safe
 * 
 * @param url - Raw URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  // Convert to string if needed
  const urlStr = String(url).trim();
  
  // Check for dangerous protocols
  const lowerUrl = urlStr.toLowerCase();
  if (lowerUrl.includes('javascript:') || 
      lowerUrl.includes('data:') || 
      lowerUrl.includes('vbscript:')) {
    return '';
  }
  
  // Check if URL starts with allowed protocol
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  const hasValidProtocol = allowedProtocols.some(protocol => 
    lowerUrl.startsWith(protocol)
  );
  
  if (!hasValidProtocol && !urlStr.startsWith('/') && !urlStr.startsWith('#')) {
    return '';
  }
  
  return urlStr;
}

/**
 * Sanitize a list of text items
 * 
 * @param items - List of text items to sanitize
 * @returns List of sanitized text items
 */
export function sanitizeList(items: (string | null | undefined)[] | null | undefined): string[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  
  return items
    .filter((item): item is string => item != null)
    .map(item => sanitizeText(item));
}

/**
 * Sanitize form input value
 * 
 * @param value - Form input value to sanitize
 * @param allowHtml - Whether to allow HTML (default: false)
 * @returns Sanitized value
 */
export function sanitizeFormInput(
  value: string | null | undefined, 
  allowHtml: boolean = false
): string {
  if (!value) {
    return '';
  }

  const content = String(value);
  
  if (allowHtml) {
    return sanitizeHtml(content);
  } else {
    return sanitizeText(content);
  }
}

/**
 * Sanitize object with string properties
 * 
 * @param obj - Object with string properties to sanitize
 * @param allowHtml - Whether to allow HTML in string properties
 * @returns Object with sanitized string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T, 
  allowHtml: boolean = false
): T {
  const sanitized = { ...obj } as T;
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeFormInput(value, allowHtml);
    } else if (Array.isArray(value)) {
      (sanitized as any)[key] = sanitizeList(value);
    } else if (value && typeof value === 'object') {
      (sanitized as any)[key] = sanitizeObject(value, allowHtml);
    }
  }
  
  return sanitized;
}

/**
 * React hook for sanitizing form inputs
 * 
 * @param allowHtml - Whether to allow HTML in the input
 * @returns Object with sanitize function and sanitized value
 */
export function useSanitizedInput(allowHtml: boolean = false) {
  const sanitize = (value: string | null | undefined): string => {
    return sanitizeFormInput(value, allowHtml);
  };
  
  return { sanitize };
}
