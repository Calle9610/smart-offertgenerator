/**
 * Central API Client med cookies, CSRF och automatisk refresh-retry
 * 
 * Denna wrapper hanterar:
 * - credentials: 'include' på alla requests
 * - X-CSRF-Token från /api/auth/csrf-token endpoint
 * - Automatisk refresh vid 401 och replay av originalanrop
 * - Enkel API för get, post, put, del
 * - Korrekt URL-hantering utan dubbel prefixning
 * 
 * How to run:
 * 1. Importera: import { get, post, put, del } from '@/lib/apiClient'
 * 2. Använd: const data = await get('/api/endpoint') eller await post('/auth/login', data)
 * 3. Cookies och CSRF hanteras automatiskt
 * 4. Vid 401 görs automatisk refresh + replay
 */

// CSRF Token Management
class CSRFManager {
  private token: string | null = null
  private fetching: boolean = false
  private queue: Array<() => void> = []

  async get(): Promise<string> {
    // Return cached token if available
    if (this.token) {
      return this.token
    }

    // If already fetching, wait for it
    if (this.fetching) {
      return new Promise((resolve) => {
        this.queue.push(() => resolve(this.token!))
      })
    }

    // Fetch new token
    this.fetching = true
    try {
      const response = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data = await response.json()
      this.token = data.csrf_token
      
      // Resolve queued requests
      this.queue.forEach(resolve => resolve())
      this.queue = []
      
      return this.token!
    } catch (error) {
      console.error('CSRF token fetch failed:', error)
      throw error
    } finally {
      this.fetching = false
    }
  }

  invalidate(): void {
    this.token = null
  }
}

// Global CSRF manager instance
const csrf = new CSRFManager()

// Request configuration
interface RequestConfig {
  method: string
  headers?: Record<string, string>
  body?: any
  retryCount?: number
}

// Response wrapper
interface ApiResponse<T = any> {
  data: T
  status: number
  ok: boolean
}

// Error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Maximum retry attempts for refresh
const MAX_REFRESH_RETRIES = 1

/**
 * Normalize URL to ensure correct format
 * - If URL starts with /api/, use as-is (Next.js proxy)
 * - If URL starts with /, use as-is (relative to current domain)
 * - Otherwise, assume it's a full URL
 */
function normalizeUrl(url: string): string {
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If it starts with /api/ or /, use as-is (Next.js will handle proxying)
  if (url.startsWith('/api/') || url.startsWith('/')) {
    return url
  }
  
  // Otherwise, assume it should be prefixed with /api/
  return `/api/${url}`
}

/**
 * Create headers with CSRF token for unsafe HTTP methods
 */
async function createHeaders(
  method: string,
  additionalHeaders: Record<string, string> = {}
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }

  // Add CSRF token for unsafe methods (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    try {
      const token = await csrf.get()
      headers['X-CSRF-Token'] = token
    } catch (error) {
      console.warn('Could not add CSRF token to headers:', error)
    }
  }

  return headers
}

/**
 * Check if response indicates authentication failure
 */
function isAuthError(response: Response): boolean {
  return response.status === 401
}

/**
 * Attempt to refresh authentication token
 */
async function refreshAuth(): Promise<boolean> {
  try {
    console.log('Attempting to refresh authentication...')
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
    
    if (response.ok) {
      console.log('Authentication refresh successful')
      return true
    }
    
    console.log('Authentication refresh failed:', response.status)
    return false
  } catch (error) {
    console.error('Auth refresh failed:', error)
    return false
  }
}

/**
 * Core fetch function with retry logic
 */
async function apiFetch<T>(
  url: string, 
  config: RequestConfig,
  retryCount: number = 0
): Promise<ApiResponse<T>> {
  try {
    // Normalize URL to ensure correct format
    const normalizedUrl = normalizeUrl(url)
    
    // Create headers with CSRF token for unsafe methods
    const headers = await createHeaders(config.method, config.headers)
    
    // Prepare fetch options - ALL requests include credentials
    const fetchOptions: RequestInit = {
      method: config.method,
      headers,
      credentials: 'include', // ✅ Alla requests har credentials: 'include'
      ...(config.body && { body: JSON.stringify(config.body) })
    }

    console.log(`Making ${config.method} request to: ${normalizedUrl}`)

    // Make request
    const response = await fetch(normalizedUrl, fetchOptions)
    
    // Handle authentication errors with refresh retry
    if (isAuthError(response) && retryCount < MAX_REFRESH_RETRIES) {
      console.log('Auth error (401), attempting refresh and replay...')
      
      const refreshSuccess = await refreshAuth()
      if (refreshSuccess) {
        // Invalidate CSRF token to force refresh
        csrf.invalidate()
        
        // Retry original request
        console.log('Retrying original request after successful refresh...')
        return apiFetch(url, config, retryCount + 1)
      }
    }

    // Parse response
    let data: T
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else if (contentType && contentType.includes('text/')) {
      data = await response.text() as T
    } else {
      data = await response.blob() as T
    }

    // Return response wrapper
    return {
      data,
      status: response.status,
      ok: response.ok
    }

  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - check your connection', 0)
    }
    
    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error
    }
    
    // Wrap other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      0
    )
  }
}

/**
 * Handle API response and throw errors for non-OK responses
 */
function handleResponse<T>(response: ApiResponse<T>): T {
  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      response.data
    )
  }
  
  return response.data
}

/**
 * GET request
 */
export async function get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
  const response = await apiFetch<T>(url, {
    method: 'GET',
    headers: headers || {}
  })
  
  return handleResponse(response)
}

/**
 * POST request
 */
export async function post<T = any>(
  url: string, 
  body?: any, 
  headers?: Record<string, string>
): Promise<T> {
  const response = await apiFetch<T>(url, {
    method: 'POST',
    body,
    headers: headers || {}
  })
  
  return handleResponse(response)
}

/**
 * PUT request
 */
export async function put<T = any>(
  url: string, 
  body?: any, 
  headers?: Record<string, string>
): Promise<T> {
  const response = await apiFetch<T>(url, {
    method: 'PUT',
    body,
    headers: headers || {}
  })
  
  return handleResponse(response)
}

/**
 * DELETE request
 */
export async function del<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
  const response = await apiFetch<T>(url, {
    method: 'DELETE',
    headers: headers || {}
  })
  
  return handleResponse(response)
}

/**
 * PATCH request (extra utility)
 */
export async function patch<T = any>(
  url: string, 
  body?: any, 
  headers?: Record<string, string>
): Promise<T> {
  const response = await apiFetch<T>(url, {
    method: 'PATCH',
    body,
    headers: headers || {}
  })
  
  return handleResponse(response)
}

/**
 * Upload file with FormData
 */
export async function upload<T = any>(
  url: string, 
  formData: FormData, 
  headers?: Record<string, string>
): Promise<T> {
  // Remove Content-Type for FormData (browser sets it automatically)
  const { 'Content-Type': _, ...otherHeaders } = headers || {}
  
  const response = await apiFetch<T>(url, {
    method: 'POST',
    body: formData,
    headers: otherHeaders
  })
  
  return handleResponse(response)
}

/**
 * Download file
 */
export async function download(url: string, filename?: string): Promise<void> {
  const response = await fetch(url, {
    credentials: 'include' // ✅ Download requests också inkluderar credentials
  })
  
  if (!response.ok) {
    throw new ApiError(`Download failed with status ${response.status}`, response.status)
  }
  
  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

// Export CSRF manager for manual token invalidation if needed
export { csrf }

// Export types
export type { ApiResponse }
