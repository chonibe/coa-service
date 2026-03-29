'use client'

import { Fragment, useMemo } from 'react'
import Image from 'next/image'
import { ChevronRight, Plus } from 'lucide-react'
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
  /** Opens the artwork picker; **empty collection** row uses it for “Choose your first artwork”; **≥1 artwork** uses centered FAB. */
  onOpenPicker?: () => void
  /** When `collection` and there are no artworks yet, the bar shows the primary “choose artwork” CTA (not in watchlist empty state). */
  stripMode?: 'collection' | 'watchlist'
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
 * Sticky bottom bar: **empty collection** shows “Choose your first artwork”; **≥1 artwork** shows thumbnails, checkout, and optional centered add FAB.
 * Opens the OrderBar drawer via `openOrderBar` (same as header cart).
 */
export function ExperienceCheckoutStickyBar({
  lamp,
  lampQuantity,
  selectedArtworks,
  orderSubtotal,
  onOpenPicker,
  stripMode = 'collection',
}: ExperienceCheckoutStickyBarProps) {
  const { openOrderBar, promoDiscount } = useExperienceOrder()
  const { theme } = useExperienceTheme()

  const hasArtworks = selectedArtworks.length >= 1
  const showEmptyCollectionCta = !hasArtworks && stripMode === 'collection'
  const visible = hasArtworks || showEmptyCollectionCta
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
    if (!hasArtworks && stripMode === 'collection') {
      return 'Choose artwork to add to your collection'
    }
    const parts: string[] = []
    if (lampQuantity > 0) {
      parts.push(`${lampQuantity} lamp${lampQuantity > 1 ? 's' : ''}`)
    }
    parts.push(`${selectedArtworks.length} artwork${selectedArtworks.length !== 1 ? 's' : ''}`)
    return `Checkout summary: ${parts.join(', ')}`
  }, [lampQuantity, selectedArtworks.length, hasArtworks, stripMode])

  const chooseFirstArtworkClass = cn(
    'flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-left text-base font-semibold leading-tight tracking-tight shadow-lg transition-all duration-200 active:scale-[0.98]',
    theme === 'light'
      ? 'border-blue-600 bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:border-blue-700'
      : 'border-blue-500 bg-blue-600 text-white shadow-black/40 hover:bg-blue-500 hover:border-blue-400'
  )

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
      <div className="relative mx-auto max-w-2xl px-4 py-3 md:px-6">
        {showEmptyCollectionCta ? (
          onOpenPicker ? (
            <button
              type="button"
              onClick={onOpenPicker}
              className={cn(chooseFirstArtworkClass, 'w-full')}
              aria-label="Choose your first artwork"
            >
              <span className="min-w-0 truncate">Choose your first artwork</span>
              <ChevronRight className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2.5} aria-hidden />
            </button>
          ) : null
        ) : (
          <>
            <div className="flex items-center gap-3">
              {/* Mobile: lamp + count only — no horizontal artwork thumbs (too tight next to checkout). */}
              <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
                <div className="relative shrink-0">
                  <StickyThumb product={lamp} isLamp theme={theme} />
                  {lampQuantity > 1 ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#047AFF] px-1 text-[9px] font-bold tabular-nums text-white shadow-sm ring-2 ring-white dark:ring-[#1c1919]"
                      aria-label={`${lampQuantity} lamps`}
                    >
                      {lampQuantity}
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    'min-w-0 text-sm font-semibold leading-tight',
                    theme === 'light' ? 'text-neutral-900' : 'text-white'
                  )}
                >
                  <span className="tabular-nums">{selectedArtworks.length}</span>
                  <span
                    className={cn(
                      'font-medium',
                      theme === 'light' ? 'text-neutral-600' : 'text-[#c4a8a8]'
                    )}
                  >
                    {' '}
                    added
                  </span>
                </p>
              </div>
              <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide md:flex">
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
                  'relative z-[3] flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md transition-transform active:scale-[0.98]',
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
            {onOpenPicker ? (
              <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-4 md:px-6">
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className={cn(
                    'pointer-events-auto relative z-[2] flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-transform active:scale-95 sm:h-[3.25rem] sm:w-[3.25rem]',
                    theme === 'light'
                      ? [
                          'border-white/80 bg-white/45 text-neutral-800',
                          'shadow-[0_6px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]',
                          'hover:bg-white/60 hover:border-white hover:shadow-[0_8px_28px_rgba(0,0,0,0.14)]',
                        ]
                      : [
                          'border-white/30 bg-white/18 text-white',
                          'shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]',
                          'hover:bg-white/28 hover:border-white/45 hover:shadow-[0_10px_36px_rgba(0,0,0,0.5)]',
                        ]
                  )}
                  aria-label="Add artwork to collection"
                  title="Add artwork"
                >
                  <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.25} />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
