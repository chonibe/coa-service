'use client'

import { Hammer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import {
  buildEditionMetrics,
  getEditionStageCopy,
  getEditionStageKey,
  getProductEditionMetrics,
  getProductEditionSize,
} from '@/lib/shop/edition-stages'

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
}: EditionBadgeProps) {
  const copy = useMemo(() => {
    const stage = getEditionStageKey(editionNumber, totalEditions)
    if (!stage) return null
    const remaining = Math.max(0, totalEditions - editionNumber)
    const x = editionNumber
    const n = Math.min(totalEditions, editionNumber + 1)
    const artist = artistName.trim() || 'this artist'
    return getEditionStageCopy(stage, {
      artist,
      x,
      n,
      total: totalEditions,
      remaining,
    })
  }, [editionNumber, totalEditions, artistName])

  if (!copy) return null

  if (chipOnly) {
    return (
      <div className={cn('w-full flex justify-center', className)}>
        <span
          className={cn(
            'inline-flex max-w-full min-w-0 items-center justify-center font-semibold uppercase',
            'rounded-md px-2 py-0.5 text-[9px] sm:text-[10px] tracking-[0.06em]',
            'bg-neutral-900 text-neutral-100 dark:bg-[#0c0b0b] dark:text-[#e6e2e2]'
          )}
          title={copy.badge}
        >
          <span className="truncate">{copy.badge}</span>
        </span>
      </div>
    )
  }

  const inner = (
    <>
      <span
        className={cn(
          'inline-flex max-w-full min-w-0 items-center justify-center font-semibold uppercase text-neutral-100',
          unifiedSection &&
            'gap-1.5 rounded-md px-3 py-1 text-xs tracking-[0.07em] bg-neutral-800/95 text-neutral-100 dark:bg-[#141010] dark:text-[#e8e4e4]',
          !unifiedSection &&
            (prominent
              ? 'rounded-md px-3 py-1.5 text-[11px] tracking-[0.08em] shadow-inner bg-neutral-950 ring-1 ring-black/20 dark:bg-[#050505] dark:ring-white/10'
              : cn(
                  'rounded-sm px-1.5 py-0.5 bg-neutral-900 dark:bg-[#0c0b0b] dark:text-[#e6e2e2] tracking-[0.06em]',
                  compact ? 'text-[8px]' : 'text-[9px]'
                ))
        )}
      >
        {unifiedSection ? (
          <>
            <Hammer className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
            <span className="min-w-0 truncate">{copy.badge}</span>
          </>
        ) : (
          <span className="truncate">{copy.badge}</span>
        )}
      </span>
      <p
        className={cn(
          'leading-snug max-w-[22rem] mx-auto',
          unifiedSection &&
            'text-sm text-neutral-600 dark:text-[#b0a0a0] px-1 mt-0.5 font-normal leading-snug',
          !unifiedSection &&
            (prominent
              ? 'text-sm font-medium text-neutral-800 dark:text-[#ece4e4] px-1 mt-1'
              : cn(
                  'text-neutral-600 dark:text-[#a89898]',
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
            'text-[11px] text-neutral-500 dark:text-[#908080] px-1 font-normal',
          !unifiedSection &&
            (prominent
              ? 'text-xs font-medium text-amber-900/90 dark:text-[#FFBA94] px-1'
              : cn(
                  'text-neutral-500 dark:text-[#948888]',
                  compact ? 'text-[8px]' : 'text-[9px]',
                  'max-w-[18rem] px-0.5 leading-tight'
                ))
        )}
      >
        {copy.cta}
      </p>
    </>
  )

  if (prominent && !unifiedSection) {
    return (
      <div
        className={cn(
          'w-full rounded-xl border-2 border-neutral-200/90 dark:border-[#3d3636]',
          'bg-gradient-to-b from-white via-neutral-50/95 to-neutral-100/80',
          'dark:from-[#221e1e] dark:via-[#1a1616] dark:to-[#141010]',
          'px-4 py-4 shadow-md dark:shadow-black/40',
          className
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-[#9a8888] text-center mb-3">
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
}: {
  product: ShopifyProduct
  className?: string
  /** Overrides `product.vendor` in stage copy (e.g. spotlight display name) */
  artistName?: string
  compact?: boolean
  prominent?: boolean
  unifiedSection?: boolean
  chipOnly?: boolean
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
    />
  )
}
