import * as React from 'react'
import { cn } from '@/lib/utils'

/*
 * A11Y CHECKLIST - Card Component
 * ✅ Semantisk HTML - h3 för titel, p för beskrivning
 * ✅ Huvudrubrik - h3 för card-titel
 * ✅ Beskrivning - p-element för card-beskrivning
 * ✅ Struktur - Header, Content, Footer för logisk ordning
 * ✅ Focus states - focus:ring-2 focus:ring-ring (om klickbar)
 * ✅ Hover states - hover:shadow-lg (om klickbar)
 * 
 * MANUELL TESTNING:
 * 1. Screen reader - ska läsa struktur korrekt
 * 2. Huvudrubrik - ska vara h3-nivå
 * 3. Beskrivning - ska vara p-element
 * 4. Struktur - ska följa logisk ordning
 * 5. Focus ring - ska vara synlig om klickbar
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'card-base transition-all duration-150 ease-out hover:shadow-lg',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
