/**
 * Test-sida för server-side session
 * 
 * Testar:
 * - Server-side session-hantering
 * - AuthContext integration
 * - ProtectedRoute funktionalitet
 * - Användardata från server
 * 
 * How to run:
 * 1. Starta Docker: docker-compose up -d
 * 2. Gå till: http://localhost:3000/test-server-session
 * 3. Verifiera att användardata kommer från server
 */

'use client'

import { useAuth } from '@/lib/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function ServerSessionTest() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">🔄 Laddar session...</h1>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">❌ Ej inloggad</h1>
        <p className="text-gray-600 mb-4">
          Du måste logga in för att se denna sida. Denna data kommer från server-side session.
        </p>
        <Button onClick={() => window.location.href = '/login'}>
          Gå till login
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">✅ Server-Side Session Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800">Status:</p>
              <p className="text-sm text-green-600">✅ Inloggad via server-side session</p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800">Källa:</p>
              <p className="text-sm text-blue-600">Server-side session (inte localStorage)</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Data</h2>
          <div className="space-y-2">
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Tenant ID:</strong> {user?.tenant_id}</p>
            <p><strong>Superuser:</strong> {user?.is_superuser ? 'Ja' : 'Nej'}</p>
            <p><strong>Active:</strong> {user?.is_active ? 'Ja' : 'Nej'}</p>
            {user?.created_at && (
              <p><strong>Skapad:</strong> {new Date(user.created_at).toLocaleDateString('sv-SE')}</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Refresh Page
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="secondary"
          >
            Gå till Dashboard
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/admin/rules'} 
            variant="outline"
            disabled={!user?.is_superuser}
          >
            Admin Rules
          </Button>
          
          <Button 
            onClick={logout} 
            variant="outline"
          >
            Logout
          </Button>
        </div>
      </Card>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🔍 Vad testar vi?</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
          <li><strong>Server-side session:</strong> Användardata hämtas på servern, inte i webbläsaren</li>
          <li><strong>Cookie-baserad auth:</strong> Inga tokens i localStorage, bara säkra cookies</li>
          <li><strong>SSR integration:</strong> Session kontrolleras innan sidan renderas</li>
          <li><strong>AuthContext:</strong> Användardata tillgänglig i hela appen</li>
          <li><strong>Protected routes:</strong> Automatisk redirect vid behov</li>
        </ul>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Kontrollera att användardata visas korrekt (från server-side session)</li>
          <li>Klicka &quot;Refresh Page&quot; för att verifiera att session behålls</li>
          <li>Navigera till andra sidor för att testa auth-integration</li>
          <li>Testa logout-funktionaliteten</li>
          <li>Verifiera att superuser-behörigheter fungerar</li>
        </ol>
      </div>
    </div>
  )
}

// Wrap med ProtectedRoute för att skydda sidan
export default function ProtectedServerSessionTest() {
  return (
    <ProtectedRoute>
      <ServerSessionTest />
    </ProtectedRoute>
  )
}
