/**
 * DEPRECATED: Index för gamla auth-helpers
 * 
 * Denna fil exporterar alla gamla auth-funktioner som varnar i konsolen.
 * Använd istället den nya autentiseringsarkitekturen.
 * 
 * @deprecated Använd apiClient, authClient, withAuth istället
 */

export * from './deprecated-auth-helpers'

// Varning när modulen importeras
console.warn('🚨 DEPRECATED: Importerar gamla auth-helpers från deprecated-auth. Dessa är ersatta av den nya autentiseringsarkitekturen.')
console.warn('📚 Läs mer: frontend/src/lib/apiClient.md, frontend/src/lib/authClient.md')
