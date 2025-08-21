/**
 * Protected Route Component
 * 
 * Denna komponent skyddar sidor genom att:
 * - Kontrollera om användare är inloggad
 * - Redirecta till login om ej autentiserad
 * - Visa loading-state under kontroll
 * - Hantera redirect efter login
 * 
 * How to run:
 * 1. Wrap skyddade sidor: <ProtectedRoute>...</ProtectedRoute>
 * 2. Använd useAuth() hook för användardata
 * 3. Automatisk redirect till login vid behov
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { LoadingSkeleton } from '@/components/system'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSuperUser?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireSuperUser = false,
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Hämta redirect URL från query params
  const redirectUrl = searchParams.get('redirect')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Användare är inte inloggad, redirect till login
      setIsRedirecting(true)
      const loginUrl = `/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`
      router.push(loginUrl)
    }
  }, [isLoading, isAuthenticated, router, redirectUrl])

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireSuperUser && user && !user.is_superuser) {
      // Användare är inte superuser, redirect till dashboard
      setIsRedirecting(true)
      router.push('/dashboard')
    }
  }, [isLoading, isAuthenticated, requireSuperUser, user, router])

  // Visa loading-state
  if (isLoading || isRedirecting) {
    return fallback || <LoadingSkeleton />
  }

  // Användare är inte autentiserad
  if (!isAuthenticated) {
    return null // Redirect kommer att hanteras av useEffect
  }

  // Kontrollera superuser-behörighet
  if (requireSuperUser && user && !user.is_superuser) {
    return null // Redirect kommer att hanteras av useEffect
  }

  // Användare är autentiserad och har rätt behörighet
  return <>{children}</>
}

/**
 * HOC för att skydda komponenter
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requireSuperUser: boolean = false
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requireSuperUser={requireSuperUser}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * HOC för att skydda komponenter som kräver superuser
 */
export function withSuperUserAccess<P extends object>(
  Component: React.ComponentType<P>
) {
  return withProtectedRoute(Component, true)
}
