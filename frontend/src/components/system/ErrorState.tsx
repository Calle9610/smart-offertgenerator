'use client'

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useCopy } from '@/copy/useCopy'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ArrowLeft,
  Bug,
  Wifi,
  Server,
  User
} from 'lucide-react'

interface ErrorStateProps {
  variant?: 'default' | 'network' | 'server' | 'auth' | 'notFound' | 'permission'
  title?: string
  description?: string
  error?: Error | string | null
  icon?: ReactNode
  retry?: {
    label?: string
    onClick: () => void
    loading?: boolean
  }
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline'
    icon?: ReactNode | any
  }>
  className?: string
  showErrorDetails?: boolean
  logToSentry?: boolean
}

export function ErrorState({
  variant = 'default',
  title,
  description,
  error,
  icon,
  retry,
  actions,
  className,
  showErrorDetails = false,
  logToSentry: shouldLogToSentry = true
}: ErrorStateProps) {
  const copy = useCopy()
  
  const defaultConfigs = {
    network: {
      icon: Wifi,
      title: 'Nätverksfel',
      description: 'Kunde inte ansluta till servern. Kontrollera din internetanslutning.'
    },
    server: {
      icon: Server,
      title: 'Serverfel',
      description: 'Ett fel uppstod på servern. Försök igen senare.'
    },
    auth: {
      icon: User,
      title: 'Åtkomst nekad',
      description: 'Du har inte behörighet att utföra denna åtgärd. Logga in igen.'
    },
    notFound: {
      icon: AlertTriangle,
      title: 'Kunde inte hitta det du letade efter',
      description: 'Sidan eller resursen du försöker nå finns inte.'
    },
    permission: {
      icon: AlertTriangle,
      title: 'Behörighet saknas',
      description: 'Du har inte rätt behörighet för denna åtgärd. Kontakta din administratör för hjälp.'
    }
  }
  
  const config = variant !== 'default' ? defaultConfigs[variant] : null
  const IconComponent = icon || (config?.icon ? config.icon : AlertTriangle)
  
  const finalTitle = title || config?.title || copy.errors.unknown
  const finalDescription = description || config?.description || 'Något gick fel. Försök igen eller kontakta support om problemet kvarstår.'

  // Log error to Sentry if enabled and error exists
  useEffect(() => {
    if (shouldLogToSentry && error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      // TODO: Implement proper Sentry logging
      console.error('Error logged:', errorObj, {
        variant,
        title: finalTitle,
        description: finalDescription
      })
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Cleanup any pending operations if needed
      // Currently no async operations to clean up
    }
  }, [error, shouldLogToSentry, variant, finalTitle, finalDescription])

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="mb-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          {typeof IconComponent === 'function' ? (
            <IconComponent className="h-8 w-8 text-red-600" />
          ) : (
            IconComponent
          )}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {finalTitle}
      </h3>
      
      <p className="text-gray-600 max-w-md mb-6">
        {finalDescription}
      </p>

      {/* Error Details (for development/debugging) */}
      {showErrorDetails && error && (
        <details className="mb-6 text-left max-w-md">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
            {copy.errors.showErrorDetails}
          </summary>
          <div className="bg-gray-50 rounded-md p-3 text-xs font-mono text-gray-700 overflow-auto">
            {error instanceof Error ? (
              <div>
                <div className="font-semibold">{error.name}</div>
                <div className="text-red-600">{error.message}</div>
                {error.stack && (
                  <div className="mt-2 text-gray-600">
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </div>
                )}
              </div>
            ) : (
              <div>{String(error)}</div>
            )}
          </div>
        </details>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        {retry && (
          <Button
            onClick={retry.onClick}
            variant="default"
            leftIcon={retry.loading ? undefined : RefreshCw as any}
            disabled={retry.loading}
            className="min-w-[120px]"
          >
            {retry.loading ? (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                {copy.states.loading.title}
              </div>
            ) : (
              retry.label || copy.states.retry.title
            )}
          </Button>
        )}
        
        {actions?.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant || 'outline'}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Convenience components for common error states
export function NetworkErrorState({
  onRetry,
  onGoHome,
  ...props
}: {
  onRetry: () => void
  onGoHome?: () => void
} & Omit<ErrorStateProps, 'variant'>) {
  const copy = useCopy()
  
  return (
    <ErrorState
      variant="network"
      retry={{
        onClick: onRetry,
        label: copy.states.retry.title
      }}
      actions={onGoHome ? [{
        label: 'Gå till startsidan',
        onClick: onGoHome,
        variant: 'outline',
        icon: Home
      }] : []}
      {...props}
    />
  )
}

export function ServerErrorState({
  onRetry,
  onContactSupport,
  ...props
}: {
  onRetry: () => void
  onContactSupport?: () => void
} & Omit<ErrorStateProps, 'variant'>) {
  const copy = useCopy()
  
  return (
    <ErrorState
      variant="server"
      retry={{
        onClick: onRetry,
        label: copy.states.retry.title
      }}
      actions={onContactSupport ? [{
        label: 'Kontakta support',
        onClick: onContactSupport,
        variant: 'outline',
        icon: Bug
      }] : []}
      {...props}
    />
  )
}

export function AuthErrorState({
  onLogin,
  onGoBack,
  ...props
}: {
  onLogin: () => void
  onGoBack?: () => void
} & Omit<ErrorStateProps, 'variant'>) {
  return (
    <ErrorState
      variant="auth"
      actions={[
        {
          label: 'Logga in',
          onClick: onLogin,
          variant: 'default' as const,
          icon: User
        },
        ...(onGoBack ? [{
          label: 'Gå tillbaka',
          onClick: onGoBack,
          variant: 'outline' as const,
          icon: ArrowLeft
        }] : [])
      ]}
      {...props}
    />
  )
}

export function NotFoundErrorState({
  onGoHome,
  onGoBack,
  ...props
}: {
  onGoHome: () => void
  onGoBack?: () => void
} & Omit<ErrorStateProps, 'variant'>) {
  return (
    <ErrorState
      variant="notFound"
      actions={[
        {
          label: 'Gå till startsidan',
          onClick: onGoHome,
          variant: 'default' as const,
          icon: Home
        },
        ...(onGoBack ? [{
          label: 'Gå tillbaka',
          onClick: onGoBack,
          variant: 'outline' as const,
          icon: ArrowLeft
        }] : [])
      ]}
      {...props}
    />
  )
}

export function PermissionErrorState({
  onContactAdmin,
  onGoBack,
  ...props
}: {
  onContactAdmin: () => void
  onGoBack?: () => void
} & Omit<ErrorStateProps, 'variant'>) {
  return (
    <ErrorState
      variant="permission"
      actions={[
        {
          label: 'Kontakta administratör',
          onClick: onContactAdmin,
          variant: 'default' as const,
          icon: User
        },
        ...(onGoBack ? [{
          label: 'Gå tillbaka',
          onClick: onGoBack,
          variant: 'outline' as const,
          icon: ArrowLeft
        }] : [])
      ]}
      {...props}
    />
  )
}
