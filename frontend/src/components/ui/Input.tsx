import * as React from 'react'
import { cn } from '@/lib/utils'

/*
 * A11Y CHECKLIST - Input Component
 * ✅ htmlFor på label - Kopplar label till input
 * ✅ aria-invalid - Indikerar felstatus
 * ✅ aria-describedby - Kopplar till hjälptext/feltext
 * ✅ role="alert" på feltext - Screen reader meddelar fel
 * ✅ Unikt ID - Genererar automatiskt om inte angivet
 * ✅ Focus states - focus-visible:ring-* för alla states
 * ✅ Error states - border-error + focus:ring-error
 * 
 * MANUELL TESTNING:
 * 1. TAB till input - ska ha synlig fokusring
 * 2. Label koppling - klick på label ska fokusera input
 * 3. Felmeddelanden - ska läsas av screen reader
 * 4. Hjälptext - ska vara kopplad till input
 * 5. Error state - ska ha röd fokusring
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  label?: string
  helperText?: string
  errorText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    error = false,
    leftIcon,
    rightIcon,
    label,
    helperText,
    errorText,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              'input-base transition-all duration-150 ease-out',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-error focus-visible:ring-error',
              className
            )}
            ref={ref}
            id={inputId}
            aria-invalid={error}
            aria-describedby={
              error && errorText ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : 
              undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
        
        {error && errorText && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-error"
            role="alert"
          >
            {errorText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
