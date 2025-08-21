'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { createProjectRequirements, getCurrentUser } from '@/app/api'
import LoginForm from './LoginForm'

// Zod schema for project requirements
const projectRequirementsSchema = z.object({
  // Step 1: Basic data
  roomType: z.enum(['bathroom', 'kitchen', 'flooring']),
  areaM2: z.number().min(0.1).max(10000),
  finishLevel: z.enum(['basic', 'standard', 'premium']),
  
  // Step 2: Installation
  hasPlumbingWork: z.boolean(),
  hasElectricalWork: z.boolean(),
  materialPrefs: z.array(z.string()).max(10),
  
  // Step 3: Site & notes
  siteConstraints: z.array(z.string()).max(10),
  notes: z.string().max(2000).optional(),
})

type ProjectRequirements = z.infer<typeof projectRequirementsSchema>

interface IntakeWizardProps {
  onComplete: (reqId: string) => void
}

export default function IntakeWizard({ onComplete }: IntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [requirementsId, setRequirementsId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    console.log('IntakeWizard mounted, checking authentication...')
    
    // Check authentication using cookies
    getCurrentUser()
      .then(() => {
        console.log('User is authenticated')
        setIsAuthenticated(true)
      })
      .catch(error => {
        console.log('User is not authenticated:', error)
        setIsAuthenticated(false)
      })
  }, [])

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectRequirements>({
    resolver: zodResolver(projectRequirementsSchema),
    defaultValues: {
      roomType: 'bathroom',
      areaM2: 10,
      finishLevel: 'standard',
      hasPlumbingWork: false,
      hasElectricalWork: false,
      materialPrefs: [],
      siteConstraints: [],
      notes: '',
    },
  })

  const watchedValues = watch()

  const handleLogin = () => {
    console.log('handleLogin called, checking authentication...')
    // Re-check authentication after login
    getCurrentUser()
      .then(() => {
        console.log('User is now authenticated')
        setIsAuthenticated(true)
      })
      .catch(error => {
        console.log('User is still not authenticated:', error)
        setIsAuthenticated(false)
      })
  }

  console.log('=== RENDER DEBUG ===')
      console.log('Current authentication state:', isAuthenticated)
    
    // If not authenticated, show login form
    if (!isAuthenticated) {
      console.log('User not authenticated, showing LoginForm')
      return <LoginForm onLogin={handleLogin} />
    }
    
    console.log('User is authenticated, showing form')

  // Auto-save after each step
  const handleStepComplete = async (step: number) => {
    if (step < 3) {
      await saveRequirements()
      setCurrentStep(step + 1)
    } else {
      await handleFinalSubmit()
    }
  }

  const saveRequirements = async () => {
    try {
      setIsSubmitting(true)
      
      if (!isAuthenticated) {
        throw new Error('User not authenticated')
      }

      const payload = {
        room_type: watchedValues.roomType,
        area_m2: watchedValues.areaM2,
        finish_level: watchedValues.finishLevel,
        has_plumbing_work: watchedValues.hasPlumbingWork,
        has_electrical_work: watchedValues.hasElectricalWork,
        material_prefs: watchedValues.materialPrefs,
        site_constraints: watchedValues.siteConstraints,
        notes: watchedValues.notes,
      }

      console.log('Sending payload:', payload)
      console.log('Using API function from:', typeof createProjectRequirements)

      const data = await createProjectRequirements(payload)
      console.log('API response:', data)
      
      setRequirementsId(data.id)
      
    } catch (error: any) {
      console.error('Error saving requirements:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`Kunde inte spara projektkrav: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    await saveRequirements()
    if (requirementsId) {
      onComplete(requirementsId)
    }
  }

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => goToStep(step)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </button>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Grunddata</span>
          <span>Installation</span>
          <span>Plats & anteckningar</span>
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1BasicData
            register={register}
            errors={errors}
            values={watchedValues}
            setValue={setValue}
          />
        )}
        
        {currentStep === 2 && (
          <Step2Installation
            register={register}
            errors={errors}
            values={watchedValues}
            setValue={setValue}
          />
        )}
        
        {currentStep === 3 && (
          <Step3SiteNotes
            register={register}
            errors={errors}
            values={watchedValues}
            setValue={setValue}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Föregående
        </button>
        
        <div className="flex items-center space-x-4">
          {requirementsId && (
            <span className="text-sm text-gray-600">
              Sparat ID: {requirementsId}
            </span>
          )}
          
          <button
            onClick={() => handleStepComplete(currentStep)}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sparar...' : currentStep === 3 ? 'Slutför' : 'Nästa & Spara'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Step 1: Basic data
function Step1BasicData({ register, errors }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Grunddata</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rumstyp
          </label>
          <select
            {...register('roomType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bathroom">Badrum</option>
            <option value="kitchen">Kök</option>
            <option value="flooring">Golv</option>
          </select>
          {errors.roomType && (
            <p className="mt-1 text-sm text-red-600">{errors.roomType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yta (m²)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('areaM2', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="10.0"
          />
          {errors.areaM2 && (
            <p className="mt-1 text-sm text-red-600">{errors.areaM2.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Utförandenivå
        </label>
        <div className="space-y-2">
          {['basic', 'standard', 'premium'].map((level) => (
            <label key={level} className="flex items-center">
              <input
                type="radio"
                value={level}
                {...register('finishLevel')}
                className="mr-2"
              />
              <span className="capitalize">
                {level === 'basic' && 'Grundläggande'}
                {level === 'standard' && 'Standard'}
                {level === 'premium' && 'Premium'}
              </span>
            </label>
          ))}
        </div>
        {errors.finishLevel && (
          <p className="mt-1 text-sm text-red-600">{errors.finishLevel.message}</p>
        )}
      </div>
    </div>
  )
}

// Step 2: Installation
function Step2Installation({ register, values, setValue }: any) {
  const addTag = (field: 'materialPrefs' | 'siteConstraints', tag: string) => {
    if (tag.trim() && !values[field].includes(tag.trim())) {
      setValue(field, [...values[field], tag.trim()])
    }
  }

  const removeTag = (field: 'materialPrefs' | 'siteConstraints', tag: string) => {
    setValue(field, values[field].filter((t: string) => t !== tag))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Installation</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('hasPlumbingWork')}
              className="mr-2"
            />
            <span>VVS-arbete krävs</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('hasElectricalWork')}
              className="mr-2"
            />
            <span>El-arbete krävs</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Materialpreferenser
        </label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Lägg till material..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag('materialPrefs', e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {values.materialPrefs.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag('materialPrefs', tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 3: Site & notes
function Step3SiteNotes({ register, errors, values, setValue }: any) {
  const addTag = (field: 'materialPrefs' | 'siteConstraints', tag: string) => {
    if (tag.trim() && !values[field].includes(tag.trim())) {
      setValue(field, [...values[field], tag.trim()])
    }
  }

  const removeTag = (field: 'materialPrefs' | 'siteConstraints', tag: string) => {
    setValue(field, values[field].filter((t: string) => t !== tag))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Plats & anteckningar</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Platsbegränsningar
        </label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Lägg till begränsning..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag('siteConstraints', e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {values.siteConstraints.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag('siteConstraints', tag)}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anteckningar
        </label>
        <textarea
          {...register('notes')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lägg till extra information eller krav..."
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>
    </div>
  )
} 
