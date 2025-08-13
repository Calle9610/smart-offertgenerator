'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoTuningInsight {
  pattern_key: string
  room_type: string
  finish_level: string
  item_ref: string
  adjustment_factor: number
  confidence_score: number
  sample_count: number
  last_adjusted: string | null
  interpretation: string
}

interface AutoTuningResponse {
  insights: AutoTuningInsight[]
  total_patterns: number
  average_confidence: number
  most_adjusted_item: string | null
  improvement_suggestions: string[]
}

export default function AutoTuningPage() {
  const [insights, setInsights] = useState<AutoTuningResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auto-tuning/insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Kunde inte hämta auto-tuning insights')
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      setError('Ett fel uppstod vid hämtning av insights')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getAdjustmentColor = (factor: number) => {
    if (factor > 1.5) return 'text-red-600 bg-red-100'
    if (factor > 1.2) return 'text-orange-600 bg-orange-100'
    if (factor > 0.9) return 'text-green-600 bg-green-100'
    if (factor > 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Hämtar auto-tuning insights...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800">Fel vid hämtning</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <button
              onClick={fetchInsights}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Försök igen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Auto-Tuning Insights</h1>
          <p className="mt-2 text-gray-600">
            Lär dig hur systemet förbättras baserat på dina justeringar
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Totalt mönster</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{insights?.total_patterns || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Genomsnittlig konfidens</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {insights?.average_confidence ? (insights.average_confidence * 100).toFixed(1) + '%' : '0%'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Mest justerat</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {insights?.most_adjusted_item || 'Ingen'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {insights?.total_patterns && insights.total_patterns > 0 ? 'Aktiv' : 'Inaktiv'}
            </p>
          </div>
        </div>

        {/* Improvement Suggestions */}
        {insights?.improvement_suggestions && insights.improvement_suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-blue-800 mb-4">Förbättringsförslag</h3>
            <ul className="space-y-2">
              {insights.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">💡</span>
                  <span className="text-blue-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insights Table */}
        {insights?.insights && insights.insights.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Justeringsmönster</h3>
              <p className="text-sm text-gray-500">
                Systemet lär sig från dina justeringar för att förbättra framtida offerter
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mönster
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justeringsfaktor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konfidens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prover
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tolkning
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {insights.insights.map((insight, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {insight.room_type} | {insight.finish_level}
                          </div>
                          <div className="text-sm text-gray-500">{insight.item_ref}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAdjustmentColor(insight.adjustment_factor)}`}>
                          {insight.adjustment_factor.toFixed(2)}x
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(insight.confidence_score)}`}>
                          {(insight.confidence_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {insight.sample_count}
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {insight.interpretation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inga justeringsmönster ännu</h3>
            <p className="text-gray-500 mb-6">
              Systemet kommer att börja lära sig när du justerar auto-genererade offerter.
            </p>
            <button
              onClick={() => router.push('/quotes/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Skapa en offert
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 
