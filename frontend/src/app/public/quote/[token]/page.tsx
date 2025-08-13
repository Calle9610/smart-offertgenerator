'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface PublicQuoteItem {
  kind: string
  description?: string
  qty: string
  unit: string
  unit_price: string
  line_total: string
}

interface PublicQuote {
  company_name?: string
  project_name?: string
  customer_name: string
  currency: string
  items: PublicQuoteItem[]
  subtotal: string
  vat: string
  total: string
  summary?: string
  assumptions?: string
  exclusions?: string
  timeline?: string
  created_at: string
}

export default function PublicQuotePage() {
  const params = useParams()
  const token = params.token as string
  
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fetch quote data on component mount
  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use relative URL to avoid CORS and environment variable issues
      // The backend is accessible via the same hostname in production
      const response = await fetch(`/api/public/quotes/${token}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Offerten kunde inte hittas. Länken kan vara ogiltig eller ha gått ut.')
        } else {
          setError('Ett fel uppstod när offerten skulle hämtas.')
        }
        return
      }
      
      const data = await response.json()
      setQuote(data)
    } catch (err) {
      setError('Kunde inte ansluta till servern. Kontrollera din internetanslutning.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'accept' | 'decline') => {
    try {
      setActionLoading(true)
      setActionResult(null)
      
      // Use relative URL to avoid CORS and environment variable issues
      const response = await fetch(`/api/public/quotes/${token}/${action}`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        setActionResult(`Fel: ${errorData.detail || 'Ett oväntat fel uppstod'}`)
        return
      }
      
      const result = await response.json()
      
      if (action === 'accept') {
        setActionResult('Tack för din acceptans! Vi återkommer snart med mer information.')
      } else {
        setActionResult('Tack för din återkoppling. Vi återkommer om du har frågor.')
      }
      
      // Refresh quote data to show updated status
      setTimeout(() => {
        fetchQuote()
      }, 1000)
      
    } catch (err) {
      setActionResult('Ett fel uppstod. Försök igen senare.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Hämtar offert...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Offert inte tillgänglig</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchQuote}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    )
  }

  if (!quote) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            {quote.company_name && (
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{quote.company_name}</h2>
            )}
            {quote.project_name && (
              <h3 className="text-lg text-gray-700 mb-1">{quote.project_name}</h3>
            )}
            <p className="text-gray-600">För: {quote.customer_name}</p>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Skapad: {new Date(quote.created_at).toLocaleDateString('sv-SE')}
          </div>
        </div>

        {/* Quote Items Table */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offertrader</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beskrivning
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Antal
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enhet
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Á-pris
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Radsumma
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quote.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.kind === 'labor' ? 'bg-blue-100 text-blue-800' :
                        item.kind === 'material' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.kind === 'labor' ? 'Arbete' :
                         item.kind === 'material' ? 'Material' : 'Övrigt'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {item.description || '-'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 text-right">
                      {parseFloat(item.qty).toLocaleString('sv-SE')}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 text-right">
                      {item.unit}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 text-right">
                      {parseFloat(item.unit_price).toLocaleString('sv-SE')} {quote.currency}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-gray-900 text-right">
                      {parseFloat(item.line_total).toLocaleString('sv-SE')} {quote.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delsumma:</span>
                <span className="font-medium">{parseFloat(quote.subtotal).toLocaleString('sv-SE')} {quote.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Moms ({parseFloat(quote.vat) / parseFloat(quote.subtotal) * 100}%):</span>
                <span className="font-medium">{parseFloat(quote.vat).toLocaleString('sv-SE')} {quote.currency}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Totalt:</span>
                <span>{parseFloat(quote.total).toLocaleString('sv-SE')} {quote.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(quote.summary || quote.assumptions || quote.exclusions || quote.timeline) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ytterligare information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quote.summary && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Sammanfattning</h4>
                  <p className="text-gray-600 text-sm">{quote.summary}</p>
                </div>
              )}
              
              {quote.assumptions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Förutsättningar</h4>
                  <p className="text-gray-600 text-sm">{quote.assumptions}</p>
                </div>
              )}
              
              {quote.exclusions && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ej inkluderat</h4>
                  <p className="text-gray-600 text-sm">{quote.exclusions}</p>
                </div>
              )}
              
              {quote.timeline && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tidsplan</h4>
                  <p className="text-gray-600 text-sm">{quote.timeline}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Vad tycker du om offerten?</h3>
          
          {actionResult ? (
            <div className="text-center">
              <div className="text-green-600 text-lg mb-4">✅ {actionResult}</div>
              <button 
                onClick={() => setActionResult(null)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Stäng meddelande
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleAction('accept')}
                disabled={actionLoading}
                className="flex-1 sm:flex-none bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {actionLoading ? 'Bearbetar...' : 'Acceptera offert'}
              </button>
              
              <button
                onClick={() => handleAction('decline')}
                disabled={actionLoading}
                className="flex-1 sm:flex-none bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {actionLoading ? 'Bearbetar...' : 'Avböj offert'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
