'use client'

import { Gem } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import {
  formatCartEditionHoldEditionLabel,
  resolveCartEditionHoldDisplayNumber,
} from '@/lib/shop/compute-cart-edition-reserve'
import { formatCartEditionHoldRemaining } from '@/lib/shop/use-cart-edition-holds'

export type EditionHoldIndicatorProps = {
  hold: CartEditionHold
  /** When false, copy reflects a session reserve not currently in cart. */
  inCart?: boolean
  /** Projected next edition when hold.editionNumber is not yet assigned (e.g. storefront metrics). */
  fallbackEditionNumber?: number | null
  /** `banner` — full-width strip; `inline` — compact chip; `line` — cart line caption */
  variant?: 'banner' | 'inline' | 'line'
  className?: string
}

function formatEditionHoldCompactLine(
  displayNumber: number | null,
  remaining: string
): string {
  const editionLabel = formatCartEditionHoldEditionLabel(displayNumber)
  return `${editionLabel} · ${remaining} reserved`
}

export function EditionHoldIndicator({
  hold,
  fallbackEditionNumber,
  variant = 'inline',
  className,
}: EditionHoldIndicatorProps) {
  const remaining = formatCartEditionHoldRemaining(hold.expiresAt)
  const displayNumber = resolveCartEditionHoldDisplayNumber(hold, fallbackEditionNumber)
  const line = formatEditionHoldCompactLine(displayNumber, remaining)

  if (variant === 'line') {
    return (
      <p className={cn('text-[10px] font-medium text-muted-foreground', className)}>
        <Gem className="mr-1 inline h-3 w-3 -translate-y-px text-experience-highlight opacity-90" aria-hidden />
        <span className="tabular-nums text-foreground">{line}</span>
      </p>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-sm',
          className
        )}
        role="status"
      >
        <Gem className="h-4 w-4 shrink-0 text-experience-highlight" aria-hidden />
        <p className="min-w-0 text-[12px] font-semibold leading-snug text-foreground tabular-nums">
          {line}
        </p>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground ring-1 ring-border',
        className
      )}
      role="status"
    >
      <Gem className="h-3 w-3 shrink-0 text-experience-highlight opacity-90" aria-hidden />
      <span className="tabular-nums">{line}</span>
    </span>
  )
}

export type EditionHoldCartSummaryProps = {
  holdCount: number
  soonestExpiry: string | null
  /** Active cart holds — used to show edition numbers when a single edition is reserved. */
  holds?: CartEditionHold[]
  className?: string
}

/** Shown in OrderBar when multiple cart lines have active holds. */
export function EditionHoldCartSummary({
  holdCount,
  soonestExpiry,
  holds,
  className,
}: EditionHoldCartSummaryProps) {
  if (holdCount <= 1 || !soonestExpiry) return null
  const remaining = formatCartEditionHoldRemaining(soonestExpiry)

  const line = `${holdCount} editions · ${remaining} reserved`

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-2 text-[11px] leading-snug text-foreground',
        className
      )}
      role="status"
    >
      <Gem className="h-3.5 w-3.5 shrink-0 text-experience-highlight" aria-hidden />
      <span className="font-medium tabular-nums">{line}</span>
    </div>
  )
}
