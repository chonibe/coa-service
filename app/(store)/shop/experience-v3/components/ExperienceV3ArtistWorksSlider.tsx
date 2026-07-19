'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import {
  buildExperienceRelatedArtworkSlider,
  type RelatedArtworkReason,
} from '@/lib/shop/experience-related-artworks'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { ExperienceArtworkGridCard } from '../../experience/components/ExperienceArtworkGridCard'

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
        artistOnly: true,
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
      className="relative z-0 w-full shrink-0 border-t border-border bg-experience-surface pt-8 md:pt-10"
      aria-labelledby="experience-v3-artist-works-heading"
    >
      <div className="mx-auto w-full max-w-[min(100%,1200px)] px-3 md:px-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2
              id="experience-v3-artist-works-heading"
              className="font-serif text-xl font-semibold text-foreground md:text-2xl"
            >
              Works by {vendorLabel}
            </h2>
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
          /* pan-x pan-y: allow vertical page scroll while finger is over this strip (touch-pan-x alone blocks it) */
          className="flex gap-3 overflow-x-auto overscroll-x-contain pb-2 [touch-action:pan-x_pan-y] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map(({ product, reason, matchedTags }) => {
            const productKey = normalizeShopifyProductId(product.id) ?? product.id
            const inCart = cartProductIds.some(
              (id) => (normalizeShopifyProductId(id) ?? id) === productKey
            )
            const isPreview = previewProductId === product.id
            const badge = reasonLabel(reason, matchedTags)

            return (
              <ExperienceArtworkGridCard
                key={product.id}
                product={product}
                layout="slider"
                isPreview={isPreview}
                isInCart={inCart}
                onPreview={onPreview}
                onQuickAdd={onQuickAdd}
                badge={badge}
                lockedArtworkPrices={lockedArtworkPrices}
                streetLadderPrices={streetLadderPrices}
                streetPricingSeasonFallback={streetPricingSeasonFallback}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
