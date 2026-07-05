'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'

export type ExperienceV3StickyAddPanelProps = {
  /** Scroll container for IntersectionObserver root (main experience column). */
  scrollRootRef: React.RefObject<HTMLElement | null>
  /** Hero section sentinel — panel shows when this leaves the scroll root. */
  heroSectionRef: React.RefObject<HTMLElement | null>
  previewProduct: ShopifyProduct | null
  lamp: ShopifyProduct
  heroImageUrl: string | null
  previewDisplayTitle: string | null
  previewArtworkUnitUsd: number
  previewLampUnitUsd: number
  listPricePrimary?: string | null
  listPriceCompareAt?: string | null
  showLampBundleCard: boolean
  addButtonLabel: string
  previewInCart: boolean
  isSoldOut: boolean
  onAddWithLamp: () => void
  onArtworkOnly: () => void
  onPrimaryAction: () => void
}

/**
 * Desktop-only sticky bottom offer bar.
 * Appears when the hero section scrolls out of the main column and the
 * preview artwork is not yet in the cart (remove flows stay in the hero).
 */
export function ExperienceV3StickyAddPanel({
  scrollRootRef,
  heroSectionRef,
  previewProduct,
  lamp,
  heroImageUrl,
  previewDisplayTitle,
  previewArtworkUnitUsd,
  previewLampUnitUsd,
  listPricePrimary,
  listPriceCompareAt,
  showLampBundleCard,
  addButtonLabel,
  previewInCart,
  isSoldOut,
  onAddWithLamp,
  onArtworkOnly,
  onPrimaryAction,
}: ExperienceV3StickyAddPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [columnFrame, setColumnFrame] = useState<{ left: number; width: number } | null>(null)

  useEffect(() => {
    const root = scrollRootRef.current
    const target = heroSectionRef.current
    if (!root || !target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting)
      },
      {
        root,
        threshold: 0,
        rootMargin: '0px 0px -48px 0px',
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [scrollRootRef, heroSectionRef])

  useEffect(() => {
    const root = scrollRootRef.current
    if (!root || typeof window === 'undefined') return

    const updateFrame = () => {
      const rect = root.getBoundingClientRect()
      setColumnFrame({
        left: rect.left,
        width: rect.width,
      })
    }

    updateFrame()

    const resizeObserver = new ResizeObserver(() => updateFrame())
    resizeObserver.observe(root)
    window.addEventListener('resize', updateFrame)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateFrame)
    }
  }, [scrollRootRef])

  const showPanel =
    isVisible &&
    previewProduct &&
    previewProduct.id !== lamp.id &&
    !previewInCart

  const artImg =
    getShopifyImageUrl(
      previewProduct?.featuredImage?.url ?? previewProduct?.images?.edges?.[0]?.node?.url,
      560
    ) ??
    previewProduct?.featuredImage?.url ??
    previewProduct?.images?.edges?.[0]?.node?.url ??
    heroImageUrl ??
    null

  const lampImg =
    getShopifyImageUrl(
      lamp.featuredImage?.url ?? lamp.images?.edges?.[0]?.node?.url,
      320
    ) ??
    lamp.featuredImage?.url ??
    lamp.images?.edges?.[0]?.node?.url ??
    null

  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-0 z-40 hidden transition-all duration-300 ease-out lg:block',
        showPanel ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      )}
      style={
        columnFrame
          ? {
              left: `${columnFrame.left}px`,
              width: `${columnFrame.width}px`,
            }
          : undefined
      }
      aria-hidden={!showPanel}
    >
      <div
        className={cn(
          'border-t border-border/60 bg-card/95 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md'
        )}
      >
        {showLampBundleCard && previewProduct ? (
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-center gap-6 px-6 py-4">
            <div className="flex min-w-0 items-center gap-5">
              <div className="flex shrink-0 items-center gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  {lampImg ? (
                    <Image
                      src={lampImg}
                      alt={lamp.title}
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Lamp
                    </div>
                  )}
                </div>
                <span className="text-lg font-light text-muted-foreground">+</span>
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                  {artImg ? (
                    <Image
                      src={artImg}
                      alt={previewDisplayTitle ?? previewProduct.title}
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Artwork
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 text-sm">
                <span className="truncate rounded-full bg-background/80 px-3 py-1.5 font-medium text-foreground ring-1 ring-border/70">
                  {lamp.title}
                </span>
                <span className="shrink-0 text-muted-foreground">+</span>
                <span className="truncate rounded-full bg-background/80 px-3 py-1.5 font-medium text-foreground ring-1 ring-border/70">
                  {previewDisplayTitle ?? previewProduct.title}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <p className="text-xl font-semibold tabular-nums text-foreground">
                ${formatPriceCompact(previewArtworkUnitUsd + previewLampUnitUsd)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={onArtworkOnly}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    isSoldOut
                      ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  )}
                >
                  Artwork Only
                </button>
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={onAddWithLamp}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                    isSoldOut
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : 'bg-experience-cta text-white hover:bg-experience-cta-hover dark:text-neutral-900'
                  )}
                >
                  {isSoldOut ? 'Sold out' : 'Add to your street collection'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-center gap-6 px-6 py-4">
            <div className="flex min-w-0 items-center gap-4">
              {artImg ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-experience-surface-2 shadow-sm">
                  <Image
                    src={artImg}
                    alt={previewDisplayTitle ?? 'Artwork'}
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              ) : null}

              <div className="flex min-w-0 items-center gap-3 text-sm">
                <span className="truncate rounded-full bg-background/80 px-3 py-1.5 font-medium text-foreground ring-1 ring-border/70">
                  {previewDisplayTitle ?? previewProduct.title}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={onPrimaryAction}
                className={cn(
                  'flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                  isSoldOut
                    ? 'cursor-not-allowed bg-muted text-muted-foreground'
                    : 'bg-experience-cta text-white hover:bg-experience-cta-hover dark:text-neutral-900'
                )}
              >
                {isSoldOut ? 'Sold out' : 'Add to your street collection'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
