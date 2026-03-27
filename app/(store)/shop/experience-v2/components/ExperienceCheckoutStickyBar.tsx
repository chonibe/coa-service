'use client'

import Image from 'next/image'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { useExperienceTheme } from '../ExperienceThemeContext'
import { cn, formatPriceCompact } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'

export interface ExperienceCheckoutStickyBarProps {
  /** Artworks in the experience cart (excludes lamp). */
  selectedArtworks: ShopifyProduct[]
  /** Lamp + artworks subtotal before promo (same basis as OrderBar). */
  orderSubtotal: number
}

/**
 * Sticky bottom checkout CTA when the experience cart has at least one artwork.
 * Opens the OrderBar drawer via `openOrderBar` (same as header cart).
 */
export function ExperienceCheckoutStickyBar({
  selectedArtworks,
  orderSubtotal,
}: ExperienceCheckoutStickyBarProps) {
  const { openOrderBar, promoDiscount } = useExperienceOrder()
  const { theme } = useExperienceTheme()

  const visible = selectedArtworks.length >= 1
  if (!visible) return null

  const primary = selectedArtworks[selectedArtworks.length - 1]
  const extra = selectedArtworks.length - 1
  const artist = (primary.vendor ?? '').trim() || 'Artist'
  const finalTotal = Math.max(0, orderSubtotal - promoDiscount)
  const primaryImageUrl =
    primary.featuredImage?.url || primary.images?.edges?.[0]?.node?.url
  /** Match [`ArtworkCarouselBar`](../../experience/components/ArtworkCarouselBar.tsx) strip tiles: 14×20, 15px radius, Shopify resize. */
  const thumbClass =
    'relative shrink-0 w-12 sm:w-[3.25rem] aspect-[14/20] overflow-hidden rounded-[15px] shadow-sm'

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[52] border-t backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.25)]',
        theme === 'light'
          ? 'border-neutral-200/90 bg-white/95 text-neutral-900'
          : 'border-white/10 bg-[#1c1919]/95 text-white'
      )}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      role="region"
      aria-label="Checkout summary"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-3 md:px-6">
        <div className={cn(thumbClass, 'ring-1 ring-black/[0.08] dark:ring-white/15')}>
          {primaryImageUrl ? (
            <Image
              src={getShopifyImageUrl(primaryImageUrl, 280) ?? primaryImageUrl}
              alt={primary.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width:640px) 48px, 52px"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center text-xs font-medium',
                theme === 'light' ? 'bg-neutral-200 text-neutral-600' : 'bg-neutral-800 text-neutral-400'
              )}
              aria-hidden
            >
              {selectedArtworks.length}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium leading-tight',
              theme === 'light' ? 'text-neutral-900' : 'text-white'
            )}
          >
            <span className="font-semibold">{primary.title}</span>
            <span className={cn('font-normal', theme === 'light' ? 'text-neutral-600' : 'text-white/70')}>
              {' '}
              — {artist}{' '}
            </span>
            <span className="text-emerald-500 dark:text-emerald-400" aria-hidden>
              ✓
            </span>
            {extra > 0 && (
              <span
                className={cn(
                  'ml-1.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                  theme === 'light' ? 'bg-neutral-100 text-neutral-600' : 'bg-white/10 text-white/80'
                )}
              >
                +{extra}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openOrderBar}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md transition-transform active:scale-[0.98]',
            'bg-[#047AFF] text-white hover:bg-[#0366d6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047AFF]'
          )}
          aria-label={`Open checkout, total ${finalTotal.toFixed(2)} dollars`}
        >
          <span className="whitespace-nowrap">
            Checkout · ${formatPriceCompact(finalTotal)}
          </span>
          <span aria-hidden className="text-base leading-none">
            →
          </span>
        </button>
      </div>
    </div>
  )
}
