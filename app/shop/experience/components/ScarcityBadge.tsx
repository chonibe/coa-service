'use client'

import { cn } from '@/lib/utils'

interface ScarcityBadgeProps {
  quantityAvailable?: number
  editionSize?: number | null
  availableForSale: boolean
  variant?: 'compact' | 'full'
  className?: string
}

export function ScarcityBadge({
  quantityAvailable,
  editionSize,
  availableForSale,
  variant = 'compact',
  className,
}: ScarcityBadgeProps) {
  if (!availableForSale) {
    if (variant === 'compact') return null
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100', className)}>
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm font-medium text-red-600">Sold out</span>
      </div>
    )
  }

  if (quantityAvailable === undefined) {
    if (variant === 'full' && editionSize) {
      return (
        <div className={cn('space-y-2', className)}>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-100">
            <span className="text-xs font-medium text-neutral-500">Limited Edition of {editionSize}</span>
          </div>
        </div>
      )
    }
    return null
  }

  const remaining = quantityAvailable
  const isVeryScarce = remaining > 0 && remaining <= 2
  const isLowStock = remaining > 0 && remaining <= 5
  const total = editionSize || 0
  const percentRemaining = total > 0 ? (remaining / total) * 100 : 50

  if (variant === 'compact') {
    if (!isLowStock) return null
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className={cn(
          'w-1.5 h-1.5 rounded-full',
          isVeryScarce ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
        )} />
        <span className={cn(
          'text-[10px] font-semibold',
          isVeryScarce ? 'text-red-600' : 'text-amber-600'
        )}>
          {remaining} left
        </span>
      </div>
    )
  }

  const message = isVeryScarce
    ? `Only ${remaining} left — almost gone`
    : isLowStock
      ? `Low stock — ${remaining} remaining`
      : total > 0
        ? `${remaining} of ${total} available`
        : 'In stock — ready to ship'

  const barColor = isVeryScarce
    ? 'bg-gradient-to-r from-red-500 to-red-400'
    : isLowStock
      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
      : 'bg-gradient-to-r from-blue-600 to-blue-500'

  const textColor = isVeryScarce
    ? 'text-red-600'
    : isLowStock
      ? 'text-amber-600'
      : 'text-green-700'

  return (
    <div className={cn('space-y-2', className)}>
      {total > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-md border border-neutral-100">
          <span className="text-xs font-medium text-neutral-500">Limited Edition of {total}</span>
        </div>
      )}

      <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-700', barColor)}
          style={{ width: `${Math.max(2, 100 - percentRemaining)}%` }}
        />
      </div>

      <div className={cn('flex items-center gap-1.5 text-xs font-medium', textColor)}>
        <div className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          isVeryScarce ? 'bg-red-500 animate-pulse' : isLowStock ? 'bg-amber-500' : 'bg-green-600'
        )} />
        <span>{message}</span>
      </div>
    </div>
  )
}
