'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import {
  experienceQuickAddFabIconClass,
  getExperienceQuickAddFabClass,
} from '@/lib/shop/experience-artwork-card-surfaces'
import { capitalizeFirstLetter, cn, formatPriceCompact } from '@/lib/utils'
import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import {
  buildExperienceRelatedArtworkSlider,
  type RelatedArtworkReason,
} from '@/lib/shop/experience-related-artworks'
import { experienceArtworkUnitUsd } from '@/lib/shop/experience-artwork-unit-price'

function reasonLabel(reason: RelatedArtworkReason, matchedTags: string[]): string | null {
  if (reason === 'current') return 'Your pick'
  if (reason === 'same_artist') return 'More from this artist'
  if (reason === 'similar_tags' && matchedTags.length > 0) {
    return `Similar · ${matchedTags.slice(0, 2).join(', ')}`
  }
  if (reason === 'similar_tags') return 'You might like'
  return null
}

export type ExperienceV3ArtistWorksSliderProps = {
  currentProduct: ShopifyProduct | null
  catalog: ShopifyProduct[]
  lampProductId: string
  artistSlug?: string | null
  artistVendor?: string | null
  previewProductId?: string | null
  cartProductIds: string[]
  onPreview: (product: ShopifyProduct) => void
  onQuickAdd: (product: ShopifyProduct) => void
  lockedArtworkPrices?: Record<string, number>
  streetLadderPrices?: Record<string, number>
  streetPricingSeasonFallback?: 1 | 2
}

export function ExperienceV3ArtistWorksSlider({
  currentProduct,
  catalog,
  lampProductId,
  artistSlug,
  artistVendor,
  previewProductId,
  cartProductIds,
  onPreview,
  onQuickAdd,
  lockedArtworkPrices,
  streetLadderPrices,
  streetPricingSeasonFallback = 2,
}: ExperienceV3ArtistWorksSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [artistProfile, setArtistProfile] = useState<ArtistProfileApiResponse | null>(null)

  useEffect(() => {
    if (!artistSlug?.trim()) {
      setArtistProfile(null)
      return
    }
    let cancelled = false
    const q = artistVendor?.trim() ? `?vendor=${encodeURIComponent(artistVendor)}` : ''
    fetch(`/api/shop/artists/${encodeURIComponent(artistSlug)}${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: ArtistProfileApiResponse) => {
        if (!cancelled) setArtistProfile(data)
      })
      .catch(() => {
        if (!cancelled) setArtistProfile(null)
      })
    return () => {
      cancelled = true
    }
  }, [artistSlug, artistVendor])

  const items = useMemo(
    () =>
      buildExperienceRelatedArtworkSlider({
        current: currentProduct,
        catalog,
        lampProductId,
        artistVendor: artistVendor ?? undefined,
        artistBio: artistProfile?.bio,
        artistProducts: artistProfile?.products ?? [],
        limit: 18,
      }),
    [currentProduct, catalog, lampProductId, artistVendor, artistProfile?.bio, artistProfile?.products]
  )

  const activeArtworkId = previewProductId ?? currentProduct?.id ?? null

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = 0
  }, [activeArtworkId])

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.72), behavior: 'smooth' })
  }

  if (!currentProduct || currentProduct.id === lampProductId || items.length <= 1) {
    return null
  }

  const vendorLabel = (artistVendor ?? currentProduct.vendor ?? 'this artist').trim()

  return (
    <section
      className="relative z-0 w-full shrink-0 border-t border-border bg-experience-surface py-8 md:py-10"
      aria-labelledby="experience-v3-artist-works-heading"
    >
      <div className="mx-auto w-full max-w-[min(100%,1200px)] px-3 md:px-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-experience-title/80">
              Explore the collection
            </p>
            <h2
              id="experience-v3-artist-works-heading"
              className="mt-1 font-serif text-xl font-semibold text-foreground md:text-2xl"
            >
              Works by {vendorLabel}
            </h2>
            <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-muted-foreground">
              Start with your selection, then browse more from the artist and pieces with a similar feel.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Scroll artworks left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Scroll artworks right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="touch-pan-x flex gap-3 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map(({ product, reason, matchedTags }) => {
            const img =
              getShopifyImageUrl(product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url, 480) ??
              product.featuredImage?.url ??
              product.images?.edges?.[0]?.node?.url ??
              null
            const price = experienceArtworkUnitUsd(product, {
              lockedUsdByProductId: lockedArtworkPrices,
              streetLadderUsdByProductId: streetLadderPrices,
              seasonBandsFallback: streetPricingSeasonFallback,
            })
            const inCart = cartProductIds.includes(product.id)
            const isPreview = previewProductId === product.id
            const badge = reasonLabel(reason, matchedTags)
            const displayTitle = capitalizeFirstLetter(product.title)

            return (
              <article
                key={product.id}
                className={cn(
                  'group relative w-[min(42vw,168px)] shrink-0 sm:w-[180px]',
                  isPreview && 'z-[1]'
                )}
              >
                <button
                  type="button"
                  onClick={() => onPreview(product)}
                  className={cn(
                    'block w-full overflow-hidden rounded-2xl border text-left transition-colors',
                    isPreview
                      ? 'border-experience-highlight/50 ring-1 ring-experience-highlight/30'
                      : 'border-border hover:border-border/80'
                  )}
                >
                  <div className="relative aspect-[14/20] w-full bg-experience-surface">
                    {img ? (
                      <Image
                        src={img}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        sizes="180px"
                        unoptimized
                      />
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
                  <div className="space-y-0.5 bg-experience-surface-2 px-2.5 py-2.5">
                    <p className="line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
                      {displayTitle}
                    </p>
                    {price > 0 ? (
                      <p className="text-[11px] tabular-nums text-experience-highlight">
                        ${formatPriceCompact(price)}
                      </p>
                    ) : null}
                  </div>
                </button>
                {product.availableForSale !== false ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!inCart) onQuickAdd(product)
                    }}
                    className={cn(
                      'absolute bottom-[3.25rem] right-2 z-10 transition-transform',
                      getExperienceQuickAddFabClass(inCart),
                      !inCart && 'hover:scale-105'
                    )}
                    aria-label={inCart ? `${displayTitle} added to cart` : `Add ${displayTitle} to cart`}
                    aria-pressed={inCart}
                  >
                    {inCart ? (
                      <Check className={experienceQuickAddFabIconClass} strokeWidth={2.5} aria-hidden />
                    ) : (
                      <Plus className={experienceQuickAddFabIconClass} strokeWidth={2.5} aria-hidden />
                    )}
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
