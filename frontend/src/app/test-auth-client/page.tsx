/**
 * Test-sida för authClient
 * 
 * Testar:
 * - getSession() - Hämtar aktuell användare
 * - login() - Loggar in användare
 * - logout() - Loggar ut användare
 * - Cookies sätts/töms automatiskt
 * 
 * How to run:
 * 1. Starta Docker: docker-compose up -d
 * 2. Gå till: http://localhost:3000/test-auth-client
 * 3. Testa inloggning/utloggning för att verifiera funktionalitet
 */

'use client'

import { useState, useEffect } from 'react'
import { getSession, login, logout, isAuthenticated, isSuperUser } from '@/lib/authClient'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface TestResult {
  test: string
  success: boolean
  message: string
  timestamp: string
}

export default function TestAuthClientPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  const addResult = (test: string, success: boolean, message: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  // Hämta aktuell session vid laddning
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const user = await getSession()
      setCurrentUser(user)
      if (user) {
        addResult('Auto Session Check', true, `Inloggad som: ${user.username}`)
      } else {
        addResult('Auto Session Check', true, 'Ingen aktiv session')
      }
    } catch (error) {
      addResult('Auto Session Check', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const testGetSession = async () => {
    setIsLoading(true)
    try {
      const user = await getSession()
      if (user) {
        addResult('GET Session', true, `User: ${user.username} (${user.email})`)
        setCurrentUser(user)
      } else {
        addResult('GET Session', true, 'Ingen aktiv session')
        setCurrentUser(null)
      }
    } catch (error) {
      addResult('GET Session', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    if (!credentials.username || !credentials.password) {
      addResult('Login', false, 'Ange användarnamn och lösenord')
      return
    }

    setIsLoading(true)
    try {
      const user = await login(credentials)
      addResult('Login', true, `Inloggad som: ${user.username}`)
      setCurrentUser(user)
      // Rensa credentials
      setCredentials({ username: '', password: '' })
    } catch (error) {
      addResult('Login', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      addResult('Logout', true, 'Utloggad framgångsrikt')
      setCurrentUser(null)
    } catch (error) {
      addResult('Logout', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testIsAuthenticated = async () => {
    setIsLoading(true)
    try {
      const authenticated = await isAuthenticated()
      addResult('Is Authenticated', true, `Result: ${authenticated ? 'Ja' : 'Nej'}`)
    } catch (error) {
      addResult('Is Authenticated', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testIsSuperUser = async () => {
    setIsLoading(true)
    try {
      const isSuper = await isSuperUser()
      addResult('Is Super User', true, `Result: ${isSuper ? 'Ja' : 'Nej'}`)
    } catch (error) {
      addResult('Is Super User', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔐 Auth Client Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">Session Status:</p>
              <p className="text-sm text-gray-600">
                {currentUser ? `✅ Inloggad som ${currentUser.username}` : '❌ Ej inloggad'}
              </p>
            </div>
            
            {currentUser && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium">User Info:</p>
                <p className="text-sm text-gray-600">
                  Email: {currentUser.email}<br/>
                  Tenant: {currentUser.tenant_id}<br/>
                  Superuser: {currentUser.is_superuser ? 'Ja' : 'Nej'}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Login Form</h2>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Användarnamn"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Lösenord"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            />
            <Button 
              onClick={testLogin} 
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-full"
            >
              Login
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={testGetSession} 
            disabled={isLoading}
            variant="outline"
          >
            Get Session
          </Button>
          
          <Button 
            onClick={testLogout} 
            disabled={isLoading || !currentUser}
            variant="secondary"
          >
            Logout
          </Button>
          
          <Button 
            onClick={testIsAuthenticated} 
            disabled={isLoading}
            variant="outline"
          >
            Is Authenticated
          </Button>
          
          <Button 
            onClick={testIsSuperUser} 
            disabled={isLoading}
            variant="outline"
          >
            Is Super User
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>
        
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Klicka på test-knapparna ovan för att börja testa authClient
          </p>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? '✅' : '❌'} {result.test}
                    </p>
                    <p className={`text-sm ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Starta med "Get Session" för att kontrollera aktuell status</li>
          <li>Ange användarnamn/lösenord och klicka "Login"</li>
          <li>Verifiera att session skapas och cookies sätts</li>
          <li>Testa "Is Authenticated" och "Is Super User"</li>
          <li>Klicka "Logout" och verifiera att cookies töms</li>
          <li>Kontrollera att alla requests skickar cookies automatiskt</li>
        </ol>
      </div>
    </div>
  )
}
