import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'badge-base',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        brand: 'border-transparent bg-brand-100 text-brand-800 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-100 dark:hover:bg-brand-800',
        success: 'border-transparent bg-success-100 text-success-800 hover:bg-success-200 dark:bg-success-900 dark:text-success-100 dark:hover:bg-success-800',
        warn: 'border-transparent bg-warn-100 text-warn-800 hover:bg-warn-200 dark:bg-warn-900 dark:text-warn-100 dark:hover:bg-warn-800',
        error: 'border-transparent bg-error-100 text-error-800 hover:bg-error-200 dark:bg-error-900 dark:text-error-100 dark:hover:bg-error-800',
        neutral: 'border-transparent bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
        xl: 'px-4 py-1.5 text-base',
      },
      rounded: {
        default: 'rounded-full',
        sm: 'rounded-md',
        lg: 'rounded-lg',
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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Badge({ 
  className, 
  variant, 
  size, 
  rounded,
  leftIcon,
  rightIcon,
  children,
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size, rounded, className }))}
      {...props}
    >
      {leftIcon && (
        <span className="mr-1 flex items-center" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      {children}
      
      {rightIcon && (
        <span className="ml-1 flex items-center" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
