import { useCallback } from 'react'

export interface SuccessDetails {
  title: string
  message: string
  type?: 'success' | 'info' | 'warning'
  duration?: number
  actions?: {
    label: string
    icon?: 'external' | 'download' | 'mail' | 'calendar'
    onClick: () => void
  }[]
  showActions?: boolean
}

export interface SuccessHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  defaultDuration?: number
}

export const useSuccessHandler = (options: SuccessHandlerOptions = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    defaultDuration = 5000
  } = options

  const handleSuccess = useCallback((
    message: string,
    context?: string,
    customOptions?: Partial<SuccessDetails>
  ): SuccessDetails => {
    const title = context ? `${context} lyckades` : 'Åtgärd slutförd'
    
    const successDetails: SuccessDetails = {
      title,
      message,
      type: 'success',
      duration: defaultDuration,
      showActions: false,
      ...customOptions
    }

    // Log to console if enabled
    if (logToConsole) {
      console.log(`[${context || 'App'}] Success:`, message)
    }

    // Show toast if enabled and available
    if (showToast && typeof window !== 'undefined' && (window as any).showSuccessToast) {
      (window as any).showSuccessToast(successDetails)
    }

    return successDetails
  }, [showToast, logToConsole, defaultDuration])

  const handleCreateSuccess = useCallback((
    itemType: string,
    itemName?: string,
    actions?: SuccessDetails['actions']
  ): SuccessDetails => {
    const message = itemName 
      ? `${itemType} "${itemName}" skapades framgångsrikt!`
      : `${itemType} skapades framgångsrikt!`
    
    return handleSuccess(message, 'Skapande', {
      actions: actions || [],
      showActions: !!(actions && actions.length > 0)
    })
  }, [handleSuccess])

  const handleUpdateSuccess = useCallback((
    itemType: string,
    itemName?: string,
    actions?: SuccessDetails['actions']
  ): SuccessDetails => {
    const message = itemName 
      ? `${itemType} "${itemName}" uppdaterades framgångsrikt!`
      : `${itemType} uppdaterades framgångsrikt!`
    
    return handleSuccess(message, 'Uppdatering', {
      actions: actions || [],
      showActions: !!(actions && actions.length > 0)
    })
  }, [handleSuccess])

  const handleDeleteSuccess = useCallback((
    itemType: string,
    itemName?: string
  ): SuccessDetails => {
    const message = itemName 
      ? `${itemType} "${itemName}" togs bort framgångsrikt!`
      : `${itemType} togs bort framgångsrikt!`
    
    return handleSuccess(message, 'Borttagning')
  }, [handleSuccess])

  const handleSendSuccess = useCallback((
    itemType: string,
    recipient?: string,
    actions?: SuccessDetails['actions']
  ): SuccessDetails => {
    const message = recipient 
      ? `${itemType} skickades framgångsrikt till ${recipient}!`
      : `${itemType} skickades framgångsrikt!`
    
    return handleSuccess(message, 'Sändning', {
      actions: actions || [],
      showActions: !!(actions && actions.length > 0)
    })
  }, [handleSuccess])

  const handleSaveSuccess = useCallback((
    itemType: string,
    actions?: SuccessDetails['actions']
  ): SuccessDetails => {
    const message = `${itemType} sparades framgångsrikt!`
    
    return handleSuccess(message, 'Sparande', {
      actions: actions || [],
      showActions: !!(actions && actions.length > 0)
    })
  }, [handleSuccess])

  const handleImportSuccess = useCallback((
    itemType: string,
    count: number,
    actions?: SuccessDetails['actions']
  ): SuccessDetails => {
    const message = `${count} ${itemType} importerades framgångsrikt!`
    
    return handleSuccess(message, 'Import', {
      actions: actions || [],
      showActions: !!(actions && actions.length > 0)
    })
  }, [handleSuccess])

  const handleExportSuccess = useCallback((
    itemType: string,
    filename?: string,
    actions?: SuccessDetails['actions']
  ): SuccessDetails => {
    const message = filename 
      ? `${itemType} exporterades framgångsrikt som "${filename}"!`
      : `${itemType} exporterades framgångsrikt!`
    
    return handleSuccess(message, 'Export', {
      actions: actions || [],
      showActions: !!(actions && actions.length > 0)
    })
  }, [handleSuccess])

  return {
    handleSuccess,
    handleCreateSuccess,
    handleUpdateSuccess,
    handleDeleteSuccess,
    handleSendSuccess,
    handleSaveSuccess,
    handleImportSuccess,
    handleExportSuccess
  }
}

export default useSuccessHandler
