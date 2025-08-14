'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/api'

/*
 * A11Y CHECKLIST - LoginForm Component
 * ✅ role="form" - Tydlig formulärstruktur
 * ✅ aria-label på formulär - "Inloggningsformulär"
 * ✅ Synliga labels - Användarnamn och Lösenord
 * ✅ htmlFor koppling - Label kopplad till input
 * ✅ aria-required="true" - Indikerar obligatoriska fält
 * ✅ aria-describedby - Kopplar till hjälptext
 * ✅ role="alert" på felmeddelande - Screen reader meddelar fel
 * ✅ aria-live="polite" - Meddelar ändringar utan att störa
 * ✅ aria-atomic="true" - Läser hela felmeddelandet
 * ✅ Focus ring - focus:ring-indigo-500 på alla inputs
 * 
 * MANUELL TESTNING:
 * 1. TAB genom formulär - ska ha synlig fokusring
 * 2. Label koppling - klick på label ska fokusera input
 * 3. Felmeddelanden - ska läsas av screen reader
 * 4. Obligatoriska fält - ska indikeras tydligt
 * 5. Focus ring - ska vara synlig på alla inputs
 */

interface LoginFormProps {
  onLogin: (token: string) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('LoginForm: Attempting login with username:', username)

    try {
      const response = await login(username, password)
      console.log('LoginForm: Login successful, response:', response)
      console.log('LoginForm: Calling onLogin with token:', response.access_token.slice(0, 20) + '...')
      
      // Call the onLogin callback to save token
      onLogin(response.access_token)
      
      // Redirect to homepage after successful login
      router.push('/')
    } catch (err) {
      console.error('LoginForm: Login failed:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Smart Offertgenerator
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} role="form" aria-label="Inloggningsformulär">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Användarnamn
              </label>
                              <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  aria-required="true"
                  aria-describedby="username-help"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-150 ease-out hover:border-gray-400"
                  placeholder="Ange användarnamn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              <div id="username-help" className="sr-only">Ange ditt användarnamn</div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Lösenord
              </label>
                              <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  aria-required="true"
                  aria-describedby="password-help"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-150 ease-out hover:border-gray-400"
                  placeholder="Ange lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              <div id="password-help" className="sr-only">Ange ditt lösenord</div>
            </div>
          </div>

          {error && (
            <div 
              className="text-red-600 text-sm text-center"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              aria-label={loading ? 'Loggar in...' : 'Logga in'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-150 ease-out hover:shadow-md"
            >
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Default credentials:</p>
            <p><strong>Username:</strong> admin</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
        </form>
      </div>
    </div>
  )
} 
