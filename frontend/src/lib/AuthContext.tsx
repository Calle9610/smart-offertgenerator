/**
 * Authentication Context för React
 * 
 * Denna context hanterar:
 * - Användardata från server-side session
 * - Client-side auth-state
 * - Automatisk session-refresh
 * - Logout-hantering
 * 
 * How to run:
 * 1. Wrap app med AuthProvider i layout.tsx
 * 2. Använd useAuth() hook i komponenter
 * 3. Användardata kommer från server-side session
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSession, logout as clientLogout } from './authClient'

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

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

// Skapa context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook för att använda auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Props för AuthProvider
interface AuthProviderProps {
  children: ReactNode
  initialUser?: User | null
}

// AuthProvider komponent
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [isLoading, setIsLoading] = useState(true)

  // Kontrollera session vid mount
  useEffect(() => {
    if (!initialUser) {
      // Ingen initial user, kontrollera session
      checkSession()
    } else {
      // Vi har redan user från server, sätt loading till false
      setIsLoading(false)
    }
  }, [initialUser])

  // Kontrollera session
  const checkSession = async () => {
    try {
      setIsLoading(true)
      const sessionUser = await getSession()
      setUser(sessionUser)
    } catch (error) {
      console.warn('Failed to check session:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh session
  const refreshSession = async () => {
    await checkSession()
  }

  // Logout
  const logout = async () => {
    try {
      await clientLogout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Rensa user state även om logout misslyckas
      setUser(null)
    }
  }

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    logout,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// HOC för att skydda komponenter
export function withAuth<P extends object>(
  Component: React.ComponentType<P & { user: User }>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth()

    if (isLoading) {
      return <div>Laddar...</div>
    }

    if (!user) {
      return <div>Du måste logga in för att se denna sida</div>
    }

    return <Component {...props} user={user} />
  }
}

// Hook för att kontrollera om användare är superuser
export function useSuperUser() {
  const { user } = useAuth()
  return user?.is_superuser === true
}

// Hook för att hämta tenant ID
export function useTenantId() {
  const { user } = useAuth()
  return user?.tenant_id || null
}

// Hook för att hämta username
export function useUsername() {
  const { user } = useAuth()
  return user?.username || null
}
