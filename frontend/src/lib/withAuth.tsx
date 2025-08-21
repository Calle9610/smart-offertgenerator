/**
 * withAuth HOC - Enkel autentiseringsskydd för sidor
 * 
 * Denna HOC skyddar sidor genom att:
 * - Pinga getSession() på klienten
 * - Redirecta till /login om ej autentiserad
 * - Hantera loading-state automatiskt
 * - Ge enkel syntax för utvecklare
 * 
 * How to run:
 * 1. Importera: import { withAuth } from '@/lib/withAuth'
 * 2. Wrap komponent: export default withAuth(MyComponent)
 * 3. Sidan skyddas automatiskt
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from './authClient'
import { LoadingSkeleton } from '@/components/system'

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

interface WithAuthOptions {
  redirectTo?: string
  requireSuperUser?: boolean
  fallback?: React.ComponentType
}

/**
 * HOC för att skydda komponenter med autentisering
 * 
 * @param Component - Komponenten att skydda
 * @param options - Konfigurationsalternativ
 * @returns Skyddad komponent
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P & { user: User }>,
  options: WithAuthOptions = {}
) {
  const {
    redirectTo = '/login',
    requireSuperUser = false,
    fallback: Fallback = LoadingSkeleton
  } = options

  return function AuthenticatedComponent(props: P) {
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
            // Ingen session, redirect till login
            setIsRedirecting(true)
            router.push(redirectTo)
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
          // Vid fel, redirect till login
          setIsRedirecting(true)
          router.push(redirectTo)
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [router, redirectTo, requireSuperUser])

    // Visa loading-state
    if (isLoading || isRedirecting) {
      return <Fallback />
    }

    // Användare är inte autentiserad
    if (!user) {
      return null // Redirect kommer att hanteras av useEffect
    }

    // Användare är autentiserad och har rätt behörighet
    return <Component {...props} user={user} />
  }
}

/**
 * HOC för att skydda komponenter som kräver superuser-behörighet
 * 
 * @param Component - Komponenten att skydda
 * @param options - Konfigurationsalternativ
 * @returns Skyddad komponent
 */
export function withSuperUser<P extends object>(
  Component: React.ComponentType<P & { user: User }>,
  options: Omit<WithAuthOptions, 'requireSuperUser'> = {}
) {
  return withAuth(Component, { ...options, requireSuperUser: true })
}

/**
 * HOC för att skydda komponenter med custom redirect
 * 
 * @param Component - Komponenten att skydda
 * @param redirectTo - Custom redirect URL
 * @returns Skyddad komponent
 */
export function withAuthRedirect<P extends object>(
  Component: React.ComponentType<P & { user: User }>,
  redirectTo: string
) {
  return withAuth(Component, { redirectTo })
}
