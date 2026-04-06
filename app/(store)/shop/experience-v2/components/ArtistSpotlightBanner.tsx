'use client'

import Image from 'next/image'
import { Instagram, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn, formatPriceCompact } from '@/lib/utils'
import type { FeaturedBundleFilterOffer } from './FilterPanel'

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
  /** URL from collection metafield custom.video — artist promo clip above artwork carousel */
  videoUrl?: string
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

/** Collection GIF outside the spotlight card (e.g. above edition/scarcity). */
export function SpotlightCollectionGif({
  gifUrl,
  className,
}: {
  gifUrl: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full max-w-[min(100%,240px)] sm:max-w-[280px] rounded-xl overflow-hidden aspect-video mx-auto',
        className
      )}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gifUrl} alt="" className="w-full h-full object-cover" />
    </div>
  )
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
  /** When true, no outer ring / nested card fill — sits flush inside a parent panel (e.g. horizontal detail gallery) */
  embedded?: boolean
  /** Lamp + 2 spotlight prints bundle CTA (selector + inline experience banner) */
  featuredBundleOffer?: FeaturedBundleFilterOffer | null
}

export function ArtistSpotlightBanner({
  spotlight,
  spotlightProducts,
  onSelect,
  showBadge = false,
  expanded = true,
  embedded = false,
  featuredBundleOffer,
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
        'relative w-full overflow-hidden text-center',
        embedded ? 'rounded-none ring-0' : 'rounded-xl ring-1 ring-inset',
        !embedded &&
          (spotlight.unlisted
            ? 'ring-violet-400/35 dark:ring-violet-400/28'
            : 'ring-[#FFBA94]/35 dark:ring-[#FFBA94]/28')
      )}
    >
      {/* Card — collapsible when onSelect provided */}
      <div
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={isCollapsible ? (e) => e.key === 'Enter' && handleClick() : undefined}
        className={cn(
          'relative w-full text-center overflow-hidden',
          embedded
            ? 'rounded-none bg-transparent'
            : 'rounded-xl bg-neutral-100 dark:bg-[#201c1c]/80',
          !embedded && isCollapsible && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#262222]/80 transition-colors',
          embedded && isCollapsible && 'cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-white/5 transition-colors'
        )}
      >
        {isExpanded ? (
          /* Expanded: square image, bio (GIF rendered outside card via SpotlightCollectionGif) */
          <div className="relative flex flex-col items-center p-4 sm:p-6">
            {isCollapsible && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(false)
                }}
                aria-label="Collapse spotlight"
                className={cn(
                  'absolute right-1 top-1 z-10 sm:right-2 sm:top-2',
                  'inline-flex items-center justify-center p-2 transition-colors',
                  'text-neutral-500 hover:text-neutral-900 active:opacity-80',
                  'dark:text-[#b8a0a0] dark:hover:text-[#f0e8e8]',
                  spotlight.unlisted &&
                    'text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200'
                )}
              >
                <ChevronUp className="w-5 h-5 shrink-0" strokeWidth={2.5} aria-hidden />
              </button>
            )}
            <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
              <div className="flex flex-col items-center gap-1 sm:gap-2 w-full text-center">
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
                  <p className="text-base text-neutral-500 dark:text-[#c4a0a0]">{spotlight.seriesName}</p>
                )}
              </div>
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
            </div>
            {(spotlight.bio || spotlight.instagram) && (
              <div className="pt-4 sm:pt-5 mt-2 sm:mt-0 w-full text-center">
                {spotlight.bio && (
                  <p className="text-sm sm:text-[0.9375rem] text-neutral-600 dark:text-[#d4b8b8] leading-relaxed whitespace-pre-line max-w-prose mx-auto">
                    {spotlight.bio}
                  </p>
                )}
                {spotlight.instagram && (
                  <a
                    href={`https://instagram.com/${spotlight.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-[#c4a0a0] hover:text-pink-600 dark:hover:text-pink-400 transition-colors',
                      spotlight.bio ? 'mt-3' : 'mt-0'
                    )}
                  >
                    <Instagram className="w-4 h-4 shrink-0" />
                    <span>@{spotlight.instagram}</span>
                  </a>
                )}
              </div>
            )}
            {featuredBundleOffer ? (
              <div
                className={cn(
                  'mt-4 w-full max-w-sm rounded-xl border p-3 text-left',
                  spotlight.unlisted
                    ? 'border-violet-400/35 bg-violet-950/20'
                    : 'border-amber-200/80 bg-amber-50/90 dark:border-[#FFBA94]/35 dark:bg-[#2a2420]/90'
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <p
                  className={cn(
                    'mb-2 text-xs font-semibold uppercase tracking-wider',
                    spotlight.unlisted ? 'text-violet-200' : 'text-amber-900 dark:text-[#FFBA94]'
                  )}
                >
                  Featured artist bundle
                </p>
                <button
                  type="button"
                  disabled={featuredBundleOffer.disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    featuredBundleOffer.onApply()
                  }}
                  className={cn(
                    'w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                    featuredBundleOffer.disabled
                      ? 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-[#3a3434] dark:text-[#8a8080]'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-[#FFBA94] dark:text-[#171515] dark:hover:bg-[#ffc8a8]'
                  )}
                >
                  Get {featuredBundleOffer.vendorName} bundle — ${formatPriceCompact(featuredBundleOffer.bundleUsd)}
                </button>
                <p className="mt-2 text-xs text-neutral-600 dark:text-[#c4a0a0] leading-snug">
                  <span className="line-through tabular-nums text-neutral-500 dark:text-[#b89090]">
                    ${formatPriceCompact(featuredBundleOffer.compareAtUsd)}
                  </span>{' '}
                  <span className="text-neutral-500 dark:text-[#b89090]">regular</span> for lamp + 2 prints
                </p>
              </div>
            ) : null}
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
        {featuredBundleOffer && !isExpanded ? (
          <div
            className={cn(
              'border-t px-3 py-3',
              spotlight.unlisted ? 'border-violet-500/25' : 'border-neutral-200 dark:border-white/10'
            )}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              disabled={featuredBundleOffer.disabled}
              onClick={(e) => {
                e.stopPropagation()
                featuredBundleOffer.onApply()
              }}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors sm:text-sm',
                featuredBundleOffer.disabled
                  ? 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-[#3a3434] dark:text-[#8a8080]'
                  : spotlight.unlisted
                    ? 'bg-violet-600 text-white hover:bg-violet-500'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-[#FFBA94] dark:text-[#171515] dark:hover:bg-[#ffc8a8]'
              )}
            >
              Get {featuredBundleOffer.vendorName} bundle — ${formatPriceCompact(featuredBundleOffer.bundleUsd)}
            </button>
            <p className="mt-1.5 text-center text-[10px] text-neutral-500 dark:text-[#b89090] sm:text-xs">
              <span className="line-through tabular-nums">${formatPriceCompact(featuredBundleOffer.compareAtUsd)}</span> regular
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
