'use client'

import { Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ExperienceV3StickyBarProductMetaProps = {
  artistName?: string | null
  reserveEditionLabel?: string | null
  title?: string | null
  /** e.g. "Lamp + artwork" when the sticky bar reflects a bundle selection. */
  bundleLabel?: string | null
  align?: 'left' | 'center'
  className?: string
}

/** Artist, edition reservation, and title shown in experience sticky bottom bars. */
export function ExperienceV3StickyBarProductMeta({
  artistName,
  reserveEditionLabel,
  title,
  bundleLabel,
  align = 'center',
  className,
}: ExperienceV3StickyBarProductMetaProps) {
  if (!reserveEditionLabel && !artistName && !title && !bundleLabel) return null

  return (
    <div
      className={cn(
        'min-w-0 space-y-1',
        align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {reserveEditionLabel ? (
        <div
          className={cn(
            'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-experience-surface/80 px-2.5 py-1 text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground',
            align === 'center' && 'mx-auto'
          )}
        >
          <Gem className="h-3 w-3 shrink-0 text-experience-highlight" aria-hidden />
          <span className="truncate">{reserveEditionLabel}</span>
        </div>
      ) : null}
      {artistName ? (
        <p className="truncate text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {artistName}
        </p>
      ) : null}
      {title ? (
        <p className="truncate text-sm font-semibold leading-snug text-foreground">{title}</p>
      ) : null}
      {bundleLabel ? (
        <p className="truncate text-[10px] font-medium text-experience-highlight">{bundleLabel}</p>
      ) : null}
    </div>
  )
}
