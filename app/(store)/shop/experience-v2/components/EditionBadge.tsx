'use client'

import type { ReactNode } from 'react'
import { ArrowUp, Eye, Lock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import type { EditionStageVisualKind } from '@/lib/shop/edition-stages'
import {
  buildEditionMetrics,
  getEditionStageCopy,
  getEditionStageKey,
  getEditionStageVisualKind,
  getProductEditionMetrics,
  getProductEditionSize,
} from '@/lib/shop/edition-stages'
import { EditionWatchControl } from './EditionWatchControl'

function EditionStageLeadIcon({
  kind,
  compact = false,
  flat = false,
}: {
  kind: EditionStageVisualKind
  compact?: boolean
  /** Strip/picker chips: no drop-shadow on glyph */
  flat?: boolean
}) {
  const lucideClass = cn(
    'shrink-0 text-current opacity-90',
    !flat &&
      'drop-shadow-[0_0_1px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.25)]',
    compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
  )
  switch (kind) {
    case 'spark':
      return (
        <span
          className={cn(
            'shrink-0 select-none text-[0.92em] leading-none',
            compact
              ? cn('text-current opacity-95', !flat && 'drop-shadow-[0_0_2px_rgba(0,0,0,0.35)]')
              : cn('text-current opacity-95', !flat && 'dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]')
          )}
          aria-hidden
        >
          ✦
        </span>
      )
    case 'arrowUp':
      return <ArrowUp className={lucideClass} strokeWidth={2.25} aria-hidden />
    case 'eye':
      return <Eye className={lucideClass} strokeWidth={2.25} aria-hidden />
    case 'mallet':
      return (
        <span
          className={cn(
            'shrink-0 leading-none',
            !flat &&
              'drop-shadow-[0_0_1px_rgba(0,0,0,0.4)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.15)]',
            compact ? 'text-[11px]' : 'text-[13px]'
          )}
          aria-hidden
        >
          🔨
        </span>
      )
    case 'lock':
      return <Lock className={lucideClass} strokeWidth={2.25} aria-hidden />
  }
}

export type EditionBadgeProps = {
  editionNumber: number
  totalEditions: number
  artistName: string
  className?: string
  /** Tighter type for mobile / narrow panels */
  compact?: boolean
  /** Larger type + framed block for artwork detail / accordion */
  prominent?: boolean
  /** Softer type inside {@link ArtworkEditionUnifiedSection} (no extra frame) */
  unifiedSection?: boolean
  /** Strip / picker: stage chip only (no subline or CTA) */
  chipOnly?: boolean
  /** Below edition CTA — e.g. watch control (kept with edition story, not scarcity bar) */
  afterCta?: ReactNode
}

/**
 * Gallery-style edition progress label: stage badge, subline, and CTA (e.g. near add-to-cart).
 */
export function EditionBadge({
  editionNumber,
  totalEditions,
  artistName,
  className,
  compact = false,
  prominent = false,
  unifiedSection = false,
  chipOnly = false,
  afterCta,
}: EditionBadgeProps) {
  const resolved = useMemo(() => {
    const stage = getEditionStageKey(editionNumber, totalEditions)
    if (!stage) return null
    const remaining = Math.max(0, totalEditions - editionNumber)
    const x = editionNumber
    const n = Math.min(totalEditions, editionNumber + 1)
    const artist = artistName.trim() || 'this artist'
    const copy = getEditionStageCopy(stage, {
      artist,
      x,
      n,
      total: totalEditions,
      remaining,
    })
    return { stage, copy, visualKind: getEditionStageVisualKind(stage) }
  }, [editionNumber, totalEditions, artistName])

  if (!resolved) return null
  const { copy, visualKind } = resolved

  if (chipOnly) {
    return (
      <div className={cn('w-full flex justify-center', className)}>
        <span
          className={cn(
            'inline-flex max-w-full min-w-0 items-center justify-center gap-1 font-semibold uppercase',
            'rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px] tracking-[0.06em]',
            'border border-border/60 text-foreground',
            'bg-card/85 backdrop-blur-md backdrop-saturate-150',
            'dark:border-white/20 dark:bg-black/45 dark:text-white'
          )}
          title={copy.badge}
        >
          <EditionStageLeadIcon kind={visualKind} compact flat />
          <span className="min-w-0 truncate">{copy.badge}</span>
        </span>
      </div>
    )
  }

  const inner = (
    <>
      <span
        className={cn(
          'inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 font-semibold uppercase',
          unifiedSection &&
            'rounded-md px-3 py-1 text-xs tracking-[0.07em] bg-muted text-foreground ring-1 ring-border',
          !unifiedSection &&
            (prominent
              ? 'rounded-md px-3 py-1.5 text-[11px] tracking-[0.08em] shadow-inner bg-foreground text-background ring-1 ring-border'
              : cn(
                  'rounded-sm px-1.5 py-0.5 bg-foreground text-background tracking-[0.06em] ring-1 ring-border',
                  compact ? 'text-[8px]' : 'text-[9px]'
                ))
        )}
      >
        <EditionStageLeadIcon kind={visualKind} compact={compact && !unifiedSection && !prominent} />
        <span className="min-w-0 truncate">{copy.badge}</span>
      </span>
      <p
        className={cn(
          'leading-snug max-w-[22rem] mx-auto',
          unifiedSection &&
            'text-sm text-muted-foreground px-1 mt-0.5 font-normal leading-snug',
          !unifiedSection &&
            (prominent
              ? 'text-sm font-medium text-foreground px-1 mt-1'
              : cn(
                  'text-muted-foreground',
                  compact ? 'text-[9px]' : 'text-[10px]',
                  'max-w-[18rem] px-0.5'
                ))
        )}
      >
        {copy.subline}
      </p>
      <p
        className={cn(
          'leading-snug max-w-[22rem] mx-auto',
          unifiedSection &&
            'text-[11px] text-muted-foreground px-1 font-normal',
          !unifiedSection &&
            (prominent
              ? 'text-xs font-medium text-experience-highlight px-1'
              : cn(
                  'text-muted-foreground',
                  compact ? 'text-[8px]' : 'text-[9px]',
                  'max-w-[18rem] px-0.5 leading-tight'
                ))
        )}
      >
        {copy.cta}
      </p>
      {afterCta}
    </>
  )

  if (prominent && !unifiedSection) {
    return (
      <div
        className={cn(
          'w-full rounded-xl border-2 border-border',
          'bg-gradient-to-b from-card via-muted/50 to-muted',
          'px-4 py-4 shadow-md',
          className
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground text-center mb-3">
          Edition status
        </p>
        <div className="flex flex-col items-center text-center gap-2">{inner}</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center text-center',
        unifiedSection ? 'gap-2' : compact ? 'gap-0.5' : 'gap-1',
        className
      )}
    >
      {inner}
    </div>
  )
}

/**
 * Resolves edition metrics from the product (Storefront list fields + optional Admin quantity fetch).
 */
export function EditionBadgeForProduct({
  product,
  className,
  artistName,
  compact,
  prominent,
  unifiedSection,
  chipOnly,
  showWatchControl = true,
}: {
  product: ShopifyProduct
  className?: string
  /** Overrides `product.vendor` in stage copy (e.g. spotlight display name) */
  artistName?: string
  compact?: boolean
  prominent?: boolean
  unifiedSection?: boolean
  chipOnly?: boolean
  /** When false, omit {@link EditionWatchControl} (e.g. watch is shown under Street ladder in detail) */
  showWatchControl?: boolean
}) {
  const total = useMemo(() => getProductEditionSize(product), [product])
  const fromStorefront = useMemo(() => getProductEditionMetrics(product), [product])
  const [fetchedQty, setFetchedQty] = useState<number | undefined>(undefined)

  useEffect(() => {
    setFetchedQty(undefined)
  }, [product.id])

  const needsQuantityFetch = useMemo(() => {
    if (fromStorefront) return false
    if (total == null || total < 2) return false
    const q = product.variants?.edges?.[0]?.node?.quantityAvailable
    return typeof q !== 'number'
  }, [fromStorefront, total, product])

  useEffect(() => {
    if (!needsQuantityFetch || !product.id) return
    let cancelled = false
    fetch(`/api/shop/products/by-id/${encodeURIComponent(product.id)}/quantity`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.quantityAvailable != null) {
          setFetchedQty(data.quantityAvailable)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [needsQuantityFetch, product.id])

  const metrics = useMemo(() => {
    if (fromStorefront) return fromStorefront
    if (total != null && fetchedQty !== undefined) {
      return buildEditionMetrics(total, fetchedQty)
    }
    return null
  }, [fromStorefront, total, fetchedQty])

  if (!metrics) return null

  return (
    <EditionBadge
      editionNumber={metrics.editionNumberSold}
      totalEditions={metrics.totalEditions}
      artistName={artistName ?? product.vendor ?? ''}
      className={className}
      compact={compact}
      prominent={prominent}
      unifiedSection={unifiedSection}
      chipOnly={chipOnly}
      afterCta={
        chipOnly || !showWatchControl ? null : (
          <EditionWatchControl
            product={product}
            editionNumberSold={metrics.editionNumberSold}
            totalEditions={metrics.totalEditions}
            artistName={artistName ?? product.vendor ?? ''}
            compact={compact}
            chipOnly={chipOnly}
          />
        )
      }
    />
  )
}
