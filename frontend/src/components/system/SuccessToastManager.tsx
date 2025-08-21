'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SuccessToast, { SuccessToastProps } from './SuccessToast'

export interface SuccessToastItem extends Omit<SuccessToastProps, 'id' | 'onDismiss'> {
  id: string
  timestamp: number
}

interface SuccessToastManagerProps {
  maxToasts?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const SuccessToastManager: React.FC<SuccessToastManagerProps> = ({
  maxToasts = 5,
  position = 'top-right'
}) => {
  const [toasts, setToasts] = useState<SuccessToastItem[]>([])

  const addToast = useCallback((toast: Omit<SuccessToastItem, 'id' | 'timestamp'>) => {
    const id = `success-toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: SuccessToastItem = {
      ...toast,
      id,
      timestamp: Date.now()
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      // Keep only the latest toasts
      return updated.slice(0, maxToasts)
    })
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'top-right':
      default:
        return 'top-4 right-4'
    }
  }

  // Expose addToast method globally for easy access
  if (typeof window !== 'undefined') {
    (window as any).showSuccessToast = addToast
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()} space-y-3 pointer-events-none`}>
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: position.includes('right') ? 100 : -100, scale: 0.8 }}
            transition={{ 
              duration: 0.3, 
              ease: 'easeOut',
              delay: index * 0.1 
            }}
            className="pointer-events-auto"
          >
            <SuccessToast
              {...toast}
              onDismiss={removeToast}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default SuccessToastManager
