'use client'

import { useState, useEffect } from 'react'
import { calcQuote, createQuote } from '@/app/api'
import SendQuoteModal from './SendQuoteModal'
import Toast from './Toast'
import StatusChip from './StatusChip'

type Item = { kind: 'labor'|'material'|'custom'; description?: string; ref?: string; unit?: string; qty: number; unit_price: number }

interface Quote {
  id: string
  customer_name: string
  project_name: string
  status: string
  public_token?: string
  subtotal: number
  vat: number
  total: number
}

export default function QuoteForm() {
  const [customer, setCustomer] = useState('Testkund AB')
  const [project, setProject] = useState('Badrum 6 m²')
  const [vatRate, setVatRate] = useState(25)
  const [items, setItems] = useState<Item[]>([
    { kind:'labor', description:'Snickeri', unit:'hour', qty: 8, unit_price: 650 },
    { kind:'material', description:'Kakel 20x20', unit:'m2', qty: 20, unit_price: 216 },
  ])
  const [totals, setTotals] = useState<{subtotal:number, vat:number, total:number} | null>(null)
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    action?: { label: string; url: string }
  } | null>(null)

  // Fetch company ID and profile ID on component mount
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanyAndProfile()
  }, [])

  const fetchCompanyAndProfile = async () => {
    try {
      setLoading(true)
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No JWT token found')
        return
      }

      // Fetch company ID
      const companiesResponse = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (companiesResponse.ok) {
        const companies = await companiesResponse.json()
        if (companies.length > 0) {
          // Fetch profile ID
          const profilesResponse = await fetch('/api/price-profiles', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (profilesResponse.ok) {
            const profiles = await profilesResponse.json()
            if (profiles.length > 0) {
              setProfileId(profiles[0].id)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching company/profile:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateItem(idx:number, patch: Partial<Item>) {
    setItems(prev => prev.map((it,i)=> i===idx? {...it, ...patch}: it))
  }

  async function handleCalc() {
    if (!profileId) {
      setToast({
        message: 'Ingen prisprofil hittad. Kontrollera att du är inloggad.',
        type: 'error'
      })
      return
    }

    const payload = {
      customer_name: customer,
      project_name: project,
      profile_id: profileId,
      currency: 'SEK',
      vat_rate: vatRate,
      items: items
    }
    try {
      const res = await calcQuote(payload)
      setTotals(res)
    } catch {
      setToast({
        message: 'Fel vid beräkning av offert.',
        type: 'error'
      })
    }
  }

  async function handleCreate() {
    if (!profileId) {
      setToast({
        message: 'Ingen prisprofil hittad. Kontrollera att du är inloggad.',
        type: 'error'
      })
      return
    }

    const payload = {
      customer_name: customer,
      project_name: project,
      profile_id: profileId,
      currency: 'SEK',
      vat_rate: vatRate,
      items: items
    }
    try {
      const res = await createQuote(payload)
      const newQuote: Quote = {
        id: res.id,
        customer_name: customer,
        project_name: project,
        status: 'draft',
        subtotal: res.subtotal,
        vat: res.vat,
        total: res.total
      }
      setCreatedQuote(newQuote)
      setToast({
        message: `Offert skapad! ID: ${res.id}`,
        type: 'success'
      })
    } catch {
      setToast({
        message: 'Fel vid skapande av offert.',
        type: 'error'
      })
    }
  }

  const handleSendQuote = async (email: string, message?: string) => {
    if (!createdQuote) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No JWT token found')
      }

      const response = await fetch(`/api/quotes/${createdQuote.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toEmail: email,
          message: message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send quote')
      }

      const result = await response.json()
      
      // Update quote status and add public token
      setCreatedQuote(prev => prev ? {
        ...prev,
        status: 'sent',
        public_token: result.public_token
      } : null)

      setToast({
        message: 'Offert skickad framgångsrikt!',
        type: 'success',
        action: {
          label: 'Öppna kundvy',
          url: `/public/quote/${result.public_token}`
        }
      })

    } catch (error) {
      console.error('Error sending quote:', error)
      setToast({
        message: `Fel vid skickande av offert: ${error instanceof Error ? error.message : 'Okänt fel'}`,
        type: 'error'
      })
    }
  }

  const isDisabled = loading || !profileId

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input 
          className="border rounded p-2" 
          value={customer} 
          onChange={e=>setCustomer(e.target.value)} 
          placeholder="Kundnamn"
          disabled={isDisabled}
        />
        <input 
          className="border rounded p-2" 
          value={project} 
          onChange={e=>setProject(e.target.value)} 
          placeholder="Projektnamn"
          disabled={isDisabled}
        />
        <input 
          className="border rounded p-2" 
          type="number" 
          value={vatRate} 
          onChange={e=>setVatRate(parseFloat(e.target.value))} 
          placeholder="Moms %"
          disabled={isDisabled}
        />
      </div>

      <div className="space-y-2">
        {items.map((it, idx)=> (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
            <select 
              className="border rounded p-2" 
              value={it.kind} 
              onChange={e=>updateItem(idx,{kind: e.target.value as Item['kind']})}
              disabled={isDisabled}
            >
              <option value="labor">Arbete</option>
              <option value="material">Material</option>
              <option value="custom">Övrigt</option>
            </select>
            <input 
              className="border rounded p-2" 
              value={it.description||''} 
              onChange={e=>updateItem(idx,{description:e.target.value})} 
              placeholder="Beskrivning"
              disabled={isDisabled}
            />
            <input 
              className="border rounded p-2" 
              value={it.unit||''} 
              onChange={e=>updateItem(idx,{unit:e.target.value})} 
              placeholder="Enhet"
              disabled={isDisabled}
            />
            <input 
              className="border rounded p-2" 
              type="number" 
              value={it.qty} 
              onChange={e=>updateItem(idx,{qty: parseFloat(e.target.value)})} 
              placeholder="Antal"
              disabled={isDisabled}
            />
            <input 
              className="border rounded p-2" 
              type="number" 
              value={it.unit_price} 
              onChange={e=>updateItem(idx,{unit_price: parseFloat(e.target.value)})} 
              placeholder="Á-pris exkl. moms"
              disabled={isDisabled}
            />
            <button 
              className="border rounded p-2" 
              onClick={()=>setItems(prev=>prev.filter((_,i)=>i!==idx))}
              disabled={isDisabled}
            >
              Ta bort
            </button>
          </div>
        ))}
        <button 
          className="rounded bg-gray-200 px-3 py-2" 
          onClick={()=>setItems(prev=>[...prev,{kind:'labor', qty:1, unit_price:0} as Item])}
          disabled={isDisabled}
        >
          + Lägg till rad
        </button>
      </div>

      <div className="flex gap-3">
        <button 
          className="rounded bg-black text-white px-4 py-2" 
          onClick={handleCalc}
          disabled={isDisabled}
        >
          Räkna
        </button>
        <button 
          className="rounded bg-emerald-600 text-white px-4 py-2" 
          onClick={handleCreate}
          disabled={isDisabled}
        >
          Spara offert
        </button>
      </div>

      {createdQuote && (
        <div className="mt-4 border rounded p-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Skapad offert</h3>
            <StatusChip status={createdQuote.status} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <div>Delsumma: <strong>{createdQuote.subtotal.toFixed(2)} SEK</strong></div>
          <div>Moms: <strong>{createdQuote.vat.toFixed(2)} SEK</strong></div>
            <div>Totalt: <strong>{createdQuote.total.toFixed(2)} SEK</strong></div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSendModal(true)}
              disabled={createdQuote.status !== 'draft'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Skicka offert
            </button>
            {createdQuote.public_token && (
              <a
                href={`/public/quote/${createdQuote.public_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors inline-block"
              >
                Öppna kundvy
              </a>
            )}
          </div>
        </div>
      )}

      {totals && (
        <div className="mt-4 border rounded p-3 bg-white">
          <div>Delsumma: <strong>{totals.subtotal.toFixed(2)} SEK</strong></div>
          <div>Moms: <strong>{totals.vat.toFixed(2)} SEK</strong></div>
          <div>Totalt: <strong>{totals.total.toFixed(2)} SEK</strong></div>
        </div>
      )}

      <SendQuoteModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendQuote}
        quoteId={createdQuote?.id || ''}
        customerName={createdQuote?.customer_name || ''}
      />
    </div>
  )
}
