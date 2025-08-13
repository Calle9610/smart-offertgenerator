'use client'

import { useState } from 'react'

interface QuotePackage {
  id: string
  name: string
  subtotal: string
  vat: string
  total: string
  is_default: boolean
}

export default function TestPackagesPage() {
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  const generatePackages = async () => {
    setGenerating(true)
    setMessage('')
    
    try {
      // Simulera API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockPackages: QuotePackage[] = [
        {
          id: '1',
          name: 'Basic',
          subtotal: '1000.00',
          vat: '250.00',
          total: '1250.00',
          is_default: true
        },
        {
          id: '2',
          name: 'Standard',
          subtotal: '950.00',
          vat: '237.50',
          total: '1187.50',
          is_default: false
        },
        {
          id: '3',
          name: 'Premium',
          subtotal: '900.00',
          vat: '225.00',
          total: '1125.00',
          is_default: false
        }
      ]
      
      setPackages(mockPackages)
      setMessage('✅ Paket genererade framgångsrikt!')
    } catch (error) {
      setMessage('❌ Fel vid generering av paket')
    } finally {
      setGenerating(false)
    }
  }

  const setDefaultPackage = (packageId: string) => {
    setPackages(prev => prev.map(pkg => ({
      ...pkg,
      is_default: pkg.id === packageId
    })))
    setMessage('✅ Standardpaket uppdaterat!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Testa Paketoffert-funktionalitet</h1>
        <p className="text-gray-600 mb-4">
          Denna sida låter dig testa alla paketoffert-funktioner:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Skapa en offert</li>
          <li>Generera 3 paket (Basic, Standard, Premium)</li>
          <li>Sätt standardpaket</li>
          <li>Se paketindikator</li>
          <li>Skicka offert</li>
        </ul>
      </div>
      
      {/* Paketgenerering */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Paketoffert</h2>
          <button
            onClick={generatePackages}
            disabled={generating}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Genererar...' : 'Generera 3 paket'}
          </button>
        </div>
        
        {message && (
          <div className={`p-3 rounded-md mb-4 ${
            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        {packages.length > 0 ? (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="defaultPackage"
                      checked={pkg.is_default}
                      onChange={() => setDefaultPackage(pkg.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {pkg.is_default ? 'Standard' : 'Sätt som standard'}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{pkg.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{pkg.total} SEK</div>
                  <div className="text-sm text-gray-600">Delsumma: {pkg.subtotal} SEK</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Inga paket genererade ännu. Klicka på "Generera 3 paket" för att skapa Basic, Standard och Premium alternativ.
          </p>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Enkel test-sida</h2>
        <p className="text-gray-600">
          Denna sida fungerar utan komplexa komponenter. Om du ser denna text fungerar routing korrekt.
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Routing fungerar!</p>
          <p className="text-green-700 text-sm">Nu kan vi lägga till paketfunktionaliteten steg för steg.</p>
        </div>
      </div>
    </div>
  )
} 
