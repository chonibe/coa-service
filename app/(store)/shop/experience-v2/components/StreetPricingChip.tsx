'use client'

import { cn } from '@/lib/utils'

export type StreetPricingChipProps = {
  label: string
  priceUsd: number | null
  subcopy: string
  className?: string
  /**
   * When false, the chip shows only stage + scarcity subcopy (no `$` in the pill).
   * Use when list price is shown separately (e.g. picker card footer).
   */
  showPrice?: boolean
}

/**
 * Compact overlay chip for Street Collector ladder (Ground Floor / Rising / …).
 */
export function StreetPricingChip({
  label,
  priceUsd,
  subcopy,
  className,
  showPrice = true,
}: StreetPricingChipProps) {
  const titleParts = [label]
  if (priceUsd != null) titleParts.push(`$${priceUsd}`)
  titleParts.push(subcopy)
  const title = titleParts.join(' · ')
  return (
    <div className={cn('w-full flex justify-center', className)}>
      <span
        className={cn(
          'inline-flex max-w-full min-w-0 items-center justify-center gap-0.5 font-semibold uppercase',
          'rounded-lg px-2 py-0.5 text-[8px] sm:text-[9px] tracking-[0.05em] leading-tight',
          'text-white',
          'border border-white/25 dark:border-white/20',
          'bg-black/35 backdrop-blur-md backdrop-saturate-150',
          'dark:bg-black/45'
        )}
        title={title}
      >
        <span className="min-w-0 truncate">{label}</span>
        {showPrice && priceUsd != null && (
          <span className="shrink-0 whitespace-nowrap">{`· $${priceUsd}`}</span>
        )}
        <span className="min-w-0 truncate opacity-90 normal-case font-medium tracking-normal">{`· ${subcopy}`}</span>
      </span>
    </div>
  )
}
