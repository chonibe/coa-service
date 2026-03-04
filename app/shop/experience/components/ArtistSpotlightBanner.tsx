'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SpotlightData {
  vendorName: string
  vendorSlug: string
  bio?: string
  image?: string
  productIds: string[]
  seriesName?: string
}

interface ArtistSpotlightBannerProps {
  spotlight: SpotlightData
  /** Products in the selector that match this spotlight (for the info card) */
  spotlightProducts: Array<{
    id: string
    title: string
    handle?: string
    vendor?: string
    featuredImage?: { url?: string } | null
    images?: { edges?: Array<{ node?: { url?: string } }> } | null
    priceRange?: { minVariantPrice?: { amount?: string } } | null
  }>
  /** Whether the spotlight filter is currently active */
  isFilterActive: boolean
  onToggleFilter: () => void
}

export function ArtistSpotlightBanner({
  spotlight,
  spotlightProducts,
  isFilterActive,
  onToggleFilter,
}: ArtistSpotlightBannerProps) {
  const [expanded, setExpanded] = useState(false)

  const firstImage = (p: (typeof spotlightProducts)[0]) =>
    p?.featuredImage?.url ?? p?.images?.edges?.[0]?.node?.url

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left',
          isFilterActive
            ? 'bg-amber-500/15 border-amber-500/40 dark:bg-amber-500/20 dark:border-amber-500/50'
            : 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80'
        )}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
          {spotlight.image ? (
            <Image
              src={spotlight.image}
              alt={spotlight.vendorName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Artist Spotlight</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
            {spotlight.vendorName}
          </p>
          {spotlight.seriesName && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {spotlight.seriesName}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 flex-shrink-0 text-neutral-500 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div
          className={cn(
            'mt-2 rounded-xl border overflow-hidden',
            'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
          )}
        >
          {/* Artist info card */}
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800">
            {spotlight.bio && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 mb-2">
                {spotlight.bio}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                onToggleFilter()
                setExpanded(false)
              }}
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                isFilterActive
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
            >
              {isFilterActive ? 'Showing spotlight artworks' : 'Filter to spotlight artworks'}
            </button>
          </div>

          {/* Artworks in this drop */}
          {spotlightProducts.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 px-1">
                Artworks in this drop
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {spotlightProducts.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative"
                  >
                    {firstImage(p) ? (
                      <Image
                        src={firstImage(p)!}
                        alt={p.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                        No image
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-[9px] font-medium text-white truncate">{p.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
