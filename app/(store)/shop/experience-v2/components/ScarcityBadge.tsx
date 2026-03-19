'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScarcityBadgeProps {
  quantityAvailable?: number
  editionSize?: number | null
  availableForSale: boolean
  variant?: 'compact' | 'full' | 'header' | 'bar'
  productId?: string
  productImage?: string | null
  productTitle?: string
  className?: string
}

export function ScarcityBadge({
  quantityAvailable: quantityProp,
  editionSize,
  availableForSale,
  variant = 'compact',
  productId,
  productImage,
  productTitle,
  className,
}: ScarcityBadgeProps) {
  const [fetchedQuantity, setFetchedQuantity] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const quantityAvailable = quantityProp ?? (fetchedQuantity != null ? fetchedQuantity : undefined)

  useEffect(() => {
    if (variant !== 'bar' || !productId || quantityProp != null || !availableForSale) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/shop/products/by-id/${encodeURIComponent(productId)}/quantity`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.quantityAvailable != null) setFetchedQuantity(data.quantityAvailable)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [variant, productId, quantityProp, availableForSale])

  if (!availableForSale) {
    if (variant === 'compact') return null
    if (variant === 'bar') {
      return (
        <div className={cn('relative h-1.5', className)}>
          <div className="h-full bg-neutral-200 rounded-full overflow-hidden" />
        </div>
      )
    }
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100', className)}>
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm font-medium text-red-600">Sold out</span>
      </div>
    )
  }

  if (variant === 'bar') {
    const total = editionSize && editionSize > 0 ? editionSize : 90
    const available = quantityAvailable ?? (loading ? null : total)
    // Cap at 100% when available exceeds edition size (data sync edge case)
    const percentRemaining = total > 0 && available != null
      ? Math.min(100, Math.round((available / total) * 100))
      : loading ? 100 : 100
    const barWidth = Math.min(100, Math.max(0, percentRemaining))

    if (loading && available == null) {
      return (
        <div className={cn('relative h-1.5', className)}>
          <div className="h-full bg-neutral-200 rounded-full overflow-hidden animate-pulse" />
        </div>
      )
    }

    return (
      <div className={cn('relative h-8 flex items-center justify-center', className)}>
        <div className="relative w-3/4 h-full">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-neutral-200 rounded-full overflow-visible">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
              initial={{ width: '100%' }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          </div>
          {productImage && barWidth > 3 && (
            <motion.div
              className="absolute top-1/2 w-10 h-8 overflow-hidden z-10 rounded-none"
              initial={{ left: '100%', x: '-50%', y: '-50%', opacity: 0.9 }}
              animate={{
                left: `${Math.max(4, barWidth)}%`,
                x: '-50%',
                y: '-50%',
                opacity: 1,
                rotate: [0, -12, 12, 0],
              }}
              transition={{
                left: { duration: 1, ease: 'easeInOut' },
                x: { duration: 0 },
                y: { duration: 0 },
                opacity: { duration: 0.3 },
                rotate: { repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1.2 },
              }}
            >
              <Image
                src={productImage}
                alt={productTitle || 'Artwork'}
                width={40}
                height={32}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </div>
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
    if (variant === 'header') {
      return (
        <div className={cn('flex items-center gap-1.5', className)}>
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-xs font-medium text-neutral-600">{editionSize ? `Ed. of ${editionSize}` : 'In stock'}</span>
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
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
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

  if (variant === 'header') {
    const total = editionSize || 0
    const displayText = total > 0 ? `${remaining} of ${total}` : `${remaining} left`
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          isVeryScarce ? 'bg-red-500 animate-pulse' : isLowStock ? 'bg-amber-500' : 'bg-green-500'
        )} />
        <span className={cn(
          'text-xs font-semibold',
          isVeryScarce ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-700'
        )}>
          {displayText}
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

      <div className="relative h-1.5 bg-neutral-200 rounded-full overflow-hidden">
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
