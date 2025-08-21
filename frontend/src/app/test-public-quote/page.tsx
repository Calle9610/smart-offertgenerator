'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestPublicQuotePage() {
  const [token] = useState('test-token-123')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Testa Publik Offertsida
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Funktioner att testa:
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Hämta publika offertdata (inklusive paket)</li>
                <li>Rendera tre paket som kort/flikar</li>
                <li>Visa summering och expanderbara rader</li>
                <li>Knappar &quot;Acceptera paket&quot; med POST till accept endpoint</li>
                <li>Visa bekräftelse efter acceptans</li>
                <li>Mobilvänlig design</li>
                <li>Badges: &quot;Bäst värde&quot; (Standard) och &quot;Premium&quot;</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Testa med denna token:</h3>
              <code className="bg-blue-100 px-2 py-1 rounded text-blue-800 font-mono">
                {token}
              </code>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Länkar att testa:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href={`/public/quote/${token}`}
                  className="block p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  🚀 Gå till publik offertsida
                </Link>
                
                <Link
                  href="/test-packages"
                  className="block p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  📦 Testa paketgenerering
                </Link>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Viktigt att komma ihåg:</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Backend måste köra på port 8000</li>
                <li>• Frontend måste köra på port 3000/3001</li>
                <li>• API routes fungerar som proxy till backend</li>
                <li>• Testa med en riktig offert-token från backend</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
