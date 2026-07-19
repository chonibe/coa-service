'use client'

import { Gem } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import { resolveCartEditionHoldDisplayNumber } from '@/lib/shop/compute-cart-edition-reserve'
import {
  formatEditionHoldCompactLine,
  formatEditionHoldCompactLineParts,
  type EditionHoldCompactLineParts,
} from '@/lib/shop/format-edition-hold-display'
import { EXPERIENCE_PURCHASE_HINTS } from '@/lib/shop/experience-purchase-hints'
import {
  formatCartEditionHoldRemaining,
  useCartEditionHoldRemainingLive,
} from '@/lib/shop/use-cart-edition-holds'
import { ExperienceMeaningHint } from './ExperienceMeaningHint'

export { formatEditionHoldCompactLine } from '@/lib/shop/format-edition-hold-display'

export type EditionHoldCompactLineTextProps = {
  parts: EditionHoldCompactLineParts
  className?: string
  timerClassName?: string
}

/** Edition segment bold+accent; timer segment regular weight (optionally muted). */
export function EditionHoldCompactLineText({
  parts,
  className,
  timerClassName = 'font-normal text-muted-foreground',
}: EditionHoldCompactLineTextProps) {
  return (
    <span className={cn('tabular-nums', className)}>
      <span className="font-bold text-experience-highlight">{parts.editionLabel}</span>
      <span className={timerClassName}>{parts.timerSuffix}</span>
    </span>
  )
}

export type EditionHoldIndicatorProps = {
  hold: CartEditionHold
  /** When false, copy reflects a session reserve not currently in cart. */
  inCart?: boolean
  /** Projected next edition when hold.editionNumber is not yet assigned (e.g. storefront metrics). */
  fallbackEditionNumber?: number | null
  /** `banner` — hero chip (centered pill); `inline` — compact chip; `line` — cart line caption */
  variant?: 'banner' | 'inline' | 'line'
  className?: string
}

export function EditionHoldIndicator({
  hold,
  fallbackEditionNumber,
  variant = 'inline',
  className,
}: EditionHoldIndicatorProps) {
  const remaining = useCartEditionHoldRemainingLive(hold.expiresAt)
  const displayNumber = resolveCartEditionHoldDisplayNumber(hold, fallbackEditionNumber)
  const lineParts = formatEditionHoldCompactLineParts(displayNumber, remaining)
  const line = formatEditionHoldCompactLine(displayNumber, remaining)

  if (variant === 'line') {
    return (
      <p className={cn('text-[10px] font-normal text-muted-foreground', className)}>
        <Gem className="mr-1 inline h-3 w-3 -translate-y-px text-experience-highlight opacity-90" aria-hidden />
        <EditionHoldCompactLineText parts={lineParts} timerClassName="font-normal text-muted-foreground" />
      </p>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={cn('flex w-fit max-w-full flex-col items-center gap-1.5', className)}>
        <div
          className="flex w-fit max-w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-experience-surface/80 px-3.5 py-2 text-center shadow-sm"
          role="status"
          aria-label={line}
        >
          <Gem className="h-4 w-4 shrink-0 text-experience-highlight md:h-[18px] md:w-[18px]" aria-hidden />
          <EditionHoldCompactLineText
            parts={lineParts}
            className="min-w-0 text-center text-[12px] leading-snug md:text-[13px]"
            timerClassName="font-normal text-muted-foreground"
          />
        </div>
        <ExperienceMeaningHint
          explanation={EXPERIENCE_PURCHASE_HINTS.hold}
          alwaysVisible
          className="max-w-[16rem] text-center"
        />
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-foreground ring-1 ring-border',
        className
      )}
      role="status"
      aria-label={line}
    >
      <Gem className="h-3 w-3 shrink-0 text-experience-highlight opacity-90" aria-hidden />
      <EditionHoldCompactLineText
        parts={lineParts}
        className="text-[10px]"
        timerClassName="font-normal text-muted-foreground"
      />
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
