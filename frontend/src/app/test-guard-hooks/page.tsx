/**
 * Test-sida för Guard HOC/hook
 * 
 * Testar:
 * - withAuth HOC för enkel sid-skydd
 * - useRequireAuth hook för flexibelt skydd
 * - Superuser-behörigheter
 * - Custom redirect och unauthorized-hantering
 * 
 * How to run:
 * 1. Starta Docker: docker-compose up -d
 * 2. Gå till: http://localhost:3000/test-guard-hooks
 * 3. Testa olika skyddsmetoder
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { withAuth } from '@/lib/withAuth'
import { useRequireAuth, useRequireSuperUser } from '@/lib/useRequireAuth'
import { LoadingSkeleton } from '@/components/system'

// Exempel 1: Enkel komponent som skyddas med withAuth HOC
function DashboardContent({ user }: { user: any }) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dashboard Content (withAuth HOC)</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Tenant:</strong> {user.tenant_id}</p>
        <Badge variant={user.is_superuser ? 'default' : 'secondary'}>
          {user.is_superuser ? 'Superuser' : 'Regular User'}
        </Badge>
      </div>
    </Card>
  )
}

// Exempel 2: Komponent som kräver superuser (withSuperUser HOC)
function AdminContent({ user }: { user: any }) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Content (withSuperUser HOC)</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Role:</strong> Superuser</p>
        <p className="text-green-600">Du har tillgång till admin-funktioner!</p>
      </div>
    </Card>
  )
}

// Exempel 3: Komponent som använder useRequireAuth hook
function ProfileContent() {
  const { user, isLoading, isAuthenticated, isSuperUser } = useRequireAuth()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Content (useRequireAuth Hook)</h2>
        <p className="text-red-600">Du måste logga in för att se denna sida</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Content (useRequireAuth Hook)</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Superuser:</strong> {isSuperUser ? 'Ja' : 'Nej'}</p>
      </div>
    </Card>
  )
}

// Exempel 4: Komponent som kräver superuser (useRequireSuperUser hook)
function SuperUserContent() {
  const { user, isLoading, isAuthenticated, isSuperUser } = useRequireSuperUser()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!isAuthenticated || !isSuperUser) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">SuperUser Content (useRequireSuperUser Hook)</h2>
        <p className="text-red-600">Du måste vara superuser för att se denna sida</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">SuperUser Content (useRequireSuperUser Hook)</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Role:</strong> Superuser</p>
        <p className="text-green-600">Välkommen till superuser-området!</p>
      </div>
    </Card>
  )
}

// Exempel 5: Komponent med custom unauthorized-hantering
function CustomAuthContent() {
  const [showCustomMessage, setShowCustomMessage] = useState(false)

  const { user, isLoading, isAuthenticated } = useRequireAuth({
    onUnauthorized: () => {
      setShowCustomMessage(true)
    }
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (showCustomMessage) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Auth Content</h2>
        <p className="text-yellow-600">Custom unauthorized-hantering aktiverad!</p>
        <Button onClick={() => setShowCustomMessage(false)} className="mt-2">
          Återställ
        </Button>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Auth Content</h2>
        <p className="text-red-600">Du måste logga in för att se denna sida</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Custom Auth Content</h2>
      <div className="space-y-2">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Status:</strong> Autentiserad</p>
      </div>
    </Card>
  )
}

// Huvudkomponent
function GuardHooksTest() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'Dashboard (HOC)', component: <DashboardContent user={null} /> },
    { id: 'admin', name: 'Admin (HOC)', component: <AdminContent user={null} /> },
    { id: 'profile', name: 'Profile (Hook)', component: <ProfileContent /> },
    { id: 'superuser', name: 'SuperUser (Hook)', component: <SuperUserContent /> },
    { id: 'custom', name: 'Custom (Hook)', component: <CustomAuthContent /> }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🛡️ Guard HOC/Hook Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Vad testar vi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">withAuth HOC</h3>
            <ul className="text-sm space-y-1">
              <li>• Enkel syntax: export default withAuth(Component)</li>
              <li>• Automatisk redirect till /login</li>
              <li>• Hanterar loading-state</li>
              <li>• Passar user som prop</li>
            </ul>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">useRequireAuth Hook</h3>
            <ul className="text-sm space-y-1">
              <li>• Flexibel syntax: const &#123; user &#125; = useRequireAuth()</li>
              <li>• Custom redirect och unauthorized-hantering</li>
              <li>• Mer kontroll över auth-flow</li>
              <li>• Direkt tillgång till auth-state</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id)}
            size="sm"
          >
            {tab.name}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📋 Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Klicka på olika tabs för att testa olika skyddsmetoder</li>
          <li>Verifiera att HOC:er skyddar komponenter automatiskt</li>
          <li>Testa att hooks ger flexibel auth-kontroll</li>
          <li>Kontrollera att superuser-behörigheter fungerar</li>
          <li>Testa custom unauthorized-hantering</li>
        </ol>
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">✅ Fördelar med denna approach</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
          <li><strong>Enkel syntax:</strong> Bara wrap komponenten eller använd hook</li>
          <li><strong>Ingen localStorage:</strong> Allt hanteras via cookies och server-side session</li>
          <li><strong>Flexibilitet:</strong> Välj mellan HOC (enkel) och hook (flexibel)</li>
          <li><strong>Automatisk hantering:</strong> Loading, redirect och error-states hanteras automatiskt</li>
          <li><strong>Type safety:</strong> Fullständigt TypeScript-stöd</li>
        </ul>
      </div>
    </div>
  )
}

// Wrap med withAuth för att skydda hela sidan
export default withAuth(GuardHooksTest)
