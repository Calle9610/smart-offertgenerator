'use client'
import { useState, useEffect } from 'react'
import { calcQuote, createQuote, generatePDF } from '@/app/api'

type Item = { kind: 'labor'|'material'|'custom'; description?: string; ref?: string; unit?: string; qty: number; unit_price: number }

export default function QuoteForm() {
  const [customer, setCustomer] = useState('Testkund AB')
  const [project, setProject] = useState('Badrum 6 m²')
  const [vatRate, setVatRate] = useState(25)
  const [items, setItems] = useState<Item[]>([
    { kind:'labor', description:'Snickeri', unit:'hour', qty: 8, unit_price: 650 },
    { kind:'material', description:'Kakel 20x20', unit:'m2', qty: 20, unit_price: 216 },
  ])
  const [totals, setTotals] = useState<{subtotal:number, vat:number, total:number} | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null)

  // Debug: Log when createdQuoteId changes
  useEffect(() => {
    console.log('createdQuoteId changed to:', createdQuoteId)
  }, [createdQuoteId])

  // Debug: Log current state
  useEffect(() => {
    console.log('Current state - createdQuoteId:', createdQuoteId, 'loading:', loading)
  })

  function updateItem(idx:number, patch: Partial<Item>) {
    setItems(prev => prev.map((it,i)=> i===idx? {...it, ...patch}: it))
  }

  async function handleCalc() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        customer_name: customer,
        project_name: project,
        profile_id: '00000000-0000-0000-0000-000000000001',
        currency: 'SEK',
        vat_rate: vatRate,
        items: items
      }
      const res = await calcQuote(payload)
      setTotals(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
      console.error('Calc error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        customer_name: customer,
        project_name: project,
        profile_id: '00000000-0000-0000-0000-000000000001',
        currency: 'SEK',
        vat_rate: vatRate,
        items: items
      }
      console.log('Creating quote with payload:', payload)
      const res = await createQuote(payload)
      console.log('Quote created successfully:', res)
      setCreatedQuoteId(res.id)
      console.log('Set createdQuoteId to:', res.id)
      alert(`Offert skapad! ID: ${res.id}\nTotal: ${res.total} SEK`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
      console.error('Create error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGeneratePDF() {
    if (!createdQuoteId) {
      setError('Du måste skapa en offert först innan du kan generera PDF')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      await generatePDF(createdQuoteId)
      alert('PDF genererad och nedladdad!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid PDF-generering')
      console.error('PDF error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border rounded p-2" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Kundnamn"/>
        <input className="border rounded p-2" value={project} onChange={e=>setProject(e.target.value)} placeholder="Projektnamn"/>
        <input className="border rounded p-2" type="number" value={vatRate} onChange={e=>setVatRate(parseFloat(e.target.value))} placeholder="Moms %"/>
      </div>

      <div className="space-y-2">
        {items.map((it, idx)=> (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
            <select className="border rounded p-2" value={it.kind} onChange={e=>updateItem(idx,{kind: e.target.value as Item['kind']})}>
              <option value="labor">Arbete</option>
              <option value="material">Material</option>
              <option value="custom">Övrigt</option>
            </select>
            <input className="border rounded p-2" value={it.description||''} onChange={e=>updateItem(idx,{description:e.target.value})} placeholder="Beskrivning"/>
            <input className="border rounded p-2" value={it.unit||''} onChange={e=>updateItem(idx,{unit:e.target.value})} placeholder="Enhet"/>
            <input className="border rounded p-2" type="number" value={it.qty} onChange={e=>updateItem(idx,{qty: parseFloat(e.target.value)})} placeholder="Antal"/>
            <input className="border rounded p-2" type="number" value={it.unit_price} onChange={e=>updateItem(idx,{unit_price: parseFloat(e.target.value)})} placeholder="Á-pris exkl. moms"/>
            <button className="border rounded p-2" onClick={()=>setItems(prev=>prev.filter((_,i)=>i!==idx))}>Ta bort</button>
          </div>
        ))}
        <button className="rounded bg-gray-200 px-3 py-2" onClick={()=>setItems(prev=>[...prev,{kind:'labor', qty:1, unit_price:0} as Item])}>+ Lägg till rad</button>
      </div>

      <div className="flex gap-3">
        <button 
          className={`rounded px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-black text-white'}`} 
          onClick={handleCalc}
          disabled={loading}
        >
          {loading ? 'Räknar...' : 'Räkna'}
        </button>
        <button 
          className={`rounded px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-emerald-600 text-white'}`} 
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Sparar...' : 'Spara offert'}
        </button>
        {createdQuoteId && (
          <button 
            className={`rounded px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-blue-600 text-white'}`} 
            onClick={handleGeneratePDF}
            disabled={loading}
          >
            {loading ? 'Genererar...' : '📄 Generera PDF'}
          </button>
        )}
      </div>

      {totals && (
        <div className="mt-4 border rounded p-3 bg-white">
          <div>Delsumma: <strong>{totals.subtotal.toFixed(2)} SEK</strong></div>
          <div>Moms: <strong>{totals.vat.toFixed(2)} SEK</strong></div>
          <div>Totalt: <strong>{totals.total.toFixed(2)} SEK</strong></div>
        </div>
      )}

      {createdQuoteId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <div className="text-green-800">
            <strong>✅ Offert skapad!</strong>
          </div>
          <div className="text-sm text-green-600 mt-1">
            ID: {createdQuoteId}
          </div>
        </div>
      )}
    </div>
  )
}
