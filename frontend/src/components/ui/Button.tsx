import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * A11Y CHECKLIST - Button Component
 * ✅ Semantisk HTML - button-element eller Slot
 * ✅ aria-hidden="true" på ikoner - Döljer dekorativa element
 * ✅ Loading state - aria-hidden på spinner
 * ✅ Disabled state - disabled attribut
 * ✅ Focus states - focus-visible:ring-* för alla varianter
 * ✅ Hover states - hover:bg-* för alla varianter
 * ✅ Keyboard support - Enter/Space för aktivering
 * 
 * MANUELL TESTNING:
 * 1. TAB till knapp - ska ha synlig fokusring
 * 2. Enter/Space - ska aktivera knapp
 * 3. Loading state - ska visa spinner + disabled
 * 4. Hover states - ska vara synliga
 * 5. Focus ring - ska matcha knappens färgschema
 */

const buttonVariants = cva(
  'btn-base transition-all duration-150 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        link: 'text-primary underline-offset-4 hover:underline',
        brand: 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md focus-visible:ring-brand-500',
        success: 'bg-success-600 text-white hover:bg-success-700 hover:shadow-md focus-visible:ring-success-500',
        warn: 'bg-warn-600 text-white hover:bg-warn-700 hover:shadow-md focus-visible:ring-warn-500',
        error: 'bg-error-600 text-white hover:bg-error-700 hover:shadow-md focus-visible:ring-error-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      rounded: {
        default: 'rounded-md',
        full: 'rounded-full',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    rounded,
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children}
        
        {!loading && rightIcon && (
          <span className="ml-2 flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
