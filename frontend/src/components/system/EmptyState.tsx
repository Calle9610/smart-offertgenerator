'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useCopy } from '@/copy/useCopy'
import { 
  FileText, 
  Search, 
  Users, 
  Package, 
  Settings, 
  BarChart3,
  Plus,
  RefreshCw
} from 'lucide-react'

interface EmptyStateProps {
  variant?: 'default' | 'search' | 'quotes' | 'customers' | 'packages' | 'settings' | 'analytics'
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline'
    icon?: ReactNode | any
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'secondary' | 'outline'
    icon?: ReactNode | any
  }
  className?: string
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  const copy = useCopy()
  
  const defaultConfigs = {
    search: {
      icon: Search,
      title: copy.states.empty,
      description: 'Prova att ändra dina söktermer eller filter för att hitta det du letar efter.'
    },
    quotes: {
      icon: FileText,
      title: 'Inga offerter än',
      description: 'Skapa din första offert för att komma igång med att hantera kundprojekt.'
    },
    customers: {
      icon: Users,
      title: 'Inga kunder än',
      description: 'Lägg till din första kund för att börja skapa offerter och hantera projekt.'
    },
    packages: {
      icon: Package,
      title: 'Inga paket konfigurerade',
      description: 'Skapa paket för att erbjuda olika alternativ till dina kunder.'
    },
    settings: {
      icon: Settings,
      title: 'Inga inställningar',
      description: 'Konfigurera dina företagsinställningar och standarder.'
    },
    analytics: {
      icon: BarChart3,
      title: 'Ingen data än',
      description: 'När du börjar använda systemet kommer du att se statistik och insikter här.'
    }
  }
  const config = variant !== 'default' ? defaultConfigs[variant] : null
  const IconComponent = icon || (config?.icon ? config.icon : FileText)
  
  const finalTitle = title || config?.title || copy.states.empty.title
  const finalDescription = description || config?.description || copy.states.empty.desc

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="mb-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          {typeof IconComponent === 'function' ? (
            <IconComponent className="h-8 w-8 text-gray-400" />
          ) : (
            IconComponent
          )}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {typeof finalTitle === 'string' ? finalTitle : (finalTitle as any).title}
      </h3>
      
      <p className="text-gray-600 max-w-md mb-8">
        {typeof finalDescription === 'string' ? finalDescription : (finalDescription as any).desc}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            leftIcon={action.icon || Plus}
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant={secondaryAction.variant || 'outline'}
            leftIcon={secondaryAction.icon || RefreshCw}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// Convenience components for common empty states
export function SearchEmptyState({
  searchTerm,
  onClearSearch,
  onNewSearch,
  ...props
}: {
  searchTerm?: string
  onClearSearch?: () => void
  onNewSearch?: () => void
} & Omit<EmptyStateProps, 'variant'>) {
  const actionProps = onClearSearch ? {
    action: {
      label: 'Rensa sökning',
      onClick: onClearSearch,
      variant: 'outline' as const,
      icon: RefreshCw
    }
  } : {}
  
  const secondaryActionProps = onNewSearch ? {
    secondaryAction: {
      label: 'Ny sökning',
      onClick: onNewSearch,
      variant: 'secondary' as const
    }
  } : {}
  
  return (
    <EmptyState
      variant="search"
      title={searchTerm ? `Inga resultat för "${searchTerm}"` : 'Inga resultat hittades'}
      description={searchTerm 
        ? 'Prova att ändra dina söktermer eller använd bredare filter.'
        : 'Prova att ändra dina söktermer eller filter för att hitta det du letar efter.'
      }
      {...actionProps}
      {...secondaryActionProps}
      {...props}
    />
  )
}

export function QuotesEmptyState({
  onCreateQuote,
  onImportQuotes,
  ...props
}: {
  onCreateQuote?: () => void
  onImportQuotes?: () => void
} & Omit<EmptyStateProps, 'variant'>) {
  const actionProps = onCreateQuote ? {
    action: {
      label: 'Skapa första offerten',
      onClick: onCreateQuote,
      variant: 'default' as const
    }
  } : {}
  
  const secondaryActionProps = onImportQuotes ? {
    secondaryAction: {
      label: 'Importera offerter',
      onClick: onImportQuotes,
      variant: 'outline' as const
    }
  } : {}
  
  return (
    <EmptyState
      variant="quotes"
      {...actionProps}
      {...secondaryActionProps}
      {...props}
    />
  )
}

export function CustomersEmptyState({
  onAddCustomer,
  onImportCustomers,
  ...props
}: {
  onAddCustomer?: () => void
  onImportCustomers?: () => void
} & Omit<EmptyStateProps, 'variant'>) {
  const actionProps = onAddCustomer ? {
    action: {
      label: 'Lägg till kund',
      onClick: onAddCustomer,
      variant: 'default' as const
    }
  } : {}
  
  const secondaryActionProps = onImportCustomers ? {
    secondaryAction: {
      label: 'Importera kunder',
      onClick: onImportCustomers,
      variant: 'outline' as const
    }
  } : {}
  
  return (
    <EmptyState
      variant="customers"
      {...actionProps}
      {...secondaryActionProps}
      {...props}
    />
  )
}
