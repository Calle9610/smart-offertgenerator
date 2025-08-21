/**
 * Admin Rules Page - Hantera generation rules
 * 
 * Denna sida hanterar generation rules för automatisk offertgenerering.
 * Skyddad med withAuth HOC och använder apiClient för säkra API-anrop.
 * 
 * How to run:
 * 1. Starta Docker: docker-compose up -d
 * 2. Gå till: http://localhost:3000/admin/rules
 * 3. Sidan skyddas automatiskt med withAuth
 */

'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { withAuth } from '@/lib/withAuth'
import { get, put, post } from '@/lib/apiClient'
import { LoadingSkeleton } from '@/components/system'

// Zod schema för rules JSON validering
const RulesSchema = z.object({
  labor: z.record(z.string(), z.string()),
  materials: z.record(z.string(), z.string())
})

interface GenerationRule {
  id: string
  key: string
  rules: any
  created_at: string
}

interface TestResponse {
  items: Array<{
    kind: string
    ref: string
    description: string
    qty: number
    unit: string
    unit_price: number
    line_total: number
  }>
  subtotal: number
  vat: number
  total: number
}

interface User {
  id?: string
  username: string
  email: string
  tenant_id: string
  is_superuser: boolean
  full_name?: string
  is_active?: boolean
  created_at?: string
}

function AdminRulesPage({ user }: { user: User }) {
  const [rules, setRules] = useState<GenerationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editingRules, setEditingRules] = useState<string>('')
  const [validationError, setValidationError] = useState<string>('')
  const [testingRule, setTestingRule] = useState<string | null>(null)
  const [testRequirements, setTestRequirements] = useState<string>('')
  const [testResult, setTestResult] = useState<TestResponse | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testError, setTestError] = useState<string>('')

  // Sample requirements data för testning
  const sampleRequirements = JSON.stringify({
    areaM2: 15.5,
    hasPlumbingWork: 1,
    hasElectricalWork: 0,
    roomType: "bathroom",
    finishLevel: "standard"
  }, null, 2)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const data = await get('/admin/rules')
      setRules(data)
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (rule: GenerationRule) => {
    setEditingRule(rule.id)
    setEditingRules(JSON.stringify(rule.rules, null, 2))
    setValidationError('')
  }

  const cancelEditing = () => {
    setEditingRule(null)
    setEditingRules('')
    setValidationError('')
  }

  const validateRules = (rulesText: string): boolean => {
    try {
      const parsed = JSON.parse(rulesText)
      RulesSchema.parse(parsed)
      setValidationError('')
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(`Valideringsfel: ${error.issues.map(e => e.message).join(', ')}`)
      } else {
        setValidationError('Ogiltig JSON-format')
      }
      return false
    }
  }

  const saveRule = async (ruleId: string) => {
    if (!validateRules(editingRules)) {
      return
    }

    try {
      await put(`/admin/rules/${ruleId}`, {
        rules: JSON.parse(editingRules)
      })
      
      setEditingRule(null)
      setEditingRules('')
      fetchRules() // Refresh list
    } catch (error: any) {
      setValidationError(`Sparfel: ${error.message || 'Ett fel uppstod vid sparande'}`)
    }
  }

  const startTesting = (rule: GenerationRule) => {
    setTestingRule(rule.id)
    setTestRequirements(sampleRequirements)
    setTestResult(null)
    setTestError('')
  }

  const cancelTesting = () => {
    setTestingRule(null)
    setTestRequirements('')
    setTestResult(null)
    setTestError('')
  }

  const testRule = async (rule: GenerationRule) => {
    if (!validateRules(editingRules)) {
      return
    }

    try {
      setTestLoading(true)
      setTestError('')

      const data = await post('/admin/rules/test', {
        key: rule.key,
        requirementsData: JSON.parse(testRequirements)
      })
      
      setTestResult(data)
    } catch (error: any) {
      setTestError(`Testfel: ${error.message || 'Ett fel uppstod vid testning'}`)
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin - Generation Rules</h1>
          <p className="text-gray-600">Hantera och testa regler för automatisk generering av offertrader</p>
          <div className="mt-2 text-sm text-gray-500">
            Inloggad som: {user.username} ({user.email})
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Inga regler hittades för detta företag</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{rule.key}</h3>
                    <p className="text-sm text-gray-500">Skapad: {new Date(rule.created_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <div className="flex space-x-2">
                    {editingRule === rule.id ? (
                      <>
                        <button
                          onClick={() => saveRule(rule.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Spara
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Avbryt
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(rule)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => startTesting(rule)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Testa
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingRule === rule.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rules (JSON)
                      </label>
                      <textarea
                        value={editingRules}
                        onChange={(e) => setEditingRules(e.target.value)}
                        className="w-full h-48 p-3 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder='{"labor": {"SNICK": "8+2*areaM2"}, "materials": {"KAKEL20": "areaM2*1.2"}}'
                      />
                    </div>
                    {validationError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 text-sm">{validationError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(rule.rules, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Test Section */}
                {testingRule === rule.id && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
                    <h4 className="font-medium text-purple-900 mb-3">Testa regel</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-700 mb-2">
                          Test Requirements Data
                        </label>
                        <textarea
                          value={testRequirements}
                          onChange={(e) => setTestRequirements(e.target.value)}
                          className="w-full h-32 p-3 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="JSON med testdata..."
                        />
                      </div>
                      
                      <div>
                        <button
                          onClick={() => testRule(rule)}
                          disabled={testLoading}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {testLoading ? 'Testar...' : 'Kör test'}
                        </button>
                        
                        {testError && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800 text-sm">{testError}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {testResult && (
                      <div className="mt-4">
                        <h5 className="font-medium text-purple-900 mb-2">Test Resultat:</h5>
                        <div className="bg-white p-4 rounded-md border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                              <p className="text-lg font-semibold">{testResult.subtotal.toFixed(2)} SEK</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-600">Moms:</span>
                              <p className="text-lg font-semibold">{testResult.vat.toFixed(2)} SEK</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-600">Total:</span>
                              <p className="text-lg font-semibold text-green-600">{testResult.total.toFixed(2)} SEK</p>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-600">Genererade rader:</span>
                            <div className="mt-2 space-y-2">
                              {testResult.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="font-medium">{item.description}</span>
                                  <span className="text-gray-600">
                                    {item.qty} {item.unit} × {item.unit_price} SEK = {item.line_total} SEK
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={cancelTesting}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Stäng test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Skydda sidan med withAuth HOC
export default withAuth(AdminRulesPage)
