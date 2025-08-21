/**
 * Authentication Client med cookie-baserad autentisering
 * 
 * Denna klient hanterar:
 * - getSession() - Hämtar aktuell användare från /users/me
 * - login() - Loggar in användare och sätter cookies
 * - logout() - Loggar ut användare och tömmer cookies
 * 
 * Alla funktioner använder apiClient för säker kommunikation
 * 
 * How to run:
 * 1. Importera: import { getSession, login, logout } from '@/lib/authClient'
 * 2. Använd: const user = await getSession()
 * 3. Cookies hanteras automatiskt av apiClient
 */

import { get, post } from './apiClient'

// Types
export interface User {
  id?: string
  username: string
  email: string
  tenant_id: string
  is_superuser: boolean
  full_name?: string
  is_active?: boolean
  created_at?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  message: string
  user: {
    username: string
    email: string
    tenant_id: string
    is_superuser: boolean
  }
}

export interface SessionResponse {
  user: User
}

/**
 * Hämta aktuell användarsession
 * 
 * @returns User-objekt om inloggad, null om ej inloggad
 */
export async function getSession(): Promise<User | null> {
  try {
    const response: SessionResponse = await get('/api/users/me')
    return response.user
  } catch (error) {
    // Om 401 eller annat fel, användaren är inte inloggad
    if (error instanceof Error && error.message.includes('401')) {
      return null
    }
    // Logga andra fel men returnera null
    console.warn('Failed to get session:', error)
    return null
  }
}

/**
 * Logga in användare
 * 
 * @param credentials - Användarnamn och lösenord
 * @returns User-objekt vid lyckad inloggning
 * @throws Error vid misslyckad inloggning
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  try {
    const response: LoginResponse = await post('/api/auth/login', credentials)
    // Konvertera login response till User interface
    return {
      username: response.user.username,
      email: response.user.email,
      tenant_id: response.user.tenant_id,
      is_superuser: response.user.is_superuser
    }
  } catch (error) {
    // Konvertera till användarvänligt felmeddelande
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Felaktigt användarnamn eller lösenord')
      } else if (error.message.includes('422')) {
        throw new Error('Ogiltiga inloggningsuppgifter')
      } else if (error.message.includes('429')) {
        throw new Error('För många inloggningsförsök. Försök igen senare')
      } else if (error.message.includes('500')) {
        throw new Error('Serverfel. Kontakta support')
      }
    }
    
    // Fallback felmeddelande
    throw new Error('Inloggning misslyckades. Kontrollera dina uppgifter och försök igen')
  }
}

/**
 * Logga ut användare
 * 
 * @returns true vid lyckad utloggning
 * @throws Error vid misslyckad utloggning
 */
export async function logout(): Promise<boolean> {
  try {
    await post('/api/auth/logout')
    return true
  } catch (error) {
    // Logga felet men låt användaren fortsätta
    console.warn('Logout request failed:', error)
    
    // Även om request misslyckas, rensa lokalt state
    // Cookies kommer att rensas av backend
    return true
  }
}

/**
 * Kontrollera om användare är inloggad
 * 
 * @returns true om inloggad, false annars
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getSession()
    return user !== null
  } catch (error) {
    console.warn('Failed to check authentication status:', error)
    return false
  }
}

/**
 * Kontrollera om användare är superuser
 * 
 * @returns true om superuser, false annars
 */
export async function isSuperUser(): Promise<boolean> {
  try {
    const user = await getSession()
    return user?.is_superuser === true
  } catch (error) {
    console.warn('Failed to check superuser status:', error)
    return false
  }
}

/**
 * Hämta användarens tenant ID
 * 
 * @returns tenant_id som string eller null
 */
export async function getTenantId(): Promise<string | null> {
  try {
    const user = await getSession()
    return user?.tenant_id || null
  } catch (error) {
    console.warn('Failed to get tenant ID:', error)
    return null
  }
}

/**
 * Hämta användarens användarnamn
 * 
 * @returns username som string eller null
 */
export async function getUsername(): Promise<string | null> {
  try {
    const user = await getSession()
    return user?.username || null
  } catch (error) {
    console.warn('Failed to get username:', error)
    return null
  }
}
