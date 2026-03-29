'use client'

import { useMemo } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getEditionStageCopy, getEditionStageKey } from '@/lib/shop/edition-stages'
import { cn } from '@/lib/utils'
import { EditionWatchControl } from './EditionWatchControl'

/** Watch CTA plus edition subline/CTA copy (replaces a full {@link ArtworkEditionUnifiedSection} when ladder lives in scarcity). */
export function EditionWatchWithNarrative({
  product,
  editionNumberSold,
  totalEditions,
  artistName,
  className,
}: {
  product: ShopifyProduct
  editionNumberSold: number
  totalEditions: number
  artistName: string
  className?: string
}) {
  const copy = useMemo(() => {
    const stage = getEditionStageKey(editionNumberSold, totalEditions)
    if (!stage) return null
    const remaining = Math.max(0, totalEditions - editionNumberSold)
    const x = editionNumberSold
    const n = Math.min(totalEditions, editionNumberSold + 1)
    const artist = artistName.trim() || 'this artist'
    return getEditionStageCopy(stage, { artist, x, n, total: totalEditions, remaining })
  }, [editionNumberSold, totalEditions, artistName])

  return (
    <div className={cn('w-full flex flex-col items-center', className)}>
      <EditionWatchControl
        product={product}
        editionNumberSold={editionNumberSold}
        totalEditions={totalEditions}
        artistName={artistName}
      />
      {copy ? (
        <div className="mt-2 w-full max-w-[22rem] mx-auto space-y-1 px-1 text-center">
          <p className="text-xs font-normal leading-snug text-neutral-600 dark:text-[#b0a0a0]">
            {copy.subline}
          </p>
          <p className="text-[11px] leading-snug text-neutral-500 dark:text-[#908080]">
            {copy.cta}
          </p>
        </div>
      ) : null}
    </div>
  )
}
