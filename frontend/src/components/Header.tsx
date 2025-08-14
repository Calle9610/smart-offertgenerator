'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/*
 * A11Y CHECKLIST - Header Component
 * ✅ role="banner" - Tydlig sidstruktur
 * ✅ role="navigation" - Navigationssektion
 * ✅ role="status" - Loading-indikator
 * ✅ aria-label på alla länkar - Beskrivande text
 * ✅ aria-label på alla knappar - Beskrivande text
 * ✅ Focus ring på alla interaktiva element - focus:ring-2 focus:ring-ring
 * ✅ Hover states - hover:text-gray-700, hover:bg-red-700
 * ✅ Semantisk HTML - header, nav, button, a
 * 
 * MANUELL TESTNING:
 * 1. TAB genom header - ska ha synlig fokusring på alla element
 * 2. Screen reader - ska läsa struktur och labels korrekt
 * 3. Hover states - ska vara synliga på alla interaktiva element
 * 4. Focus ring - ska vara synlig på alla knappar och länkar
 * 5. Loading state - ska meddelas av screen reader
 */

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      // Verify token with backend
      const response = await fetch('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setIsAuthenticated(true)
        setUsername(userData.username)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('token')
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      localStorage.removeItem('token')
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = useCallback(() => {
    if (window.confirm('Är du säker på att du vill logga ut?')) {
      localStorage.removeItem('token')
      setIsAuthenticated(false)
      setUsername('')
      // Redirect to home page
      router.push('/')
    }
  }, [router])

  const handleLogin = useCallback(() => {
    router.push('/')
  }, [router])

  // Memoize the pathname check to avoid unnecessary re-renders
  const shouldShowHeader = useMemo(() => pathname !== '/', [pathname])

  // Don't show header on home page since it has its own
  if (!shouldShowHeader) {
    return null
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <a 
              href="/" 
              className="text-xl font-semibold text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded transition-all duration-150 ease-out"
              aria-label="Gå till startsidan"
            >
              Smart Offertgenerator
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8" role="navigation" aria-label="Huvudnavigation">
            {isAuthenticated && (
              <>
                <a 
                  href="/quotes/new" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-150 ease-out"
                  aria-label="Skapa ny offert"
                >
                  Ny offert
                </a>
                <a 
                  href="/intake/new" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-150 ease-out"
                  aria-label="Skapa ny projektintag"
                >
                  Ny projektintag
                </a>
              </>
            )}
          </nav>

          {/* Authentication */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div 
                className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"
                role="status"
                aria-label="Laddar användarinformation"
              ></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Inloggad som: <span className="font-medium text-gray-900">{username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-150 ease-out text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Logga ut från systemet"
                >
                  Logga ut
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all duration-150 ease-out text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Logga in på systemet"
              >
                Logga in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 
