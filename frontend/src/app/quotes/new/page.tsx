/**
 * New Quote Page - Skapa ny offert
 * 
 * Denna sida låter användare skapa nya offerter.
 * Skyddad med withAuth HOC och använder apiClient för säkra API-anrop.
 * 
 * How to run:
 * 1. Starta Docker: docker-compose up -d
 * 2. Gå till: http://localhost:3000/quotes/new
 * 3. Sidan skyddas automatiskt med withAuth
 */

'use client'

import { withAuth } from '@/lib/withAuth'
import QuoteForm from '@/components/QuoteForm'

interface User {
  id?: string
  username: string
  email: string
  tenant_id: string
  is_superuser: boolean
  full_name?: string
  is_active?: boolean
  created_at?: string
}

function NewQuotePage({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">Skapa ny offert</h2>
          <p className="text-gray-600 mt-1">
            Fyll i information om kund och projekt
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Inloggad som: {user.username} ({user.email})
          </div>
        </header>
        <QuoteForm />
      </div>
    </div>
  )
}

// Skydda sidan med withAuth HOC
export default withAuth(NewQuotePage)
