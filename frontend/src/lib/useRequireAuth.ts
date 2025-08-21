/**
 * useRequireAuth Hook - Enkel autentiseringsskydd för sidor
 * 
 * Denna hook skyddar sidor genom att:
 * - Pinga getSession() på klienten
 * - Redirecta till /login om ej autentiserad
 * - Hantera loading-state automatiskt
 * - Ge enkel syntax för utvecklare
 * 
 * How to run:
 * 1. Importera: import { useRequireAuth } from '@/lib/useRequireAuth'
 * 2. Använd i komponent: const { user, isLoading } = useRequireAuth()
 * 3. Sidan skyddas automatiskt
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from './authClient'

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

interface UseRequireAuthOptions {
  redirectTo?: string
  requireSuperUser?: boolean
  onUnauthorized?: () => void
}

interface UseRequireAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isSuperUser: boolean
}

/**
 * Hook för att skydda komponenter med autentisering
 * 
 * @param options - Konfigurationsalternativ
 * @returns Auth-state och användardata
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthReturn {
  const {
    redirectTo = '/login',
    requireSuperUser = false,
    onUnauthorized
  } = options

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        setIsLoading(true)
        const sessionUser = await getSession()
        
        if (!sessionUser) {
          // Ingen session, hantera unauthorized
          if (onUnauthorized) {
            onUnauthorized()
          } else {
            // Default: redirect till login
            setIsRedirecting(true)
            router.push(redirectTo)
          }
          return
        }

        if (requireSuperUser && !sessionUser.is_superuser) {
          // Ej superuser, redirect till dashboard
          setIsRedirecting(true)
          router.push('/dashboard')
          return
        }

        // Användare är autentiserad och har rätt behörighet
        setUser(sessionUser)
      } catch (error) {
        console.warn('Auth check failed:', error)
        // Vid fel, hantera unauthorized
        if (onUnauthorized) {
          onUnauthorized()
        } else {
          // Default: redirect till login
          setIsRedirecting(true)
          router.push(redirectTo)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, redirectTo, requireSuperUser, onUnauthorized])

  return {
    user,
    isLoading: isLoading || isRedirecting,
    isAuthenticated: user !== null,
    isSuperUser: user?.is_superuser === true
  }
}

/**
 * Hook för att skydda komponenter som kräver superuser-behörighet
 * 
 * @param options - Konfigurationsalternativ
 * @returns Auth-state och användardata
 */
export function useRequireSuperUser(options: Omit<UseRequireAuthOptions, 'requireSuperUser'> = {}) {
  return useRequireAuth({ ...options, requireSuperUser: true })
}

/**
 * Hook för att skydda komponenter med custom redirect
 * 
 * @param redirectTo - Custom redirect URL
 * @param options - Övriga konfigurationsalternativ
 * @returns Auth-state och användardata
 */
export function useRequireAuthRedirect(
  redirectTo: string,
  options: Omit<UseRequireAuthOptions, 'redirectTo'> = {}
) {
  return useRequireAuth({ ...options, redirectTo })
}

/**
 * Hook för att skydda komponenter med custom unauthorized-hantering
 * 
 * @param onUnauthorized - Callback för unauthorized-state
 * @param options - Övriga konfigurationsalternativ
 * @returns Auth-state och användardata
 */
export function useRequireAuthCustom(
  onUnauthorized: () => void,
  options: Omit<UseRequireAuthOptions, 'onUnauthorized'> = {}
) {
  return useRequireAuth({ ...options, onUnauthorized })
}
