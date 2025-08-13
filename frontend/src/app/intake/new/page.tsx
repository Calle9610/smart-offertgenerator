'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import IntakeWizard from '@/components/IntakeWizard'

export default function NewIntakePage() {
  const router = useRouter()
  const [requirementsId, setRequirementsId] = useState<string | null>(null)

  const handleComplete = (reqId: string) => {
    setRequirementsId(reqId)
    // Redirect to quotes/new with the requirements ID
    router.push(`/quotes/new?reqId=${reqId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Ny Projektintag</h1>
          <p className="mt-2 text-gray-600">
            Fyll i projektkrav för att automatiskt generera offert
          </p>
        </div>
        
        <IntakeWizard onComplete={handleComplete} />
      </div>
    </div>
  )
} 
