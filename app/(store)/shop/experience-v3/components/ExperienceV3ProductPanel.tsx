'use client'

import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { capitalizeFirstLetter, cn } from '@/lib/utils'
import type { StreetLadderForScarcity } from '@/lib/shop/experience-street-ladder-display'
import { ScarcityBadge } from '../../experience-v2/components/ScarcityBadge'
import { EditionWatchControl } from '../../experience-v2/components/EditionWatchControl'

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
  editionNumberSold,
  totalEditions,
  artistName,
  className,
}: ExperienceV3EditionStripProps) {
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
        <div className="border-t border-border pt-2.5">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-center">
            {remainingCaption ? (
              <span className="text-xs font-medium tabular-nums leading-snug text-muted-foreground md:text-[13px]">
                {remainingCaption}
              </span>
            ) : null}
            {remainingCaption ? (
              <span className="text-[10px] text-muted-foreground/50" aria-hidden>
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
              variant="plain"
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
        'overflow-hidden rounded-xl border border-border bg-experience-surface/60 md:hidden',
        className
      )}
    >
      <ExperienceV3EditionStrip {...edition} />
    </div>
  )
}
