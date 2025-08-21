// API base URL - use relative URLs to avoid CORS issues
export const API_BASE = '';

// CSRF Token Management
let csrfToken: string | null = null;

/**
 * Get CSRF token from cookie or fetch from server
 */
async function getCSRFToken(): Promise<string> {
  // Try to get token from cookie first
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];
  
  if (cookieToken) {
    csrfToken = cookieToken;
    return cookieToken;
  }
  
  // If no cookie token, fetch from server
  try {
    const res = await fetch(`${API_BASE}/api/auth/csrf-token`, {
      credentials: 'include'
    });
    
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrf_token;
      return csrfToken || '';
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
  }
  
  throw new Error('Failed to get CSRF token');
}

/**
 * Create headers with CSRF token for unsafe HTTP methods
 */
async function createSecureHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    ...additionalHeaders
  };
  
  // Add CSRF token for unsafe methods
  try {
    const token = await getCSRFToken();
    headers['X-CSRF-Token'] = token;
  } catch (error) {
    console.warn('Could not add CSRF token to headers:', error);
  }
  
  return headers;
}

// Authentication functions
export async function login(username: string, password: string) {
  const headers = await createSecureHeaders({
    'Content-Type': 'application/json',
  });
  
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
    body: JSON.stringify({ username, password })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Login failed: ${errorText}`);
  }
  
  return res.json();
}

export async function logout() {
  const headers = await createSecureHeaders();
  
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Logout failed: ${errorText}`);
  }
  
  return res.json();
}

export async function refreshToken() {
  const headers = await createSecureHeaders();
  
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }
  
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get user: ${errorText}`);
  }
  
  return res.json();
}

export async function getCompanies() {
  const res = await fetch(`${API_BASE}/api/companies`, {
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get companies: ${errorText}`);
  }
  
  return res.json();
}

// Project Requirements functions
export async function createProjectRequirements(payload: any) {
  console.log('=== API DEBUG ===')
  console.log('createProjectRequirements called with payload:', payload)
  
  const headers = await createSecureHeaders({
    'Content-Type': 'application/json',
  });
  
  const res = await fetch(`${API_BASE}/api/project-requirements`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
    body: JSON.stringify(payload)
  });
  
  console.log('Response status:', res.status)
  console.log('Response ok:', res.ok)
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log('Error response:', errorText)
    throw new Error(`Failed to create requirements: ${errorText}`);
  }
  
  const responseData = await res.json();
  console.log('Success response:', responseData)
  return responseData;
}

export async function getProjectRequirements() {
  const res = await fetch(`${API_BASE}/api/project-requirements`, {
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get requirements: ${errorText}`);
  }
  
  return res.json();
}

// Auto-generation function
export async function autoGenerateQuote(payload: any) {
  const headers = await createSecureHeaders({
    'Content-Type': 'application/json',
  });
  
  const res = await fetch(`${API_BASE}/api/quotes/autogenerate`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Auto-generation failed: ${errorText}`);
  }
  
  return res.json();
}

// Quote functions (now use Next.js API routes)
export async function calcQuote(payload: any) {
  const headers = await createSecureHeaders({
    'Content-Type': 'application/json',
  });
  
  const res = await fetch(`${API_BASE}/api/quotes/calc`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Calc failed');
  return res.json();
}

import { CreateQuoteRequest, CreateQuoteResponse } from '@/types/quote'

export async function createQuote(payload: CreateQuoteRequest): Promise<CreateQuoteResponse> {
  console.log('createQuote called with payload:', payload)
  
  const headers = await createSecureHeaders({
    'Content-Type': 'application/json',
  });
  
  const res = await fetch(`${API_BASE}/api/quotes`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
    body: JSON.stringify(payload)
  });
  
  console.log('createQuote response status:', res.status)
  console.log('createQuote response ok:', res.ok)
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('createQuote error:', errorText)
    throw new Error(`Create failed: ${errorText}`);
  }
  
  const responseData = await res.json();
  console.log('createQuote success response:', responseData)
  return responseData;
}

import { QuoteDto } from '@/types/quote'

export async function getQuotes(): Promise<QuoteDto[]> {
  const res = await fetch(`${API_BASE}/api/quotes`, {
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get quotes: ${errorText}`);
  }
  
  return res.json();
}

export async function getQuote(id: string): Promise<QuoteDto> {
  const res = await fetch(`${API_BASE}/api/quotes/${id}`);
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get quote: ${errorText}`);
  }
  
  return res.json();
}

export async function getQuoteAdjustments(quoteId: string) {
  const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/adjustments`, {
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get adjustments: ${errorText}`);
  }
  
  return res.json();
}

export async function generatePDF(quoteId: string) {
  const headers = await createSecureHeaders();
  
  const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/pdf`, {
    method: 'POST',
    headers,
    credentials: 'include', // Include cookies
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PDF generation failed: ${errorText}`);
  }
  
  // Create blob and download
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quote_${quoteId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
