'use client'

import Image from 'next/image'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'

export interface LampSelectorPromoBannerProps {
  lamp: ShopifyProduct
  /** Unit price in USD (same source as parent `parseFloat(lamp.priceRange…)`). */
  priceUsd: number
  /** True when lamp `ArtworkDetail` is open (for collapse affordance on desktop). */
  detailOpen: boolean
  onOpenDetail: () => void
  onCloseDetail: () => void
  onAddLamp: () => void
  /** When true, show the short “how it works” line above the product title. */
  showBadge?: boolean
}

export function LampSelectorPromoBanner({
  lamp,
  priceUsd,
  detailOpen,
  onOpenDetail,
  onCloseDetail,
  onAddLamp,
  showBadge = true,
}: LampSelectorPromoBannerProps) {
  const thumb =
    lamp.featuredImage?.url ?? lamp.images?.edges?.[0]?.node?.url ?? null
  const title = lamp.title?.trim() || 'Street Lamp'
  const priceLabel = priceUsd > 0 ? `$${formatPriceCompact(priceUsd)}` : ''

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden text-center rounded-xl ring-1 ring-inset',
        'ring-[#FFBA94]/35 dark:ring-[#FFBA94]/28'
      )}
    >
      <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-[#201c1c]/80">
        <div
          role="button"
          tabIndex={0}
          aria-label={`View ${title} details`}
          onClick={onOpenDetail}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpenDetail()
            }
          }}
          className={cn(
            'relative w-full cursor-pointer text-left transition-colors',
            'hover:bg-neutral-50 dark:hover:bg-[#262222]/80'
          )}
        >
          {detailOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCloseDetail()
              }}
              aria-label="Close lamp details"
              className={cn(
                'absolute right-1 top-1 z-10 sm:right-2 sm:top-2',
                'inline-flex items-center justify-center p-2 transition-colors',
                'text-neutral-500 hover:text-neutral-900 active:opacity-80',
                'dark:text-[#b8a0a0] dark:hover:text-[#f0e8e8]'
              )}
            >
              <ChevronUp className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          )}
          <div className="flex items-center gap-3 p-3">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-neutral-200 dark:bg-[#262222]">
              {thumb ? (
                <Image
                  src={getShopifyImageUrl(thumb, 128) ?? thumb}
                  alt={title}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 dark:text-[#908080]">
                  Lamp
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {showBadge && (
                <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-[#b8a0a0] leading-snug pr-1">
                  Start with the lamp, then add your artworks.
                </p>
              )}
              <h3
                className={cn(
                  'text-base sm:text-lg font-semibold text-neutral-900 dark:text-[#FFBA94] truncate',
                  showBadge && 'mt-1'
                )}
              >
                {title}
              </h3>
              {priceLabel ? (
                <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] tabular-nums mt-0.5">
                  {priceLabel}
                </p>
              ) : null}
            </div>
            <ChevronDown className="w-4 h-4 shrink-0 text-neutral-500 dark:text-[#c4a0a0]" aria-hidden />
          </div>
        </div>

        <div
          className="border-t border-neutral-200 dark:border-white/10 px-3 py-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddLamp()
            }}
            className={cn(
              'w-full rounded-lg px-3 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              'bg-neutral-900 text-white hover:bg-neutral-800',
              'dark:bg-[#FFBA94] dark:text-[#171515] dark:hover:bg-[#ffc8a8]'
            )}
          >
            Add the lamp to start my bundle
          </button>
        </div>
      </div>
    </div>
  )
}
