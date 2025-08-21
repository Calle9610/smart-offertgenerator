'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'success' | 'error'
  description?: string
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentStep?: string
  onStepComplete?: (stepId: string) => void
  onComplete?: () => void
  showProgress?: boolean
  className?: string
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  onStepComplete,
  onComplete,
  showProgress = true,
  className = ''
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [failedSteps, setFailedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Update completed and failed steps based on status
    const newCompleted = new Set<string>()
    const newFailed = new Set<string>()
    
    steps.forEach(step => {
      if (step.status === 'success') {
        newCompleted.add(step.id)
      } else if (step.status === 'error') {
        newFailed.add(step.id)
      }
    })
    
    setCompletedSteps(newCompleted)
    setFailedSteps(newFailed)
    
    // Call onComplete if all steps are done
    if (newCompleted.size + newFailed.size === steps.length) {
      onComplete?.()
    }
  }, [steps, onComplete])

  const getStepIcon = (step: ProgressStep) => {
    if (step.status === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (step.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    } else if (step.status === 'loading') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepStatus = (step: ProgressStep) => {
    if (step.status === 'success') {
      return 'text-green-600 bg-green-50 border-green-200'
    } else if (step.status === 'error') {
      return 'text-red-600 bg-red-50 border-red-200'
    } else if (step.status === 'loading') {
      return 'text-blue-600 bg-blue-50 border-blue-200'
    } else {
      return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getProgressPercentage = () => {
    const completed = steps.filter(step => step.status === 'success').length
    return (completed / steps.length) * 100
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress bar */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
      
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getStepStatus(step)}`}
          >
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {step.label}
                </h4>
                {step.status === 'loading' && (
                  <span className="text-xs text-blue-600">Bearbetar...</span>
                )}
              </div>
              
              {step.description && (
                <p className="text-xs opacity-80 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Summary */}
      {showProgress && (
        <div className="text-center text-sm text-gray-600">
          {completedSteps.size} av {steps.length} steg slutförda
          {failedSteps.size > 0 && (
            <span className="text-red-600 ml-2">
              ({failedSteps.size} misslyckade)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default ProgressIndicator
