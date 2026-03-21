'use client'

import { cn } from '@/lib/utils'
import {
  getEditionCopyForStage,
  getEditionStageKey,
  type EditionStageKey,
} from '@/lib/shop/edition-stages'

export type EditionBadgeProps = {
  /** Units sold / no longer available (drives stage). */
  editionNumber: number
  totalEditions: number
  artistName: string
  className?: string
  /** Tighter type for mobile action bar. */
  compact?: boolean
}

export function EditionBadge({
  editionNumber,
  totalEditions,
  artistName,
  className,
  compact = false,
}: EditionBadgeProps) {
  const stage: EditionStageKey | null = getEditionStageKey(editionNumber, totalEditions)
  if (!stage) return null

  const remaining = totalEditions - editionNumber
  const n = Math.min(editionNumber + 1, totalEditions)
  const x = editionNumber
  const artist = artistName.trim() || 'this artist'

  const copy = getEditionCopyForStage(stage, {
    artist,
    x,
    n,
    total: totalEditions,
    remaining,
  })

  return (
    <div
      className={cn(
        'rounded-md border border-neutral-200/80 bg-neutral-50 px-3 py-2.5 dark:border-white/10 dark:bg-neutral-950/80',
        compact && 'px-2.5 py-2',
        className
      )}
      role="status"
    >
      <div
        className={cn(
          'inline-flex max-w-full items-center rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-100 dark:bg-black dark:text-neutral-200',
          compact && 'text-[9px]'
        )}
      >
        {copy.badge}
      </div>
      <p
        className={cn(
          'mt-2 text-xs leading-snug text-neutral-600 dark:text-[#b8a8a8]',
          compact && 'mt-1.5 text-[11px]'
        )}
      >
        {copy.subline}
      </p>
      <p
        className={cn(
          'mt-1.5 text-[11px] leading-snug text-neutral-500 dark:text-[#8a7a7a]',
          compact && 'mt-1 text-[10px]'
        )}
      >
        {copy.cta}
      </p>
    </div>
  )
}
