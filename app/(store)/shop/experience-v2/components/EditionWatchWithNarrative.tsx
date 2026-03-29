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
    <div className={cn('flex w-full flex-col items-center gap-0', className)}>
      <EditionWatchControl
        product={product}
        editionNumberSold={editionNumberSold}
        totalEditions={totalEditions}
        artistName={artistName}
        variant="well"
      />
      {copy ? (
        <div className="mt-3 w-full max-w-[18rem] space-y-1.5 text-center">
          <p className="text-balance text-[13px] font-normal leading-relaxed text-neutral-600 dark:text-[#b8a8a8]">
            {copy.subline}
          </p>
          <p className="text-balance text-[11px] font-medium leading-relaxed tracking-wide text-[#c85a28] dark:text-[#FFBA94]">
            {copy.cta}
          </p>
        </div>
      ) : null}
    </div>
  )
}
