'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, RefreshCw, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ErrorToastProps {
  id: string
  title: string
  message: string
  type?: 'error' | 'warning' | 'info'
  duration?: number
  onDismiss?: (id: string) => void
  onRetry?: () => void
  showRetry?: boolean
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  id,
  title,
  message,
  type = 'error',
  duration = 8000,
  onDismiss,
  onRetry,
  showRetry = false
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(id), 300) // Wait for animation
      }, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, id, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(id), 300)
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
      handleDismiss()
    }
  }

  const getToastStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'error':
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'error':
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative p-4 rounded-lg border ${getToastStyles()} shadow-lg max-w-md`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1">
                {title}
              </h4>
              <p className="text-sm opacity-90">
                {message}
              </p>
              
              {showRetry && onRetry && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium mt-2 hover:opacity-80 transition-opacity"
                >
                  <RefreshCw className="h-3 w-3" />
                  Försök igen
                </button>
              )}
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
              aria-label="Stäng felmeddelande"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Progress bar */}
          {duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
              <motion.div
                className={`h-full ${
                  type === 'error' ? 'bg-red-500' :
                  type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ErrorToast
