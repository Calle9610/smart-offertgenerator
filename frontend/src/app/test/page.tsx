'use client'
import { useState } from 'react'
import { login } from '@/app/api'

export default function TestPage() {
  const [status, setStatus] = useState<string>('Click to test')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const testBackend = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/health')
      if (response.ok) {
        const data = await response.json()
        setStatus(`✅ Backend OK: ${JSON.stringify(data)}`)
      } else {
        setStatus(`❌ Backend Error: ${response.status}`)
      }
    } catch (error) {
      setStatus(`❌ Network Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await login('admin', 'admin123')
      setToken(response.access_token)
      setStatus(`✅ Login OK: Token received (${response.access_token.slice(0, 20)}...)`)
      console.log('Token:', response.access_token)
    } catch (error) {
      setStatus(`❌ Login Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testProjectRequirements = async () => {
    if (!token) {
      setStatus('❌ No token available. Login first.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/project-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_type: 'bathroom',
          area_m2: 10,
          finish_level: 'standard',
          has_plumbing_work: true,
          has_electrical_work: false,
          material_prefs: [],
          site_constraints: [],
          notes: 'Test from frontend'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStatus(`✅ Project Requirements OK: ID ${data.id}`)
      } else {
        const errorText = await response.text()
        setStatus(`❌ Project Requirements Error: ${errorText}`)
      }
    } catch (error) {
      setStatus(`❌ Project Requirements Network Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Frontend-Backend Test</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Backend Health Check</h2>
            <button
              onClick={testBackend}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Backend Health'}
            </button>
            <p className="mt-2 text-sm text-gray-600">{status}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Login Test</h2>
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Login'}
            </button>
            <p className="mt-2 text-sm text-gray-600">{status}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Project Requirements Test</h2>
            <button
              onClick={testProjectRequirements}
              disabled={loading || !token}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Project Requirements'}
            </button>
            <p className="mt-2 text-sm text-gray-600">{status}</p>
            {token && (
              <p className="mt-2 text-xs text-green-600">
                Token available: {token.slice(0, 20)}...
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            <p className="text-sm text-gray-600">
              Frontend: <span className="text-green-600">✅ Running on port 3000</span><br/>
              Backend: <span className="text-green-600">✅ Running on port 8000</span><br/>
              Database: <span className="text-green-600">✅ PostgreSQL running</span><br/>
              Token: {token ? <span className="text-green-600">✅ Available</span> : <span className="text-red-600">❌ Missing</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
