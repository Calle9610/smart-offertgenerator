'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote } from '@/app/api'
import { CreateQuoteRequest, CreateQuoteRequestSchema } from '@/types/quote'
import { sanitizeFormInput } from '@/lib/sanitization'

interface QuoteFormProps {
  initialData?: CreateQuoteRequest
  mode?: 'create' | 'edit'
  onSave?: (data: CreateQuoteRequest) => void
  onCancel?: () => void
  saving?: boolean
}

export default function QuoteForm({ 
  initialData, 
  mode = 'create', 
  onSave, 
  onCancel, 
  saving = false 
}: QuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CreateQuoteRequest>(initialData || {
    customer_name: 'Testkund AB',
    project_name: 'Badrum 6 m²',
    profile_id: 'default-profile', // TODO: Get from context/API
    currency: 'SEK',
    vat_rate: 25.0,
    items: [
      {
        kind: 'labor' as const,
        ref: 'LAB001',
        description: 'Installation arbete',
        qty: 2.0,
        unit: 'hour',
        unit_price: 500.0,
        is_optional: false,
        option_group: null
      }
    ]
  })

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleInputChange = (field: string, value: any) => {
    // Sanitize text input to prevent XSS
    const sanitizedValue = typeof value === 'string' ? sanitizeFormInput(value) : value
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    // Sanitize text input to prevent XSS
    const sanitizedValue = typeof value === 'string' ? sanitizeFormInput(value) : value
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: sanitizedValue } : item
      )
    }))
  }

  const validateForm = (): boolean => {
    try {
      // Validate the entire form using Zod schema
      CreateQuoteRequestSchema.parse(formData)
      setValidationErrors({})
      return true
    } catch (error: any) {
      if (error.errors) {
        const errors: Record<string, string> = {}
        
        error.errors.forEach((err: any) => {
          if (err.path) {
            const fieldPath = err.path.join('.')
            errors[fieldPath] = err.message
          }
        })
        
        setValidationErrors(errors)
      }
      return false
    }
  }

  const getFieldError = (fieldPath: string): string | undefined => {
    return validationErrors[fieldPath]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.debug('🔍 QuoteForm: handleSubmit called')
    console.debug('🔍 QuoteForm: formData payload:', formData)
    
    // Validate form before submission
    if (!validateForm()) {
      console.error('❌ QuoteForm: Validation failed')
      return
    }
    
    if (mode === 'edit' && onSave) {
      // Edit mode - call parent onSave
      onSave(formData)
      return
    }
    
    // Create mode - original logic
    setLoading(true)
    
    try {
      // Call API to create quote
      console.debug('🔍 QuoteForm: Calling createQuote API...')
      const response = await createQuote(formData)
      
      console.debug('🔍 QuoteForm: API response status:', response)
      console.debug('🔍 QuoteForm: API response body:', response)
      
      // Extract quote ID from normalized response
      const quoteId = response.id
      console.debug('🔍 QuoteForm: Extracted quoteId:', quoteId)
      
      if (!quoteId) {
        console.error('❌ QuoteForm: No quote ID in response')
        throw new Error('Inget offert-ID mottaget från API')
      }
      
      // Build redirect path to edit page
      const path = `/quotes/${quoteId}/edit`
      console.debug('🔍 QuoteForm: Redirecting to edit path:', path)
      
      // Navigate to the edit page
      router.push(path)
      
    } catch (error) {
      console.error('❌ QuoteForm: Error creating quote:', error)
      // Show validation error instead of alert
      setValidationErrors({ submit: `Kunde inte skapa offert: ${error}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">
            {mode === 'edit' ? 'Redigera offert' : 'Skapa ny offert'}
          </h2>
          <p className="text-gray-600 mt-1">
            {mode === 'edit' ? 'Uppdatera information om kund och projekt' : 'Fyll i information om kund och projekt'}
          </p>
        </header>
        
        <div className="space-y-6">
          {/* Kund & Projekt sektion */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Kund & Projekt</h3>
            <p className="text-gray-600 mb-4">Grundinformation om kund och projekt</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
                    Kundnamn
                  </label>
                  <input
                    id="customer"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    placeholder="Ange kundnamn"
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError('customer_name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('customer_name') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('customer_name')}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
                    Projektnamn
                  </label>
                  <input
                    id="project"
                    value={formData.project_name}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    placeholder="Ange projektnamn"
                    className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError('project_name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('project_name') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('project_name')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Offertrader sektion */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Offertrader</h3>
            <p className="text-gray-600 mb-4">Arbetsmoment, material och övrigt</p>
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg">
                  <div className="col-span-1">
                    <select 
                      value={item.kind}
                      onChange={(e) => handleItemChange(index, 'kind', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="labor">Arbete</option>
                      <option value="material">Material</option>
                      <option value="custom">Övrigt</option>
                    </select>
                  </div>
                  
                  <div className="col-span-3">
                    <input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Beskrivning"
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError(`items.${index}.description`) ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError(`items.${index}.description`) && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError(`items.${index}.description`)}</p>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <input
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      placeholder="Enhet"
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError(`items.${index}.unit`) ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError(`items.${index}.unit`) && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError(`items.${index}.unit`)}</p>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError(`items.${index}.qty`) ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError(`items.${index}.qty`) && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError(`items.${index}.qty`)}</p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        getFieldError(`items.${index}.unit_price`) ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError(`items.${index}.unit_price`) && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError(`items.${index}.unit_price`)}</p>
                    )}
                  </div>
                  
                  <div className="col-span-1">
                    <div className="font-semibold text-gray-900">
                      {(item.qty * item.unit_price).toFixed(2)} SEK
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <button type="button" className="p-2 hover:bg-gray-100 rounded">
                        ✏️
                      </button>
                      <button type="button" className="p-2 hover:bg-gray-100 rounded">
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFieldError('items') && (
                <p className="text-sm text-red-600">{getFieldError('items')}</p>
              )}
              <button type="button" className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                ➕ Lägg till rad
              </button>
            </div>
          </div>

          {/* Sammanfattning */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Offertsammanfattning</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Delsumma:</span>
                <span className="font-semibold">
                  {formData.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0).toFixed(2)} SEK
                </span>
              </div>
              <div className="flex justify-between">
                <span>Moms (25%):</span>
                <span className="font-semibold">
                  {(formData.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0) * 0.25).toFixed(2)} SEK
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Totalt:</span>
                <span>
                  {(formData.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0) * 1.25).toFixed(2)} SEK
                </span>
              </div>
            </div>
          </div>

          {/* Submit Error Display */}
          {getFieldError('submit') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{getFieldError('submit')}</p>
            </div>
          )}

          {/* Åtgärdsknappar */}
          <div className="flex justify-end space-x-4">
            {mode === 'edit' && onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Avbryt
              </button>
            )}
            <button 
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Spara utkast
            </button>
            <button 
              type="submit"
              disabled={loading || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || saving 
                ? (mode === 'edit' ? 'Sparar...' : 'Skapar offert...') 
                : (mode === 'edit' ? 'Spara ändringar' : 'Skapa offert')
              }
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
