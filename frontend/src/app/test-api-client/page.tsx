/**
 * Test-sida för apiClient
 * 
 * Testar:
 * - GET requests
 * - POST requests
 * - CSRF token hantering
 * - Error handling
 * 
 * How to run:
 * 1. Starta Docker: docker-compose up -d
 * 2. Gå till: http://localhost:3000/test-api-client
 * 3. Klicka på test-knapparna för att verifiera funktionalitet
 */

'use client'

import { useState } from 'react'
import { get, post, csrf } from '@/lib/apiClient'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface TestResult {
  test: string
  success: boolean
  message: string
  timestamp: string
}

export default function TestApiClientPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (test: string, success: boolean, message: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testGetRequest = async () => {
    setIsLoading(true)
    try {
      const data = await get('/api/health')
      addResult('GET /api/health', true, `Success: ${JSON.stringify(data)}`)
    } catch (error) {
      addResult('GET /api/health', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPostRequest = async () => {
    setIsLoading(true)
    try {
      const data = await post('/api/test-endpoint', { message: 'Test from apiClient' })
      addResult('POST /api/test-endpoint', true, `Success: ${JSON.stringify(data)}`)
    } catch (error) {
      addResult('POST /api/test-endpoint', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testCSRFToken = async () => {
    setIsLoading(true)
    try {
      const token = await csrf.get()
      addResult('CSRF Token', true, `Token: ${token.substring(0, 20)}...`)
    } catch (error) {
      addResult('CSRF Token', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testBackendHealth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/health', {
        credentials: 'include'
      })
      const data = await response.json()
      addResult('Backend Health', true, `Status: ${response.status}, Data: ${JSON.stringify(data)}`)
    } catch (error) {
      addResult('Backend Health', false, `Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🧪 API Client Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
          <div className="space-y-3">
            <Button 
              onClick={testGetRequest} 
              disabled={isLoading}
              className="w-full"
            >
              Test GET Request
            </Button>
            
            <Button 
              onClick={testPostRequest} 
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              Test POST Request
            </Button>
            
            <Button 
              onClick={testCSRFToken} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Test CSRF Token
            </Button>
            
            <Button 
              onClick={testBackendHealth} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Test Backend Health
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">API Client Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Status:</strong> {isLoading ? '🔄 Testing...' : '✅ Ready'}</p>
            <p><strong>Frontend URL:</strong> http://localhost:3000</p>
            <p><strong>Backend URL:</strong> /api/* (via proxy)</p>
            <p><strong>CSRF Endpoint:</strong> /api/auth/csrf-token</p>
            <p><strong>Refresh Endpoint:</strong> /api/auth/refresh</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>
        
        {results.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Klicka på test-knapparna ovan för att börja testa apiClient
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
          <li>Starta med "Test CSRF Token" för att verifiera token-hantering</li>
          <li>Testa "Test GET Request" för att verifiera GET-anrop</li>
          <li>Testa "Test POST Request" för att verifiera POST med CSRF</li>
          <li>Testa "Test Backend Health" för att verifiera backend-anslutning</li>
          <li>Kontrollera att alla requests skickar cookies och CSRF-tokens</li>
        </ol>
      </div>
    </div>
  )
}
