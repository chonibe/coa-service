'use client'

import Image from 'next/image'
import { Instagram, Sparkles } from 'lucide-react'
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

interface ArtistSpotlightBannerProps {
  spotlight: SpotlightData
  /** Products in the selector that match this spotlight (for artwork icons) */
  spotlightProducts: Array<{
    id: string
    title: string
    handle?: string
    vendor?: string
    featuredImage?: { url?: string } | null
    images?: { edges?: Array<{ node?: { url?: string } }> } | null
    priceRange?: { minVariantPrice?: { amount?: string } } | null
  }>
  /** Called when banner is clicked — (isExpanding) filter when true, remove filter when false */
  onSelect?: (isExpanding: boolean) => void
  /** When true, show "Artist Spotlight" or "Early access" badge (e.g. in selector) */
  showBadge?: boolean
}

export function ArtistSpotlightBanner({
  spotlight,
  spotlightProducts,
  onSelect,
  showBadge = false,
}: ArtistSpotlightBannerProps) {
  return (
    <div className="relative">
      <style>{`
        @keyframes spotlight-border {
          from { stroke-dashoffset: 956; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .spotlight-border-path { animation: none !important; }
        }
      `}</style>
      {/* SVG stroke — light segment travels around the border */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        viewBox="0 0 400 280"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="spotlight-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFBA94" stopOpacity="0" />
            <stop offset="15%" stopColor="#FFBA94" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#FFBA94" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#FFBA94" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#FFBA94" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFBA94" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="spotlight-fade-unlisted" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0" />
            <stop offset="15%" stopColor="#A78BFA" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#C4B5FD" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#C4B5FD" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#A78BFA" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="398"
          height="278"
          rx="11"
          ry="11"
          fill="none"
          stroke={spotlight.unlisted ? 'url(#spotlight-fade-unlisted)' : 'url(#spotlight-fade)'}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeDasharray="320 158 320 158"
          className="spotlight-border-path"
          style={{ animation: 'spotlight-border 14s linear infinite' }}
        />
      </svg>

      {/* Always expanded card — larger artist image, responsive container */}
      <div
        className={cn(
          'relative z-10 w-full rounded-xl text-center overflow-hidden',
          'bg-neutral-100 dark:bg-[#201c1c]/80'
        )}
      >
        <div className="flex flex-col items-center p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
            {/* Artist image — centered */}
            <div className="flex-shrink-0 w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-xl overflow-hidden bg-neutral-200 dark:bg-[#262222] mx-auto">
              {spotlight.image ? (
                <Image
                  src={getShopifyImageUrl(spotlight.image, 416) ?? spotlight.image}
                  alt={spotlight.vendorName}
                  width={208}
                  height={208}
                  className="object-cover w-full h-full"
                  sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 208px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500" />
                </div>
              )}
            </div>
            {/* Artist info + optional GIF */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  {showBadge && (
                    <span
                      className={cn(
                        'text-[10px] font-medium uppercase tracking-wider',
                        spotlight.unlisted ? 'text-violet-600 dark:text-violet-400' : 'text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {spotlight.unlisted ? 'Early access' : 'Artist Spotlight'}
                    </span>
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold text-[#FFBA94]">
                    {spotlight.vendorName}
                  </h3>
                  {spotlight.seriesName && (
                    <p className="text-sm text-neutral-500 dark:text-[#c4a0a0]">
                      {spotlight.seriesName}
                    </p>
                  )}
                  {spotlight.instagram && (
                    <a
                      href={`https://instagram.com/${spotlight.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-[#c4a0a0] hover:text-pink-600 dark:hover:text-pink-400 transition-colors mt-1"
                    >
                      <Instagram className="w-4 h-4 flex-shrink-0" />
                      <span>@{spotlight.instagram}</span>
                    </a>
                  )}
                </div>
                {/* GIF if available */}
                {spotlight.gifUrl && (
                  <div className="w-full max-w-[140px] sm:max-w-[160px] sm:flex-shrink-0 rounded-xl overflow-hidden aspect-video mx-auto sm:mx-0" aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={spotlight.gifUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Bio — always visible */}
          {spotlight.bio && (
            <div className="pt-4 sm:pt-5 mt-2 sm:mt-0 border-t border-neutral-200/60 dark:border-white/10 w-full text-center">
              <p className="text-sm sm:text-base text-neutral-600 dark:text-[#d4b8b8] leading-relaxed whitespace-pre-line">
                {spotlight.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
