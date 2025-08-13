'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PublicQuote, PublicQuotePackage, AcceptQuoteRequest } from '@/types/public-quote'

export default function PublicQuotePage() {
  const params = useParams()
  const token = params.token as string
  
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [acceptedPackage, setAcceptedPackage] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchQuote()
  }, [token])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/quotes/${token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Kunde inte hämta offerten')
      }
      
      const data = await response.json()
      setQuote(data)
      if (data.accepted_package_id) {
        setAcceptedPackage(data.accepted_package_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptPackage = async (packageId: string) => {
    try {
      setAccepting(packageId)
      const response = await fetch(`/api/public/quotes/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId } as AcceptQuoteRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Kunde inte acceptera offerten')
      }

      const data = await response.json()
      setAcceptedPackage(packageId)
      setQuote(prev => prev ? { ...prev, accepted_package_id: packageId } : null)
      
      // Visa bekräftelse
      alert(`✅ Offerten accepterad! Du har valt ${quote?.packages.find(p => p.id === packageId)?.name} paketet.`)
    } catch (err) {
      alert(`❌ Fel: ${err instanceof Error ? err.message : 'Kunde inte acceptera offerten'}`)
    } finally {
      setAccepting(null)
    }
  }

  const toggleExpandedItems = (packageId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(packageId)) {
        newSet.delete(packageId)
      } else {
        newSet.add(packageId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar offert...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Offert kunde inte hittas</h1>
          <p className="text-gray-600 mb-4">{error || 'Offerten finns inte eller har gått ut'}</p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Gå tillbaka till startsidan
          </a>
        </div>
      </div>
    )
  }

  const defaultPackage = quote.packages.find(p => p.is_default)
  const premiumPackage = quote.packages.find(p => p.name.toLowerCase().includes('premium'))
  const standardPackage = quote.packages.find(p => p.name.toLowerCase().includes('standard'))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Offert för {quote.customer_name}
            </h1>
            {quote.project_name && (
              <p className="text-xl text-gray-600">{quote.project_name}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Skapad: {new Date(quote.created_at).toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Package Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Välj ditt paket
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quote.packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                  acceptedPackage === pkg.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Badges */}
                <div className="absolute -top-3 left-4 right-4 flex justify-center">
                  {pkg.is_default && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Bäst värde
                    </span>
                  )}
                  {pkg.name.toLowerCase().includes('premium') && (
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full ml-2">
                      Premium
                    </span>
                  )}
                </div>

                {/* Package Header */}
                <div className="p-6 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    {pkg.total} {quote.currency}
                  </div>
                  
                  {/* Package Details */}
                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex justify-between">
                      <span>Delsumma:</span>
                      <span>{pkg.subtotal} {quote.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moms:</span>
                      <span>{pkg.vat} {quote.currency}</span>
                    </div>
                  </div>

                  {/* Accept Button */}
                  {acceptedPackage === pkg.id ? (
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium">
                        ✅ Accepterad
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcceptPackage(pkg.id)}
                      disabled={accepting === pkg.id}
                      className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                        accepting === pkg.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {accepting === pkg.id ? 'Accepterar...' : `Acceptera ${pkg.name}`}
                    </button>
                  )}
                </div>

                {/* Expandable Items */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => toggleExpandedItems(pkg.id)}
                    className="w-full px-6 py-3 text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 transition-colors"
                  >
                    {expandedItems.has(pkg.id) ? '▼ Dölj detaljer' : '▶ Visa detaljer'}
                  </button>
                  
                  {expandedItems.has(pkg.id) && (
                    <div className="px-6 pb-6">
                      <div className="space-y-3">
                        {pkg.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.description || item.kind}</div>
                              <div className="text-sm text-gray-500">
                                {item.qty} {item.unit} × {item.unit_price} {quote.currency}
                              </div>
                            </div>
                            <div className="text-right font-medium text-gray-900">
                              {item.line_total} {quote.currency}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Offertsammanfattning</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Kundinformation</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Kund:</strong> {quote.customer_name}</p>
                {quote.project_name && (
                  <p><strong>Projekt:</strong> {quote.project_name}</p>
                )}
                <p><strong>Status:</strong> {quote.status}</p>
                <p><strong>Valuta:</strong> {quote.currency}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Totalsumma</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Delsumma:</span>
                  <span className="font-medium">{quote.subtotal} {quote.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Moms:</span>
                  <span className="font-medium">{quote.vat} {quote.currency}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-2">
                  <span>Totalt:</span>
                  <span>{quote.total} {quote.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Denna offert är giltig i 30 dagar från skapandedatum</p>
          <p className="mt-1">För frågor, kontakta oss via telefon eller e-post</p>
        </div>
      </div>
    </div>
  )
} 
