import { cn } from '@/lib/utils'


interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  )
}

interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'list' | 'form' | 'profile'
  rows?: number
  className?: string
}

export function LoadingSkeleton({ variant = 'card', rows = 3, className }: LoadingSkeletonProps) {
  switch (variant) {
    case 'table':
      return (
        <div className={cn("space-y-4", className)}>
          {/* Table Header */}
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex space-x-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )

    case 'card':
      return (
        <div className={cn("space-y-4", className)}>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      )

    case 'list':
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )

    case 'form':
      return (
        <div className={cn("space-y-6", className)}>
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      )

    case 'profile':
      return (
        <div className={cn("space-y-6", className)}>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      )

    default:
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      )
  }
}

// Specific skeleton components for common use cases
export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return <LoadingSkeleton variant="table" rows={rows} className={className || ''} />
}

export function CardSkeleton({ className }: { className?: string }) {
  return <LoadingSkeleton variant="card" className={className || ''} />
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return <LoadingSkeleton variant="list" rows={rows} className={className || ''} />
}

export function FormSkeleton({ className }: { className?: string }) {
  return <LoadingSkeleton variant="form" className={className || ''} />
}

export function ProfileSkeleton({ className }: { className?: string }) {
  return <LoadingSkeleton variant="profile" className={className || ''} />
}

export { Skeleton }
