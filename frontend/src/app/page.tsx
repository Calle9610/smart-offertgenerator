'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const router = useRouter()

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

  const handleLogout = () => {
    if (window.confirm('Är du säker på att du vill logga ut?')) {
      localStorage.removeItem('token')
      setIsAuthenticated(false)
      setUsername('')
      // Redirect to home page
      router.push('/')
    }
  }

  const handleLogin = () => {
    setShowLoginForm(true)
  }

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('token', token)
    setIsAuthenticated(true)
    setShowLoginForm(false)
    // Refresh auth status
    checkAuthStatus()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-4xl p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">Smart Offertgenerator</h1>
          </header>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Kontrollerar autentisering...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show login form if requested
  if (showLoginForm) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-4xl p-6">
          <header className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Smart Offertgenerator</h1>
                <p className="text-gray-600">Logga in för att komma åt systemet</p>
              </div>
              <button
                onClick={() => setShowLoginForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Tillbaka
              </button>
            </div>
          </header>
          
          <div className="flex justify-center">
            <LoginForm onLogin={handleLoginSuccess} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Smart Offertgenerator</h1>
              <p className="text-gray-600">Välkommen till offertsystemet!</p>
            </div>
            
            {/* Authentication status and logout button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Inloggad som: <span className="font-medium text-gray-900">{username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Logga ut
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Logga in
              </button>
            )}
          </div>
        </header>
        
        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <p className="text-lg text-gray-700">
                Välkommen tillbaka! Du kan nu skapa offerter och hantera projekt.
              </p>
              <div className="flex gap-4">
                <a className="inline-block rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors" href="/quotes/new">
                  Ny offert
                </a>
                <a className="inline-block rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors" href="/intake/new">
                  Ny projektintag
                </a>
                <a className="inline-block rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors" href="/test">
                  Test Backend
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-700">
                Logga in för att komma åt offertsystemet och skapa nya offerter.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleLogin}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg"
                >
                  Logga in för att komma igång
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
