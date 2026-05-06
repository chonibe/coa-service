'use client'

import { useCallback, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, LayoutGrid, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import {
  formatStreetArtworkListPrice,
  formatStreetNextSalesChipText,
} from '@/lib/shop/experience-street-ladder-display'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { streetEditionRowFromStorefrontProduct } from '@/lib/shop/street-edition-from-storefront'

export type SlideoutSeason = 'season1' | 'season2'

interface ExperienceV3CollectionSlideoutProps {
  /** Expanded width (~360px); collapsed shows a slim rail */
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  products: ShopifyProduct[]
  cartProductIds: Set<string>
  activeSeason: SlideoutSeason
  onSeasonChange: (season: SlideoutSeason) => void
  /** Card tap (excluding +): load artwork in main hero only */
  onSelectArtwork: (product: ShopifyProduct) => void
  /** + control: add to cart only — does not move hero preview */
  onQuickAddToCart: (product: ShopifyProduct) => void
  /** Edition ladder copy */
  streetEditionByProductId: Record<string, StreetEditionStatesRow>
  seasonBandsFallback: 1 | 2
  /** Optional sentinel for infinite scroll */
  scrollSentinel?: React.ReactNode
}

export function ExperienceV3CollectionSlideout({
  collapsed,
  onCollapsedChange,
  products,
  cartProductIds,
  activeSeason,
  onSeasonChange,
  onSelectArtwork,
  onQuickAddToCart,
  streetEditionByProductId,
  seasonBandsFallback,
  scrollSentinel,
}: ExperienceV3CollectionSlideoutProps) {
  const { theme } = useExperienceTheme()
  const wrapRef = useRef<HTMLDivElement>(null)
  const railClass =
    theme === 'light'
      ? 'border-l border-neutral-200 bg-white/95'
      : 'border-l border-white/10 bg-[#141212]/97'

  const streetRow = useCallback(
    (product: ShopifyProduct) => {
      const k = normalizeShopifyProductId(product.id)
      if (k && streetEditionByProductId[k]) return streetEditionByProductId[k]!
      return streetEditionRowFromStorefrontProduct(product, { seasonBandsFallback })
    },
    [streetEditionByProductId, seasonBandsFallback]
  )

  return (
    <div
      className={cn(
        'relative z-40 flex min-h-0 shrink-0 flex-col transition-[width] duration-300 ease-out',
        collapsed ? 'w-11' : 'w-[min(100vw-4rem,22rem)] sm:w-[22rem]'
      )}
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand collection picker' : 'Collapse collection picker'}
        onClick={() => onCollapsedChange(!collapsed)}
        className={cn(
          'absolute left-0 top-1/2 z-40 flex h-12 w-6 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-md border shadow-lg',
          theme === 'light'
            ? 'border-neutral-200 bg-white text-neutral-700'
            : 'border-white/15 bg-[#1f1b1b] text-white'
        )}
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
      </button>

      <div ref={wrapRef} className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden backdrop-blur-md', railClass)}>
        <div className={cn('shrink-0 border-b px-3 py-3', theme === 'light' ? 'border-neutral-200' : 'border-white/10')}>
          {!collapsed ? (
            <>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className={cn('text-sm font-semibold leading-tight', theme === 'light' ? 'text-neutral-900' : 'text-[#f0e8e8]')}>
                    Start your Collection
                  </p>
                  <p className={cn('text-[11px]', theme === 'light' ? 'text-neutral-500' : 'text-neutral-400')}>Tap a card to preview · + adds to cart</p>
                </div>
                <LayoutGrid className={cn('h-4 w-4 shrink-0 opacity-60', theme === 'light' ? 'text-neutral-700' : 'text-white')} aria-hidden />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSeasonChange('season1')}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
                    activeSeason === 'season1'
                      ? 'bg-orange-400 text-neutral-900'
                      : theme === 'light'
                        ? 'bg-neutral-100 text-neutral-600'
                        : 'bg-white/10 text-neutral-300'
                  )}
                >
                  Season 1
                </button>
                <button
                  type="button"
                  onClick={() => onSeasonChange('season2')}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
                    activeSeason === 'season2'
                      ? 'bg-orange-400 text-neutral-900'
                      : theme === 'light'
                        ? 'bg-neutral-100 text-neutral-600'
                        : 'bg-white/10 text-neutral-300'
                  )}
                >
                  Season 2
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center pt-10">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 [writing-mode:vertical-rl]">
                Art
              </span>
            </div>
          )}
        </div>

        {!collapsed ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-4 pb-24">
              {products.map((p) => (
                <SlideoutCard
                  key={p.id}
                  product={p}
                  inCart={cartProductIds.has(p.id)}
                  streetPricing={streetRow(p)}
                  onSelect={() => onSelectArtwork(p)}
                  onQuickAdd={(e) => {
                    e.stopPropagation()
                    onQuickAddToCart(p)
                  }}
                />
              ))}
              {scrollSentinel}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SlideoutCard({
  product,
  inCart,
  streetPricing,
  onSelect,
  onQuickAdd,
}: {
  product: ShopifyProduct
  inCart: boolean
  streetPricing: StreetEditionStatesRow
  onSelect: () => void
  onQuickAdd: (e: React.MouseEvent) => void
}) {
  const { theme } = useExperienceTheme()
  const url = product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url
  const footerPrice = formatStreetArtworkListPrice(product, streetPricing, false)
  const streetListActive = !!(streetPricing.priceUsd != null && streetPricing.priceUsd > 0)
  const nextSalesChipText =
    streetListActive && streetPricing ? formatStreetNextSalesChipText(streetPricing.nextBump) : null

  return (
    <li>
      <div
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-xl border transition-shadow',
          inCart ? 'border-blue-400/50 shadow-md shadow-blue-500/15' : 'border-white/12 hover:border-white/25',
          theme === 'light' ? 'border-neutral-200 bg-white' : 'bg-[#1c1818]'
        )}
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        <div className="relative aspect-[4/5] w-full">
          {url ? (
            <Image
              src={getShopifyImageUrl(url, 420) ?? url}
              alt={product.title}
              fill
              className="object-cover"
              sizes="240px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-500">No image</div>
          )}
          <button
            type="button"
            aria-label={`Add ${product.title} to cart`}
            disabled={product.availableForSale === false}
            onClick={onQuickAdd}
            className={cn(
              'absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-colors',
              'bg-violet-600 text-white hover:bg-violet-500',
              product.availableForSale === false ? 'cursor-not-allowed opacity-40' : ''
            )}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
        <div className={cn('space-y-0.5 px-2 pb-2 pt-1.5', theme === 'light' ? 'bg-neutral-50' : 'bg-[#231f1f]')}>
          <p className={cn('line-clamp-2 text-[11px] font-semibold leading-snug', theme === 'light' ? 'text-neutral-900' : 'text-[#eae0e0]')}>
            {product.title}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
            <span className={cn('text-xs font-semibold tabular-nums', theme === 'light' ? 'text-neutral-900' : 'text-[#f0e8e8]')}>
              {footerPrice.primary}
            </span>
            {nextSalesChipText ? (
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{nextSalesChipText}</span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}
