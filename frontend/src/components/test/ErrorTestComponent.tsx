'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useErrorBoundary } from '@/components/system'

/**
 * Test component that can trigger errors to test ErrorBoundary
 */
export function ErrorTestComponent() {
  const [shouldThrow, setShouldThrow] = useState(false)
  const { throwError } = useErrorBoundary()

  if (shouldThrow) {
    throw new Error('Test error triggered by ErrorTestComponent')
  }

  const triggerError = () => {
    setShouldThrow(true)
  }

  const triggerAsyncError = () => {
    throwError(new Error('Async error triggered by ErrorTestComponent'))
  }

  const triggerRenderError = () => {
    // This will cause a render error
    const undefinedVariable: any = undefined
    return undefinedVariable.nonExistentMethod()
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">ErrorBoundary Test Component</h2>
      <p className="text-gray-600">
        Använd dessa knappar för att testa ErrorBoundary-funktionaliteten.
      </p>
      
      <div className="space-y-2">
        <Button 
          onClick={triggerError}
          variant="destructive"
          className="w-full"
        >
          Kasta Render Error
        </Button>
        
        <Button 
          onClick={triggerAsyncError}
          variant="destructive"
          className="w-full"
        >
          Kasta Async Error
        </Button>
        
        <Button 
          onClick={triggerRenderError}
          variant="destructive"
          className="w-full"
        >
          Kasta Undefined Error
        </Button>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800">Vad händer?</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• <strong>Render Error:</strong> Kastar fel under rendering</li>
          <li>• <strong>Async Error:</strong> Kastar fel via useErrorBoundary hook</li>
          <li>• <strong>Undefined Error:</strong> Kastar fel genom att anropa undefined metod</li>
        </ul>
        <p className="mt-2 text-xs text-blue-600">
          Alla fel ska fångas av ErrorBoundary och visa fallback UI.
        </p>
      </div>
    </div>
  )
}

/**
 * Component that always throws an error
 */
export function AlwaysErrorComponent(): never {
  throw new Error('This component always throws an error')
}

/**
 * Component that throws error after a delay
 */
export function DelayedErrorComponent() {
  const [hasError, setHasError] = useState(false)
  
  if (hasError) {
    throw new Error('Delayed error triggered')
  }

  return (
    <div className="p-4">
      <Button 
        onClick={() => setHasError(true)}
        variant="destructive"
      >
        Kasta Delayed Error
      </Button>
    </div>
  )
}
