'use client'

// How to run: This page allows editing of existing quotes
// Navigate to /quotes/[id]/edit to edit a specific quote
// Reuses QuoteForm component with edit mode

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import QuoteForm from '@/components/QuoteForm'
import { QuoteDto, CreateQuoteRequest } from '@/types/quote'
import { getQuote } from '@/app/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSkeleton } from '@/components/system'
import { 
  ArrowLeft, 
  AlertCircle, 
  FileText,
  Save,
  X
} from 'lucide-react'

export default function EditQuotePage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params['id'] as string
  
  const [quote, setQuote] = useState<QuoteDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Fetch quote data on component mount
  useEffect(() => {
    async function fetchQuote() {
      try {
        setLoading(true)
        setError(null)
        
        // Get token from localStorage
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/')
          return
        }

        const quoteData = await getQuote(quoteId)
        setQuote(quoteData)
      } catch (err) {
        console.error('Error fetching quote:', err)
        setError(err instanceof Error ? err.message : 'Kunde inte ladda offert')
      } finally {
        setLoading(false)
      }
    }

    if (quoteId) {
      fetchQuote()
    }
  }, [quoteId, router])

  // Handle save changes
  const handleSave = async (updatedData: CreateQuoteRequest) => {
    try {
      setSaving(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Ingen autentiseringstoken hittad')
      }

      // Update the quote via API
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Kunde inte uppdatera offert: ${errorText}`)
      }

      // Redirect back to quote view
      router.push(`/quotes/${quoteId}`)
    } catch (err) {
      console.error('Error saving quote:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte spara ändringar')
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    router.push(`/quotes/${quoteId}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6">
            <LoadingSkeleton className="h-8 w-64 mb-2" />
            <LoadingSkeleton className="h-4 w-96" />
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <LoadingSkeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <LoadingSkeleton className="h-4 w-full" />
                  <LoadingSkeleton className="h-4 w-3/4" />
                  <LoadingSkeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Kunde inte ladda offert
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Gå tillbaka
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              Försök igen
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Empty state (should not happen with valid ID)
  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Offert hittades inte
          </h1>
          <p className="text-gray-600 mb-6">
            Offerten med ID {quoteId} kunde inte hittas.
          </p>
          <Button
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Gå tillbaka
          </Button>
        </Card>
      </div>
    )
  }

  // Transform quote data to form format
  const initialFormData: CreateQuoteRequest = {
    customer_name: quote.customer,
    project_name: quote.project,
    profile_id: 'default-profile', // TODO: Get from quote if available
    currency: quote.totals.currency,
    vat_rate: 25.0, // TODO: Calculate from quote data
    items: quote.items.map(item => ({
      kind: item.kind,
      ref: item.ref || '',
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unit_price: item.unit_price,
      is_optional: item.is_optional,
      option_group: item.option_group || null
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tillbaka
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Redigera offert</h1>
                <p className="text-gray-600">
                  Offert #{quote.id.slice(0, 8)} - {quote.customer}
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Avbryt
              </Button>
              <Button
                onClick={() => handleSave(initialFormData)}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Sparar...' : 'Spara'}
              </Button>
            </div>
          </div>
        </header>

        {/* Edit form */}
        <div className="bg-white rounded-lg border shadow-sm">
          <QuoteForm 
            initialData={initialFormData}
            mode="edit"
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
}
