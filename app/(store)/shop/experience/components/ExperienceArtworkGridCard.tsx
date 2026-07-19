'use client'

import Image from 'next/image'
import { Check, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import {
  experienceQuickAddFabIconClass,
  getExperienceQuickAddFabClass,
} from '@/lib/shop/experience-artwork-card-surfaces'
import {
  formatStreetArtworkListPrice,
  formatStreetNextSalesChipText,
} from '@/lib/shop/experience-street-ladder-display'
import {
  experienceArtworkUnitUsd,
  normalizeExperienceProductKey,
} from '@/lib/shop/experience-artwork-unit-price'
import { streetEditionRowFromStorefrontProduct } from '@/lib/shop/street-edition-from-storefront'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { capitalizeFirstLetter, cn, formatPriceCompact } from '@/lib/utils'

export type ExperienceArtworkGridCardProps = {
  product: ShopifyProduct
  isPreview?: boolean
  isInCart?: boolean
  onPreview: (product: ShopifyProduct) => void
  onQuickAdd?: (product: ShopifyProduct) => void
  /** Optional chip on image (e.g. "Your pick", "Featured Artist") */
  badge?: string | null
  lockedArtworkPrices?: Record<string, number>
  streetLadderPrices?: Record<string, number>
  streetPricingSeasonFallback?: 1 | 2
  /** Full Street ladder row (API or storefront); enables "N more · then $X" chip. */
  streetPricing?: StreetEditionStatesRow | null
  /** Artist name below title; defaults to `product.vendor`. */
  artistName?: string
  /** Early-access spotlight: 10% off list with compare-at. */
  isEarlyAccess?: boolean
  priorityLoad?: boolean
  /** Slider: fixed width; grid: fills parent (picker 2-up rows). */
  layout?: 'slider' | 'grid'
  className?: string
}

export function ExperienceArtworkGridCard({
  product,
  isPreview = false,
  isInCart = false,
  onPreview,
  onQuickAdd,
  badge = null,
  lockedArtworkPrices,
  streetLadderPrices,
  streetPricingSeasonFallback = 2,
  streetPricing: streetPricingProp = null,
  artistName,
  isEarlyAccess = false,
  priorityLoad = false,
  layout = 'grid',
  className,
}: ExperienceArtworkGridCardProps) {
  const imageEdges = product.images?.edges?.map((e) => e.node) ?? []
  const primaryUrl =
    product.featuredImage?.url ?? imageEdges[0]?.url ?? null
  const secondUrl =
    imageEdges.find((n) => n.url && n.url !== primaryUrl)?.url ?? imageEdges[1]?.url ?? null
  const img = getShopifyImageUrl(primaryUrl, 480) ?? primaryUrl
  const secondImg = secondUrl ? getShopifyImageUrl(secondUrl, 480) ?? secondUrl : null
  const productKey = normalizeExperienceProductKey(product.id)
  const ladderUsd = streetLadderPrices?.[productKey]
  const fromStorefront = streetEditionRowFromStorefrontProduct(product, {
    seasonBandsFallback: streetPricingSeasonFallback,
  })
  let resolvedStreetPricing = streetPricingProp ?? fromStorefront
  if (!streetPricingProp && resolvedStreetPricing && ladderUsd != null && ladderUsd > 0) {
    resolvedStreetPricing = { ...resolvedStreetPricing, priceUsd: ladderUsd }
  }
  const price = experienceArtworkUnitUsd(product, {
    lockedUsdByProductId: lockedArtworkPrices,
    streetLadderUsdByProductId: streetLadderPrices,
    seasonBandsFallback: streetPricingSeasonFallback,
  })
  const displayTitle = capitalizeFirstLetter(product.title)
  const artistSubtitle = (artistName ?? product.vendor?.trim() ?? 'Artist').toUpperCase()
  const footerPrice = formatStreetArtworkListPrice(product, resolvedStreetPricing, isEarlyAccess)
  const streetListActive = !!(
    resolvedStreetPricing &&
    resolvedStreetPricing.priceUsd != null &&
    resolvedStreetPricing.priceUsd > 0
  )
  const nextSalesChipText =
    streetListActive && resolvedStreetPricing
      ? formatStreetNextSalesChipText(resolvedStreetPricing.nextBump)
      : null

  return (
    <article
      className={cn(
        'group relative',
        layout === 'slider' && 'w-[min(42vw,168px)] shrink-0 sm:w-[180px]',
        layout === 'grid' && 'w-full min-w-0',
        isPreview && 'z-[1]',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onPreview(product)}
        className={cn(
          'block w-full rounded-2xl border text-left transition-colors',
          isPreview ? 'border-experience-highlight/70' : 'border-border/80 hover:border-border'
        )}
      >
        <div className="relative aspect-[14/20] w-full overflow-hidden rounded-t-2xl bg-experience-surface">
          {img ? (
            <>
              <Image
                src={img}
                alt={displayTitle}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  // Desktop hover swap; touch: brief press peek as mobile fallback
                  secondImg &&
                    '[@media(hover:hover)]:group-hover:opacity-0 [@media(hover:none)]:group-active:opacity-0'
                )}
                sizes={layout === 'slider' ? '180px' : '(max-width: 480px) 50vw, 280px'}
                priority={priorityLoad}
                unoptimized
              />
              {secondImg ? (
                <Image
                  src={secondImg}
                  alt=""
                  fill
                  aria-hidden
                  className="object-cover opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:none)]:group-active:opacity-100"
                  sizes={layout === 'slider' ? '180px' : '(max-width: 480px) 50vw, 280px'}
                  unoptimized
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
              No image
            </div>
          )}
          {badge ? (
            <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="space-y-0.5 overflow-hidden rounded-b-2xl bg-experience-surface-2 px-2.5 py-2.5">
          <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">{displayTitle}</p>
          <p
            className="truncate text-[9px] font-semibold uppercase tracking-widest text-muted-foreground"
            title={artistSubtitle}
          >
            {artistSubtitle}
          </p>
          {resolvedStreetPricing ? (
            streetListActive ? (
              <div className="flex min-w-0 flex-wrap items-baseline justify-start gap-x-1.5 gap-y-0">
                <span
                  className={cn(
                    'text-[11px] font-semibold tabular-nums tracking-tight',
                    footerPrice.compareAt
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-experience-highlight'
                  )}
                >
                  {footerPrice.primary}
                </span>
                {footerPrice.compareAt ? (
                  <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                    {footerPrice.compareAt}
                  </span>
                ) : null}
                {nextSalesChipText ? (
                  <>
                    <span
                      className="shrink-0 text-[0.85em] leading-none text-muted-foreground select-none"
                      aria-hidden
                    >
                      ✦
                    </span>
                    <span className="min-w-0 text-[10px] font-medium tabular-nums leading-snug text-foreground/80">
                      {nextSalesChipText}
                    </span>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-muted-foreground">{resolvedStreetPricing.label}</p>
            )
          ) : price > 0 ? (
            <p className="text-[11px] tabular-nums text-experience-highlight">${formatPriceCompact(price)}</p>
          ) : null}
        </div>
      </button>
      {onQuickAdd && product.availableForSale !== false ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAdd(product)
          }}
          className={cn('absolute right-1.5 top-1.5 z-10', getExperienceQuickAddFabClass(isInCart))}
          aria-label={isInCart ? `Remove ${displayTitle} from cart` : `Add ${displayTitle} to cart`}
          aria-pressed={isInCart}
        >
          {isInCart ? (
            <Check className={experienceQuickAddFabIconClass} strokeWidth={2.5} aria-hidden />
          ) : (
            <Plus className={experienceQuickAddFabIconClass} strokeWidth={2.5} aria-hidden />
          )}
        </button>
      ) : null}
    </article>
  )
}
