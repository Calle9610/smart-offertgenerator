/**
 * DEPRECATED: Gamla auth-helpers som varnar i konsolen
 * 
 * Dessa funktioner är ersatta av den nya autentiseringsarkitekturen.
 * Använd istället:
 * - apiClient.get/post/put/del för API-anrop
 * - withAuth HOC för sid-skydd
 * - useRequireAuth hook för auth-kontroll
 * - authClient för session-hantering
 * 
 * How to run:
 * 1. Ta bort alla imports av dessa funktioner
 * 2. Ersätt med nya auth-funktioner
 * 3. Ta bort denna fil när alla varningar är borta
 */

/**
 * @deprecated Använd apiClient.get/post/put/del istället
 */
export function getToken(): string | null {
  console.warn('🚨 DEPRECATED: getToken() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return null
}

/**
 * @deprecated Använd authClient.login() istället
 */
export function setToken(_token: string): void {
  console.warn('🚨 DEPRECATED: setToken() är ersatt av authClient.login(). Använd authClient.login() istället.')
  console.warn('📚 Läs mer: frontend/src/lib/authClient.md')
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function authHeader(): Record<string, string> {
  console.warn('🚨 DEPRECATED: authHeader() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return {}
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function getAuthHeader(): Record<string, string> {
  console.warn('🚨 DEPRECATED: getAuthHeader() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return {}
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function createAuthHeaders(): Record<string, string> {
  console.warn('🚨 DEPRECATED: createAuthHeaders() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return {}
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function withAuthHeader(headers: Record<string, string>): Record<string, string> {
  console.warn('🚨 DEPRECATED: withAuthHeader() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return headers
}

/**
 * @deprecated Använd authClient.isAuthenticated() istället
 */
export function isAuthenticated(): boolean {
  console.warn('🚨 DEPRECATED: isAuthenticated() är ersatt av authClient.isAuthenticated(). Använd authClient.isAuthenticated() istället.')
  console.warn('📚 Läs mer: frontend/src/lib/authClient.md')
  return false
}

/**
 * @deprecated Använd authClient.getSession() istället
 */
export function getCurrentUser(): any {
  console.warn('🚨 DEPRECATED: getCurrentUser() är ersatt av authClient.getSession(). Använd authClient.getSession() istället.')
  console.warn('📚 Läs mer: frontend/src/lib/authClient.md')
  return null
}

/**
 * @deprecated Använd authClient.logout() istället
 */
export function clearToken(): void {
  console.warn('🚨 DEPRECATED: clearToken() är ersatt av authClient.logout(). Använd authClient.logout() istället.')
  console.warn('📚 Läs mer: frontend/src/lib/authClient.md')
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  console.warn('🚨 DEPRECATED: authenticatedFetch() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return fetch(url, options)
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function apiCall(url: string, options: RequestInit = {}): Promise<Response> {
  console.warn('🚨 DEPRECATED: apiCall() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return fetch(url, options)
}

/**
 * @deprecated Använd apiClient för API-anrop istället
 */
export function secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
  console.warn('🚨 DEPRECATED: secureRequest() är ersatt av apiClient. Använd apiClient.get/post/put/del istället.')
  console.warn('📚 Läs mer: frontend/src/lib/apiClient.md')
  return fetch(url, options)
}

// Varning när modulen importeras
console.warn('🚨 DEPRECATED: Importerar gamla auth-helpers. Dessa är ersatta av den nya autentiseringsarkitekturen.')
console.warn('📚 Läs mer: frontend/src/lib/apiClient.md, frontend/src/lib/authClient.md')
