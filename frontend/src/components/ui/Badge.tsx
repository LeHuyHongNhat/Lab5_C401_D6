import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'ai' | 'warning' | 'danger' | 'success'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  ai: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-900',
  danger: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  )
}
