'use client'

import * as React from 'react'
import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKey?: string | number
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry or similar error reporting service
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleRetry = () => {
    // Force a re-render by updating the reset key
    if (this.props.resetKey !== undefined) {
      this.forceUpdate()
    } else {
      this.handleReset()
    }
  }

    render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI using ErrorState component
      return (
        <ErrorState
          title="Något gick fel"
          message="Ett oväntat fel uppstod. Prova att ladda om sidan eller kontakta support om problemet kvarstår."
          variant="error"
          actions={[
            {
              label: 'Försök igen',
              onClick: this.handleRetry,
              variant: 'primary'
            },
            {
              label: 'Ladda om sidan',
              onClick: () => window.location.reload(),
              variant: 'secondary'
            }
          ]}
          details={{
            error: this.state.error?.message || 'Okänt fel',
            componentStack: this.state.errorInfo?.componentStack || '',
            timestamp: new Date().toISOString()
          }}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Hook for functional components to trigger error boundary
 * Note: This doesn't actually catch errors, it just throws them to the nearest ErrorBoundary
 */
export function useErrorBoundary() {
  const throwError = (error: Error) => {
    throw error
  }

  return { throwError }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * ErrorBoundary specifically for async operations
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 AsyncErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorState
          title="Nätverksfel"
          message="Kunde inte hämta data. Kontrollera din internetanslutning och försök igen."
          variant="error"
          actions={[
            {
              label: 'Försök igen',
              onClick: this.handleRetry,
              variant: 'primary'
            }
          ]}
          details={{
            error: this.state.error?.message || 'Nätverksfel',
            timestamp: new Date().toISOString()
          }}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
