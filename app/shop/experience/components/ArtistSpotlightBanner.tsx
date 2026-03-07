'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Instagram, Sparkles } from 'lucide-react'
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
}

export function ArtistSpotlightBanner({
  spotlight,
  spotlightProducts,
  onSelect,
}: ArtistSpotlightBannerProps) {
  const [expanded, setExpanded] = useState(false)

  const firstImage = (p: (typeof spotlightProducts)[0]) =>
    p?.featuredImage?.url ?? p?.images?.edges?.[0]?.node?.url

  const twoArtworks = spotlightProducts.slice(0, 2)

  const handleClick = () => {
    const willBeExpanded = !expanded
    setExpanded(willBeExpanded)
    onSelect?.(willBeExpanded)
  }

  return (
    <div className="mb-3 relative">
      <style>{`
        @keyframes spotlight-border {
          from { stroke-dashoffset: 956; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .spotlight-border-path { animation: none !important; }
        }
      `}</style>
      {/* SVG stroke — light segment travels around the border (collapsed only) */}
      {!expanded && (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        viewBox="0 0 400 72"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="spotlight-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(251,191,36)" stopOpacity="0" />
            <stop offset="15%" stopColor="rgb(251,191,36)" stopOpacity="0.5" />
            <stop offset="35%" stopColor="rgb(251,191,36)" stopOpacity="0.95" />
            <stop offset="65%" stopColor="rgb(251,191,36)" stopOpacity="0.95" />
            <stop offset="85%" stopColor="rgb(251,191,36)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(251,191,36)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="398"
          height="70"
          rx="11"
          ry="11"
          fill="none"
          stroke="url(#spotlight-fade)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="320 158 320 158"
          className="spotlight-border-path"
          style={{ animation: 'spotlight-border 14s linear infinite' }}
        />
      </svg>
      )}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'relative z-10 w-full rounded-xl transition-all duration-300 text-left overflow-hidden',
          'bg-neutral-100 dark:bg-[#201c1c]/80 hover:bg-neutral-200/80 dark:hover:bg-[#262222]/80',
          expanded ? 'p-0' : 'px-3 py-2.5'
        )}
      >
        {/* Collapsed row */}
        {!expanded && (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 dark:bg-[#262222]">
              {spotlight.image ? (
                <Image
                  src={spotlight.image}
                  alt={spotlight.vendorName}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Artist Spotlight</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-[#f0e8e8] truncate">
                {spotlight.vendorName}
              </p>
              {spotlight.seriesName && (
                <p className="text-[11px] text-neutral-500 dark:text-[#c4a0a0] truncate">
                  {spotlight.seriesName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {twoArtworks.map((p) => (
                <div
                  key={p.id}
                  className="w-8 h-8 rounded-md overflow-hidden"
                >
                  {firstImage(p) ? (
                    <Image
                      src={firstImage(p)!}
                      alt={p.title}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      sizes="32px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[8px]">–</div>
                  )}
                </div>
              ))}
            </div>
            <ChevronDown className="w-5 h-5 flex-shrink-0 text-neutral-500 transition-transform duration-300 rotate-0" />
          </div>
        )}

        {/* Expanded card: large profile, title, description */}
        {expanded && (
          <div className="flex flex-col">
            <div className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-200 dark:bg-[#262222]">
                {spotlight.image ? (
                  <Image
                    src={spotlight.image}
                    alt={spotlight.vendorName}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-amber-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Artist Spotlight
                </p>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-[#f0e8e8]">
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
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-[#c4a0a0] hover:text-pink-600 dark:hover:text-pink-400 transition-colors mt-1"
                  >
                    <Instagram className="w-4 h-4 flex-shrink-0" />
                    <span>@{spotlight.instagram}</span>
                  </a>
                )}
              </div>
              <ChevronDown className="w-5 h-5 flex-shrink-0 text-neutral-500 rotate-180 transition-transform duration-300" />
            </div>
            {spotlight.bio && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-sm text-neutral-600 dark:text-[#d4b8b8] leading-relaxed whitespace-pre-line">
                  {spotlight.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  )
}
