/**
 * Server-side session management
 * 
 * Denna util hanterar:
 * - Läser cookies på servern
 * - SSR-fetchar /users/me med cookies
 * - Returnerar user-data för skyddade sidor
 * - Hanterar publika rutter utan auth
 * 
 * How to run:
 * 1. Importera i layout.tsx: import { getServerSession } from '@/lib/serverSession'
 * 2. Använd: const user = await getServerSession()
 * 3. Passa user som prop/context till komponenter
 */

import { cookies } from 'next/headers'

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

export interface SessionResponse {
  user: User
}

/**
 * Hämta användarsession på servern
 * 
 * @returns User-objekt om inloggad, null om ej inloggad
 */
export async function getServerSession(): Promise<User | null> {
  try {
    // Hämta cookies från request
    const cookieStore = cookies()
    
    // Kontrollera om vi har auth-cookies
    const accessToken = cookieStore.get('access_token')
    const refreshToken = cookieStore.get('refresh_token')
    
    if (!accessToken && !refreshToken) {
      // Ingen auth-cookie, användare är inte inloggad
      return null
    }

    // Skapa cookie-header för fetch
    const cookieHeader = [
      accessToken && `access_token=${accessToken.value}`,
      refreshToken && `refresh_token=${refreshToken.value}`
    ].filter(Boolean).join('; ')

    // Fetch användardata från backend
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/users/me`, {
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json'
      },
      // Sätt cache till 0 för att alltid hämta färsk data
      cache: 'no-store'
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Användare är inte autentiserad
        return null
      }
      // Annat fel, logga men returnera null
      console.warn('Failed to fetch user session:', response.status, response.statusText)
      return null
    }

    const data: SessionResponse = await response.json()
    return data.user

  } catch (error) {
    // Logga felet men returnera null för att inte krascha appen
    console.warn('Error fetching server session:', error)
    return null
  }
}

/**
 * Kontrollera om användare är inloggad på servern
 * 
 * @returns true om inloggad, false annars
 */
export async function isServerAuthenticated(): Promise<boolean> {
  try {
    const user = await getServerSession()
    return user !== null
  } catch (error) {
    console.warn('Error checking server authentication:', error)
    return false
  }
}

/**
 * Kontrollera om användare är superuser på servern
 * 
 * @returns true om superuser, false annars
 */
export async function isServerSuperUser(): Promise<boolean> {
  try {
    const user = await getServerSession()
    return user?.is_superuser === true
  } catch (error) {
    console.warn('Error checking server superuser status:', error)
    return false
  }
}

/**
 * Hämta användarens tenant ID på servern
 * 
 * @returns tenant_id som string eller null
 */
export async function getServerTenantId(): Promise<string | null> {
  try {
    const user = await getServerSession()
    return user?.tenant_id || null
  } catch (error) {
    console.warn('Error getting server tenant ID:', error)
    return null
  }
}

/**
 * Hämta användarens användarnamn på servern
 * 
 * @returns username som string eller null
 */
export async function getServerUsername(): Promise<string | null> {
  try {
    const user = await getServerSession()
    return user?.username || null
  } catch (error) {
    console.warn('Error getting server username:', error)
    return null
  }
}

/**
 * Kontrollera om en route är publik (kräver ingen autentisering)
 * 
 * @param pathname - Aktuell sökväg
 * @returns true om publik route, false om skyddad
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/login',
    '/public',
    '/quote', // Publika offert-sidor
    '/api/public', // Publika API-endpoints
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Kontrollera om en route kräver autentisering
 * 
 * @param pathname - Aktuell sökväg
 * @returns true om route kräver auth, false om publik
 */
export function requiresAuthentication(pathname: string): boolean {
  return !isPublicRoute(pathname)
}

/**
 * Hämta session baserat på route-typ
 * 
 * @param pathname - Aktuell sökväg
 * @returns User-objekt för skyddade sidor, null för publika
 */
export async function getSessionForRoute(pathname: string): Promise<User | null> {
  if (isPublicRoute(pathname)) {
    // Publik route, ingen session behövs
    return null
  }
  
  // Skyddad route, hämta session
  return await getServerSession()
}
