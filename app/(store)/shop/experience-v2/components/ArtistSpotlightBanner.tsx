'use client'

import Image from 'next/image'
import { Instagram, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn } from '@/lib/utils'

export interface SpotlightData {
  vendorName: string
  vendorSlug: string
  bio?: string
  image?: string
  /** Instagram handle (without @) from collection metafield or vendor profile */
  instagram?: string
  productIds: string[]
  seriesName?: string
  /** URL from collection metafield custom.gif — when set, show GIF image */
  gifUrl?: string
  /** When true, collection is unlisted (early access); card uses distinct glow and artworks show "Early access" */
  unlisted?: boolean
}

type SpotlightProduct = {
  id: string
  title: string
  handle?: string
  vendor?: string
  featuredImage?: { url?: string } | null
  images?: { edges?: Array<{ node?: { url?: string } }> } | null
  priceRange?: { minVariantPrice?: { amount?: string } } | null
}

function getProductImage(p: SpotlightProduct): string | null {
  return p.featuredImage?.url ?? p.images?.edges?.[0]?.node?.url ?? null
}

interface ArtistSpotlightBannerProps {
  spotlight: SpotlightData
  /** Products in the selector that match this spotlight (for artwork thumbnails) */
  spotlightProducts: SpotlightProduct[]
  /** Called when banner is clicked — (isExpanding) filter when true, remove filter when false */
  onSelect?: (isExpanding: boolean) => void
  /** When true, show "Artist Spotlight" or "Early access" badge (e.g. in selector) */
  showBadge?: boolean
  /** When true, show expanded view (full card with bio). When false, show collapsed (compact with thumbnails). When onSelect provided, click toggles. */
  expanded?: boolean
}

export function ArtistSpotlightBanner({
  spotlight,
  spotlightProducts,
  onSelect,
  showBadge = false,
  expanded = true,
}: ArtistSpotlightBannerProps) {
  const isCollapsible = !!onSelect
  const isExpanded = isCollapsible ? expanded : true

  const handleClick = () => {
    if (!onSelect) return
    onSelect(!isExpanded)
  }

  const thumbnails = spotlightProducts.slice(0, 4)

  return (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden text-center',
        'ring-1 ring-inset',
        spotlight.unlisted
          ? 'ring-violet-400/35 dark:ring-violet-400/28'
          : 'ring-[#FFBA94]/35 dark:ring-[#FFBA94]/28'
      )}
    >
      {/* Card — collapsible when onSelect provided */}
      <div
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={isCollapsible ? (e) => e.key === 'Enter' && handleClick() : undefined}
        className={cn(
          'relative w-full rounded-xl text-center overflow-hidden',
          'bg-neutral-100 dark:bg-[#201c1c]/80',
          isCollapsible && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#262222]/80 transition-colors'
        )}
      >
        {isExpanded ? (
          /* Expanded: full card with artist image, bio, optional GIF */
          <div className="flex flex-col items-center p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
              <div
                className={cn(
                  'relative mx-auto w-full max-w-full shrink-0 overflow-hidden rounded-xl bg-neutral-200 dark:bg-[#262222]',
                  'aspect-square'
                )}
              >
                {spotlight.image ? (
                  <Image
                    src={getShopifyImageUrl(spotlight.image, 1024) ?? spotlight.image}
                    alt={spotlight.vendorName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) min(92vw, 360px), min(65vh, 520px)"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    {showBadge && (
                      <span
                        className={cn(
                          'text-xs font-medium uppercase tracking-wider',
                          spotlight.unlisted ? 'text-violet-600 dark:text-violet-400' : 'text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {spotlight.unlisted ? 'Early access' : 'Artist Spotlight'}
                      </span>
                    )}
                    <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-[#FFBA94]">
                      {spotlight.vendorName}
                    </h3>
                    {spotlight.seriesName && (
                      <p className="text-base text-neutral-500 dark:text-[#c4a0a0]">
                        {spotlight.seriesName}
                      </p>
                    )}
                    {spotlight.instagram && (
                      <a
                        href={`https://instagram.com/${spotlight.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-base text-neutral-600 dark:text-[#c4a0a0] hover:text-pink-600 dark:hover:text-pink-400 transition-colors mt-1"
                      >
                        <Instagram className="w-4 h-4 flex-shrink-0" />
                        <span>@{spotlight.instagram}</span>
                      </a>
                    )}
                  </div>
                  {spotlight.gifUrl && (
                    <div className="w-full max-w-[140px] sm:max-w-[160px] sm:flex-shrink-0 rounded-xl overflow-hidden aspect-video mx-auto sm:mx-0" aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={spotlight.gifUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              {/* Artwork thumbnails */}
              {thumbnails.length > 0 && (
                <div className="flex gap-2 justify-center flex-wrap">
                  {thumbnails.map((p) => {
                    const img = getProductImage(p)
                    return (
                      <div
                        key={p.id}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-neutral-200 dark:bg-[#262222] shrink-0"
                      >
                        {img ? (
                          <Image
                            src={getShopifyImageUrl(img, 128) ?? img}
                            alt={p.title}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-amber-500/50" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {spotlight.bio && (
              <div className="pt-4 sm:pt-5 mt-2 sm:mt-0 border-t border-neutral-200/60 dark:border-white/10 w-full text-center">
                <p className="text-base sm:text-lg text-neutral-600 dark:text-[#d4b8b8] leading-relaxed whitespace-pre-line">
                  {spotlight.bio}
                </p>
              </div>
            )}
            {isCollapsible && (
              <div className="pt-2 flex items-center justify-center gap-1 text-neutral-500 dark:text-[#c4a0a0]">
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm">Tap to collapse & show all artists</span>
              </div>
            )}
          </div>
        ) : (
          /* Collapsed: compact row with artist image, name, artwork thumbnails */
          <div className="flex items-center gap-3 p-3">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-neutral-200 dark:bg-[#262222]">
              {spotlight.image ? (
                <Image
                  src={getShopifyImageUrl(spotlight.image, 128) ?? spotlight.image}
                  alt={spotlight.vendorName}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              {showBadge && (
                <span
                  className={cn(
                    'text-xs font-medium uppercase tracking-wider',
                    spotlight.unlisted ? 'text-violet-600 dark:text-violet-400' : 'text-amber-700 dark:text-amber-400'
                  )}
                >
                  {spotlight.unlisted ? 'Early access' : 'Artist Spotlight'}
                </span>
              )}
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-[#FFBA94] truncate">
                {spotlight.vendorName}
              </h3>
              {spotlight.seriesName && (
                <p className="text-sm text-neutral-500 dark:text-[#c4a0a0] truncate">
                  {spotlight.seriesName}
                </p>
              )}
            </div>
            {/* Artwork thumbnails */}
            {thumbnails.length > 0 && (
              <div className="flex gap-1.5 shrink-0">
                {thumbnails.map((p) => {
                  const img = getProductImage(p)
                  return (
                    <div
                      key={p.id}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-md overflow-hidden bg-neutral-200 dark:bg-[#262222]"
                    >
                      {img ? (
                        <Image
                          src={getShopifyImageUrl(img, 88) ?? img}
                          alt={p.title}
                          width={44}
                          height={44}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-amber-500/50" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <ChevronDown className="w-4 h-4 shrink-0 text-neutral-500 dark:text-[#c4a0a0]" aria-hidden />
          </div>
        )}
      </div>
    </div>
  )
}
