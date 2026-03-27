'use client'

import { Fragment, useMemo } from 'react'
import Image from 'next/image'
import { ExperienceOrderLampIcon } from './ExperienceOrderLampIcon'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { useExperienceTheme } from '../ExperienceThemeContext'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

/** Portrait tiles match [`ArtworkCarouselBar`](../../experience/components/ArtworkCarouselBar.tsx) strip (14×20, 15px radius). */
const THUMB_WIDTH_PX = 36
const IMAGE_REQUEST_PX = 280
const MAX_THUMBS = 5

export interface ExperienceCheckoutStickyBarProps {
  lamp: ShopifyProduct
  lampQuantity: number
  /** Artworks in the experience cart (excludes lamp). */
  selectedArtworks: ShopifyProduct[]
  /** Lamp + artworks subtotal before promo (same basis as OrderBar). */
  orderSubtotal: number
}

function firstImageUrl(product: ShopifyProduct): string | null {
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

type Slot = { key: string; product: ShopifyProduct; isLamp: boolean }

function PlusSep({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <span
      className={cn(
        'shrink-0 self-center text-base font-semibold leading-none',
        theme === 'light' ? 'text-neutral-400' : 'text-[#d4b8b8]'
      )}
      aria-hidden
    >
      +
    </span>
  )
}

function StickyThumb({
  product,
  isLamp,
  theme,
}: {
  product: ShopifyProduct
  isLamp: boolean
  theme: 'light' | 'dark'
}) {
  const raw = firstImageUrl(product)
  const src = raw ? (getShopifyImageUrl(raw, IMAGE_REQUEST_PX) ?? raw) : null
  const label = (product.title ?? (isLamp ? 'Street Lamp' : 'Artwork')).trim()

  const frame = cn(
    'relative shrink-0 overflow-hidden rounded-[15px] border shadow-sm',
    /* Same portrait ratio as carousel thumbs; compact width for the sticky row */
    'w-9 aspect-[14/20] sm:w-10',
    theme === 'light' ? 'border-neutral-200/90 bg-neutral-100' : 'border-white/15 bg-[#201c1c]'
  )

  return (
    <div className={frame} title={label}>
      {src ? (
        <Image
          src={src}
          alt={label}
          fill
          className="object-cover"
          sizes={`(max-width:640px) ${THUMB_WIDTH_PX}px, 40px`}
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {isLamp ? (
            <ExperienceOrderLampIcon
              className={cn('h-5 w-5 sm:h-6 sm:w-6', theme === 'light' ? 'text-neutral-400' : 'text-[#d4b8b8]')}
            />
          ) : (
            <span className="text-xs text-neutral-400 dark:text-[#b89090]">—</span>
          )}
        </span>
      )}
    </div>
  )
}

/**
 * Sticky bottom checkout CTA when the experience cart has at least one artwork.
 * Opens the OrderBar drawer via `openOrderBar` (same as header cart).
 */
export function ExperienceCheckoutStickyBar({
  lamp,
  lampQuantity,
  selectedArtworks,
  orderSubtotal,
}: ExperienceCheckoutStickyBarProps) {
  const { openOrderBar, promoDiscount } = useExperienceOrder()
  const { theme } = useExperienceTheme()

  const visible = selectedArtworks.length >= 1
  const finalTotal = Math.max(0, orderSubtotal - promoDiscount)

  const slots = useMemo<Slot[]>(() => {
    const out: Slot[] = []
    for (let i = 0; i < lampQuantity; i++) {
      out.push({ key: `lamp-${i}`, product: lamp, isLamp: true })
    }
    selectedArtworks.forEach((product, i) => {
      out.push({ key: `${product.id}-${i}`, product, isLamp: false })
    })
    return out
  }, [lamp, lampQuantity, selectedArtworks])

  const { visibleSlots, overflowCount } = useMemo(() => {
    if (slots.length <= MAX_THUMBS) {
      return { visibleSlots: slots, overflowCount: 0 }
    }
    const cap = MAX_THUMBS - 1
    return {
      visibleSlots: slots.slice(0, cap),
      overflowCount: slots.length - cap,
    }
  }, [slots])

  const summaryLabel = useMemo(() => {
    const parts: string[] = []
    if (lampQuantity > 0) {
      parts.push(`${lampQuantity} lamp${lampQuantity > 1 ? 's' : ''}`)
    }
    parts.push(`${selectedArtworks.length} artwork${selectedArtworks.length !== 1 ? 's' : ''}`)
    return `Checkout summary: ${parts.join(', ')}`
  }, [lampQuantity, selectedArtworks.length])

  if (!visible) return null

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
      aria-label={summaryLabel}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {visibleSlots.map((slot, index) => (
            <Fragment key={slot.key}>
              {index > 0 && <PlusSep theme={theme} />}
              <StickyThumb product={slot.product} isLamp={slot.isLamp} theme={theme} />
            </Fragment>
          ))}
          {overflowCount > 0 && (
            <>
              <PlusSep theme={theme} />
              <div
                className={cn(
                  'flex w-9 aspect-[14/20] shrink-0 items-center justify-center rounded-[15px] border text-xs font-bold tabular-nums sm:w-10',
                  theme === 'light'
                    ? 'border-neutral-200 bg-neutral-100 text-neutral-600'
                    : 'border-white/15 bg-white/10 text-white/80'
                )}
                title={`${overflowCount} more items`}
              >
                +{overflowCount}
              </div>
            </>
          )}
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
