import type { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function Skeleton({ lines = 1, className = '', ...props }: SkeletonProps) {
  if (lines <= 1) {
    return <div className={`h-4 w-full animate-pulse rounded bg-gray-200 ${className}`.trim()} {...props} />
  }

  return (
    <div className={`space-y-2 ${className}`.trim()} {...props}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={`h-4 animate-pulse rounded bg-gray-200 ${idx === lines - 1 ? 'w-4/5' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
