'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import SendQuoteModal from './SendQuoteModal'
import Toast from './Toast'
import StatusChip from './StatusChip'

interface QuoteItem {
  kind: string
  ref?: string
  description?: string
  qty: number
  unit?: string
  unit_price: number
  line_total: number
}

interface QuotePackage {
  id: string
  name: string
  items: QuoteItem[]
  subtotal: string
  vat: string
  total: string
  is_default: boolean
  created_at: string
}

interface CreatedQuote {
  id: string
  status: string
  public_token?: string
}

export default function QuoteForm() {
  const params = useParams()
  const urlQuoteId = params.id as string
  
  const [customer, setCustomer] = useState('Testkund AB')
  const [project, setProject] = useState('Badrum 6 m²')
  const [vatRate, setVatRate] = useState(25)
  const [items, setItems] = useState<QuoteItem[]>([
    { kind: 'labor', description: 'Snickeri', unit: 'hour', qty: 8, unit_price: 650, line_total: 5200 },
    { kind: 'material', description: 'Kakel 20x20', unit: 'm2', qty: 20, unit_price: 216, line_total: 4320 },
  ])
  const [totals, setTotals] = useState<{ subtotal: number; vat: number; total: number } | null>(null)
  const [createdQuote, setCreatedQuote] = useState<CreatedQuote | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')
  const [toastAction, setToastAction] = useState<{ label: string; url: string } | undefined>()
  
  // Package-related state
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [generatingPackages, setGeneratingPackages] = useState(false)

  // Profile ID state
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  // Auto-tuning state
  const [showAutoTuningInfo, setShowAutoTuningInfo] = useState(false)
  const [autoTuningInsights, setAutoTuningInsights] = useState<any>(null)

  // Get the actual quote ID - either from URL params (for editing) or from created quote
  const quoteId = urlQuoteId !== 'new' ? urlQuoteId : createdQuote?.id

  // Fetch profile ID on component mount
  useEffect(() => {
    const fetchProfileId = async () => {
      try {
        const response = await fetch('/api/price-profiles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const profiles = await response.json()
          if (profiles.length > 0) {
            setProfileId(profiles[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching profile ID:', error)
      }
    }

    fetchProfileId()
  }, [])

  // Fetch auto-tuning insights when component mounts
  useEffect(() => {
    const fetchAutoTuningInsights = async () => {
      try {
        const response = await fetch('/api/auto-tuning/insights', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const insights = await response.json()
          setAutoTuningInsights(insights)
        }
      } catch (error) {
        console.error('Error fetching auto-tuning insights:', error)
      }
    }

    fetchAutoTuningInsights()
  }, [])

  // Combined effect to fetch packages when either quoteId or createdQuote changes
  useEffect(() => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (currentQuoteId && currentQuoteId !== 'new') {
      fetchPackages()
    }
  }, [quoteId, createdQuote])

  const fetchPackages = async () => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (!currentQuoteId) return

    try {
      setLoadingPackages(true)
      const response = await fetch(`/api/quotes/${currentQuoteId}/packages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoadingPackages(false)
    }
  }

  const generatePackages = async () => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (!currentQuoteId) {
      setToastMessage('Du måste skapa en offert först innan du kan generera paket')
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      setGeneratingPackages(true)
      const response = await fetch(`/api/quotes/${currentQuoteId}/packages/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          package_names: ['Basic', 'Standard', 'Premium'],
          discount_percentages: [0, 5, 10]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
        setToastMessage('Paket genererade framgångsrikt!')
        setToastType('success')
        setShowToast(true)
      } else {
        const errorData = await response.json()
        setToastMessage(`Fel vid generering: ${errorData.detail}`)
        setToastType('error')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error generating packages:', error)
      setToastMessage('Ett fel uppstod vid generering av paket')
      setToastType('error')
      setShowToast(true)
    } finally {
      setGeneratingPackages(false)
    }
  }

  const setDefaultPackage = async (packageId: string) => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (!currentQuoteId) return

    try {
      // Update local state immediately for better UX
      const updatedPackages = packages.map(pkg => ({
        ...pkg,
        is_default: pkg.id === packageId
      }))
      setPackages(updatedPackages)
      
      // Here you would typically make an API call to update the default package
      // For now, we'll just update the local state
      setToastMessage('Standardpaket uppdaterat!')
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      console.error('Error setting default package:', error)
      setToastMessage('Fel vid uppdatering av standardpaket')
      setToastType('error')
      setShowToast(true)
    }
  }

  function updateItem(idx: number, patch: Partial<QuoteItem>) {
    const oldItem = items[idx]
    const newItem = { ...oldItem, ...patch }
    
    // Log adjustment if quantity or unit price changed
    if (createdQuote && (
      (patch.qty !== undefined && patch.qty !== oldItem.qty) ||
      (patch.unit_price !== undefined && patch.unit_price !== oldItem.unit_price)
    )) {
      logAdjustment(
        oldItem.ref || `item_${idx}`,
        oldItem.kind,
        oldItem.qty,
        patch.qty || oldItem.qty,
        oldItem.unit_price,
        patch.unit_price || oldItem.unit_price,
        'Användarjustering'
      )
    }
    
    setItems(prev => prev.map((it, i) => i === idx ? newItem : it))
  }

  async function handleCalc() {
    if (!profileId) {
      setToastMessage('Du måste välja en prisprofil först')
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      setLoading(true)
      const payload = {
        customer_name: customer,
        project_name: project,
        profile_id: profileId,
        currency: 'SEK',
        vat_rate: vatRate,
        items: items
      }

      const response = await fetch('/api/quotes/calc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        setTotals(data)
        setToastMessage('Beräkning slutförd!')
        setToastType('success')
        setShowToast(true)
      } else {
        const errorData = await response.json()
        setToastMessage(`Fel vid beräkning: ${errorData.detail}`)
        setToastType('error')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error calculating quote:', error)
      setToastMessage('Ett fel uppstod vid beräkning')
      setToastType('error')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!profileId) {
      setToastMessage('Du måste välja en prisprofil först')
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      setLoading(true)
      const payload = {
        customer_name: customer,
        project_name: project,
        profile_id: profileId,
        currency: 'SEK',
        vat_rate: vatRate,
        items: items
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedQuote({
          id: data.id,
          status: 'draft',
          public_token: data.public_token
        })
        setToastMessage(`Offert skapad! ID: ${data.id}`)
        setToastType('success')
        setShowToast(true)
      } else {
        const errorData = await response.json()
        setToastMessage(`Fel vid skapande: ${errorData.detail}`)
        setToastType('error')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      setToastMessage('Ett fel uppstod vid skapande av offert')
      setToastType('error')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSendQuote = async (toEmail: string, message?: string) => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (!currentQuoteId) {
      setToastMessage('Ingen offert att skicka')
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      const response = await fetch(`/api/quotes/${currentQuoteId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          toEmail,
          message
        })
      })

      if (response.ok) {
        const data = await response.json()
        setToastMessage('Offert skickad framgångsrikt!')
        setToastType('success')
        setToastAction({
          label: 'Visa publik länk',
          url: data.public_url
        })
        setShowToast(true)
        setShowSendModal(false)
      } else {
        const errorData = await response.json()
        setToastMessage(`Fel vid sändning: ${errorData.detail}`)
        setToastType('error')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      setToastMessage('Ett fel uppstod vid sändning av offert')
      setToastType('error')
      setShowToast(true)
    }
  }

  const handleDownloadPDF = async () => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (!currentQuoteId) {
      setToastMessage('Ingen offert att ladda ner')
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      setDownloadingPDF(true)
      const response = await fetch(`/api/quotes/${currentQuoteId}/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `offert-${currentQuoteId.slice(0, 8)}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setToastMessage('Offert laddad ner framgångsrikt!')
        setToastType('success')
        setShowToast(true)
      } else {
        const errorData = await response.json()
        setToastMessage(`Fel vid laddning av PDF: ${errorData.detail}`)
        setToastType('error')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setToastMessage('Ett fel uppstod vid laddning av PDF')
      setToastType('error')
      setShowToast(true)
    } finally {
      setDownloadingPDF(false)
    }
  }

  const logAdjustment = async (
    itemRef: string,
    itemKind: string,
    originalQty: number,
    adjustedQty: number,
    originalUnitPrice: number,
    adjustedUnitPrice: number,
    reason?: string
  ) => {
    const currentQuoteId = quoteId || createdQuote?.id
    if (!currentQuoteId) return

    try {
      await fetch(`/api/quotes/${currentQuoteId}/adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          item_ref: itemRef,
          item_kind: itemKind,
          original_qty: originalQty,
          adjusted_qty: adjustedQty,
          original_unit_price: originalUnitPrice,
          adjusted_unit_price: adjustedUnitPrice,
          adjustment_reason: reason
        })
      })
    } catch (error) {
      console.error('Error logging adjustment:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quote Header - only show after creation */}
      {createdQuote && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Offert #{createdQuote.id.slice(0, 8)}
              </h2>
              <p className="text-gray-600">Kund: {customer}</p>
            </div>
            <div className="flex items-center space-x-3">
              <StatusChip status={createdQuote.status} />
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloadingPDF ? 'Laddar ner...' : 'Ladda ner PDF'}
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Skicka offert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package generation section */}
      {(quoteId || createdQuote) && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Paketoffert</h3>
          
          <button
            onClick={generatePackages}
            disabled={generatingPackages}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPackages ? 'Genererar...' : 'Generera 3 paket'}
          </button>
          
          {packages.length === 0 ? (
            <p className="mt-4 text-blue-700">
              Inga paket genererade ännu. Klicka på 'Generera 3 paket' för att skapa Basic, Standard och Premium alternativ.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="defaultPackage"
                      checked={pkg.is_default}
                      onChange={() => setDefaultPackage(pkg.id)}
                      className="text-blue-600"
                    />
                    <span className="font-medium">{pkg.name}</span>
                    <span className="text-gray-600">({pkg.total} SEK)</span>
                  </div>
                  {pkg.is_default && (
                    <span className="text-sm text-blue-600 font-medium">Standard</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-tuning insights section */}
      {autoTuningInsights && autoTuningInsights.total_patterns > 0 && (
        <div className="mt-8 p-6 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-900">Auto-Tuning Insights</h3>
            <button
              onClick={() => setShowAutoTuningInfo(!showAutoTuningInfo)}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              {showAutoTuningInfo ? 'Dölj detaljer' : 'Visa detaljer'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">{autoTuningInsights.total_patterns}</div>
              <div className="text-sm text-purple-600">Lärda mönster</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {(autoTuningInsights.average_confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-purple-600">Genomsnittlig konfidens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {autoTuningInsights.most_adjusted_item || 'Ingen'}
              </div>
              <div className="text-sm text-purple-600">Mest justerat</div>
            </div>
          </div>

          {showAutoTuningInfo && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-purple-800">Förbättringsförslag:</h4>
              <ul className="space-y-2">
                {autoTuningInsights.improvement_suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start text-sm text-purple-700">
                    <span className="text-purple-500 mr-2">💡</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Basic Quote Form */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Offertdetaljer</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            className="border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Kundnamn"
          />
          <input
            className="border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Projektnamn"
          />
          <input
            className="border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="number"
            value={vatRate}
            onChange={(e) => setVatRate(parseFloat(e.target.value))}
            placeholder="Moms %"
          />
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-sm font-medium text-gray-700 pb-2 border-b">
            <div>Typ</div>
            <div>Beskrivning</div>
            <div>Enhet</div>
            <div>Antal</div>
            <div>Á-pris (SEK)</div>
            <div>Konfidens</div>
            <div></div>
          </div>
          
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
              <select
                className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={it.kind}
                onChange={(e) => updateItem(idx, { kind: e.target.value as QuoteItem['kind'] })}
              >
                <option value="labor">Arbete</option>
                <option value="material">Material</option>
                <option value="custom">Övrigt</option>
              </select>
              <input
                className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={it.description || ''}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                placeholder="Beskrivning"
              />
              <input
                className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={it.unit || ''}
                onChange={(e) => updateItem(idx, { unit: e.target.value })}
                placeholder="Enhet"
              />
              <input
                className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                value={it.qty}
                onChange={(e) => updateItem(idx, { qty: parseFloat(e.target.value) })}
                placeholder="Antal"
              />
              <input
                className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                value={it.unit_price}
                onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) })}
                placeholder="Á-pris exkl. moms"
              />
              <div className="flex items-center justify-center">
                {autoTuningInsights && it.ref && (
                  <div className="text-xs">
                    {(() => {
                      const pattern = autoTuningInsights.insights?.find((insight: any) => 
                        insight.item_ref === it.ref
                      )
                      if (pattern) {
                        const confidence = pattern.confidence_score
                        const color = confidence >= 0.8 ? 'text-green-600' : 
                                    confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                        return (
                          <span className={`${color} font-medium`}>
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        )
                      }
                      return <span className="text-gray-400">-</span>
                    })()}
                  </div>
                )}
              </div>
              <button
                className="border rounded-md p-2 text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
              >
                Ta bort
              </button>
            </div>
          ))}
          
          <button
            className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300 transition-colors"
            onClick={() => setItems(prev => [...prev, { kind: 'labor', qty: 1, unit_price: 0, line_total: 0 } as QuoteItem])}
          >
            + Lägg till rad
          </button>
        </div>

        {/* Action buttons - only show before quote creation */}
        {!createdQuote && (
          <div className="flex gap-3">
            <button
              onClick={handleCalc}
              disabled={loading || !profileId}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Beräknar...' : 'Räkna'}
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !profileId}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sparar...' : 'Spara offert'}
            </button>
          </div>
        )}

        {/* Totals - only show before quote creation */}
        {totals && !createdQuote && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Delsumma</div>
                <div className="text-lg font-bold text-gray-900">{totals.subtotal.toFixed(2)} SEK</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Moms</div>
                <div className="text-lg font-bold text-gray-900">{totals.vat.toFixed(2)} SEK</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Totalt</div>
                <div className="text-lg font-bold text-gray-900">{totals.total.toFixed(2)} SEK</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Quote Modal */}
      <SendQuoteModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendQuote}
        quoteId={quoteId || createdQuote?.id || ''}
        customerName={customer}
      />

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          action={toastAction}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
