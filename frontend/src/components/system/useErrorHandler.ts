import { useCallback } from 'react'

export interface ErrorDetails {
  title: string
  message: string
  type?: 'error' | 'warning' | 'info'
  showRetry?: boolean
  duration?: number
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  fallbackMessage?: string
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    fallbackMessage = 'Ett oväntat fel uppstod'
  } = options

  const handleError = useCallback((
    error: unknown,
    context?: string,
    customMessage?: string
  ): ErrorDetails => {
    // Determine error type and message
    let title = 'Fel uppstod'
    let message = fallbackMessage
    let type: 'error' | 'warning' | 'info' = 'error'

    if (error instanceof Error) {
      message = customMessage || error.message
      
      // Handle specific error types
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        title = 'Nätverksfel'
        message = 'Kunde inte ansluta till servern. Kontrollera din internetanslutning.'
        type = 'warning'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        title = 'Åtkomst nekad'
        message = 'Du har inte behörighet att utföra denna åtgärd. Logga in igen.'
        type = 'warning'
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        title = 'Åtkomst nekad'
        message = 'Du har inte behörighet att utföra denna åtgärd.'
        type = 'warning'
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        title = 'Resurs hittades inte'
        message = 'Den begärda resursen kunde inte hittas.'
        type = 'info'
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        title = 'Serverfel'
        message = 'Ett fel uppstod på servern. Försök igen senare.'
        type = 'error'
      } else if (error.message.includes('timeout')) {
        title = 'Tidsgräns överskriden'
        message = 'Förfrågan tog för lång tid. Kontrollera din internetanslutning.'
        type = 'warning'
      }
    } else if (typeof error === 'string') {
      message = customMessage || error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = customMessage || String((error as any).message)
    }

    // Add context if provided
    if (context) {
      title = `${title} - ${context}`
    }

    // Log to console if enabled
    if (logToConsole) {
      console.error(`[${context || 'App'}] Error:`, error)
    }

    // Show toast if enabled and available
    if (showToast && typeof window !== 'undefined' && (window as any).showErrorToast) {
      (window as any).showErrorToast({
        title,
        message,
        type,
        showRetry: type === 'warning' || type === 'error',
        duration: type === 'error' ? 10000 : 8000
      })
    }

    return {
      title,
      message,
      type,
      showRetry: type === 'warning' || type === 'error'
    }
  }, [showToast, logToConsole, fallbackMessage])

  const handleApiError = useCallback((
    error: unknown,
    operation: string,
    customMessage?: string
  ): ErrorDetails => {
    return handleError(error, operation, customMessage)
  }, [handleError])

  const handleNetworkError = useCallback((
    error: unknown,
    operation: string
  ): ErrorDetails => {
    return handleError(error, operation, 'Nätverksfel uppstod. Kontrollera din internetanslutning.')
  }, [handleError])

  const handleValidationError = useCallback((
    error: unknown,
    field?: string
  ): ErrorDetails => {
    const context = field ? `Validering av ${field}` : 'Validering'
    return handleError(error, context, 'Vänligen kontrollera att alla fält är korrekt ifyllda.')
  }, [handleError])

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError
  }
}

export default useErrorHandler
