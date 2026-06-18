'use client'

import { useMemo } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { capitalizeFirstLetter, cn } from '@/lib/utils'
import type { StreetLadderForScarcity } from '@/lib/shop/experience-street-ladder-display'
import { ScarcityBadge } from '../../experience-v2/components/ScarcityBadge'
import { EditionWatchControl } from '../../experience-v2/components/EditionWatchControl'
import { getEditionStageCopy, getEditionStageKey } from '@/lib/shop/edition-stages'

export type ExperienceV3EditionStripProps = {
  product: ShopifyProduct
  editionSize: number
  quantityAvailable?: number
  streetLadder?: StreetLadderForScarcity | null
  editionNumberSold: number
  totalEditions: number
  artistName: string
  className?: string
}

/** Compact scarcity + optional ladder + inline edition watch (no heavy centered well). */
export function ExperienceV3EditionStrip({
  product,
  editionSize,
  quantityAvailable,
  streetLadder,
  editionNumberSold,
  totalEditions,
  artistName,
  className,
}: ExperienceV3EditionStripProps) {
  const stageLabel = useMemo(() => {
    if (streetLadder?.stageLabel) return streetLadder.stageLabel
    const stage = getEditionStageKey(editionNumberSold, totalEditions)
    if (!stage) return null
    const remaining = Math.max(0, totalEditions - editionNumberSold)
    return getEditionStageCopy(stage, {
      artist: artistName.trim() || 'this artist',
      x: editionNumberSold,
      n: Math.min(totalEditions, editionNumberSold + 1),
      total: totalEditions,
      remaining,
    }).badge
  }, [streetLadder?.stageLabel, editionNumberSold, totalEditions, artistName])

  const remainingCaption =
    editionSize > 0 && typeof quantityAvailable === 'number'
      ? `${quantityAvailable} of ${editionSize} remaining in this edition`
      : null

  return (
    <div className={cn('px-3.5 py-3', className)}>
      <div className="mx-auto w-full max-w-md space-y-2.5">
        <ScarcityBadge
          quantityAvailable={quantityAvailable}
          editionSize={editionSize}
          availableForSale={product.availableForSale}
          variant="bar"
          productId={product.id}
          productImage={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null}
          productTitle={capitalizeFirstLetter(product.title)}
          unifiedSection
          hideEditionCaption
          className="w-full"
          streetLadder={undefined}
        />
        <div className="border-t border-white/[0.05] pt-2.5">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-center">
            {remainingCaption ? (
              <span className="text-[11px] font-medium tabular-nums leading-snug text-white/55">
                {remainingCaption}
              </span>
            ) : null}
            {remainingCaption && stageLabel ? (
              <span className="text-[10px] text-white/25" aria-hidden>
                ·
              </span>
            ) : null}
            {stageLabel ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {stageLabel}
              </span>
            ) : null}
            {(remainingCaption || stageLabel) ? (
              <span className="text-[10px] text-white/25" aria-hidden>
                ·
              </span>
            ) : null}
            <EditionWatchControl
              product={product}
              editionNumberSold={editionNumberSold}
              totalEditions={totalEditions}
              artistName={artistName}
              compact
              inline
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Mobile edition card. Desktop gallery uses {@link ExperienceV3EditionStrip} alone. */
export function ExperienceV3ProductInfoStack({
  edition,
  className,
}: {
  edition: ExperienceV3EditionStripProps
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/[0.06] bg-[#111010]/60 md:hidden',
        className
      )}
    >
      <ExperienceV3EditionStrip {...edition} />
    </div>
  )
}
