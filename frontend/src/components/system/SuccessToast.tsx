'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X, ExternalLink, Download, Mail, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SuccessToastProps {
  id: string
  title: string
  message: string
  type?: 'success' | 'info' | 'warning'
  duration?: number
  onDismiss?: (id: string) => void
  actions?: {
    label: string
    icon?: 'external' | 'download' | 'mail' | 'calendar'
    onClick: () => void
  }[]
  showActions?: boolean
}

const SuccessToast: React.FC<SuccessToastProps> = ({
  id,
  title,
  message,
  type = 'success',
  duration = 5000,
  onDismiss,
  actions = [],
  showActions = false
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

  const getToastStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
      default:
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <CheckCircle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'success':
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }

  const getActionIcon = (icon?: string) => {
    switch (icon) {
      case 'external':
        return <ExternalLink className="h-4 w-4" />
      case 'download':
        return <Download className="h-4 w-4" />
      case 'mail':
        return <Mail className="h-4 w-4" />
      case 'calendar':
        return <Calendar className="h-4 w-4" />
      default:
        return null
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
              
              {/* Actions */}
              {showActions && actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border border-current hover:bg-current hover:text-white transition-colors"
                    >
                      {getActionIcon(action.icon)}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
              aria-label="Stäng meddelande"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Progress bar */}
          {duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
              <motion.div
                className={`h-full ${
                  type === 'success' ? 'bg-green-500' :
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

export default SuccessToast
