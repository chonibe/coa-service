'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Product Series Info Component — Enhanced (Track B2)
 * 
 * Displays series information on product pages with two modes:
 * - Guest: "Part of [Series Name] (5 artworks)" with series thumbnail grid
 * - Authenticated collector: "You own 2/5 — complete the series" with progress bar
 * 
 * Graceful degradation if auth is unavailable.
 */

interface ProductSeriesInfoProps {
  series: {
    id: string
    name: string
    description: string | null
    thumbnail_url: string | null
    vendor_name: string
    total_artworks: number
    current_position: number
  }
  collectorProgress?: {
    owned_count: number
    total_artworks: number
    owned_percentage: number
  } | null
  /** Optional series member thumbnails for the mini grid */
  seriesThumbnails?: Array<{
    id: string
    image_url: string | null
    title: string
    is_owned?: boolean
  }>
  className?: string
}

export function ProductSeriesInfo({ 
  series, 
  collectorProgress,
  seriesThumbnails,
  className 
}: ProductSeriesInfoProps) {
  const hasProgress = collectorProgress && collectorProgress.owned_count > 0
  const isComplete = collectorProgress?.owned_percentage === 100
  const isGuest = !collectorProgress

  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-gradient-to-br from-[#f5f5f5] to-[#fafafa]',
        'border border-[#1a1a1a]/10',
        'rounded-[16px]',
        'transition-all duration-300',
        'hover:border-[#047AFF]/30 hover:shadow-md',
        className
      )}
    >
      <Link href={`/shop/series/${series.id}`} className="block p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Series Thumbnail */}
          {series.thumbnail_url && (
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-[12px] overflow-hidden bg-white shadow-sm">
              <img
                src={series.thumbnail_url}
                alt={series.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          {/* Series Info */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#047AFF]/10 rounded-full">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#047AFF"
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="text-xs font-medium text-[#047AFF]">
                  Part of a Series
                </span>
              </div>
              {isComplete && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0a8754]/10 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a8754" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-medium text-[#0a8754]">Complete!</span>
                </div>
              )}
            </div>

            {/* Series Name */}
            <h3 className="font-heading text-base sm:text-lg font-semibold text-[#1a1a1a] mb-1 group-hover:text-[#047AFF] transition-colors">
              {series.name}
            </h3>

            {/* Stats — Different display for guests vs authenticated collectors */}
            <div className="flex items-center flex-wrap gap-3 text-sm text-[#1a1a1a]/60">
              {isGuest ? (
                /* Guest view: simple artwork count */
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  {series.total_artworks} Artwork{series.total_artworks !== 1 ? 's' : ''} in this series
                </span>
              ) : (
                /* Authenticated view: ownership progress */
                <>
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    {series.total_artworks} Artwork{series.total_artworks !== 1 ? 's' : ''}
                  </span>

                  {hasProgress && (
                    <>
                      <span className="text-[#1a1a1a]/20">&bull;</span>
                      <span className="flex items-center gap-1.5 text-[#0a8754] font-medium">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        You own {collectorProgress!.owned_count} of {collectorProgress!.total_artworks}
                        {!isComplete && ' — complete the series'}
                      </span>
                    </>
                  )}

                  {!hasProgress && collectorProgress && (
                    <>
                      <span className="text-[#1a1a1a]/20">&bull;</span>
                      <span className="text-[#f0c417] font-medium">
                        Start collecting this series
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Progress Bar (authenticated collectors with progress) */}
            {hasProgress && collectorProgress!.owned_percentage > 0 && (
              <div className="mt-3">
                <div className="relative h-1.5 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                      isComplete
                        ? 'bg-gradient-to-r from-[#0a8754] to-[#0cc46e]'
                        : 'bg-gradient-to-r from-[#047AFF] to-[#4a6cf7]'
                    )}
                    style={{ width: `${collectorProgress!.owned_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-[#1a1a1a]/50 mt-1.5">
                  {collectorProgress!.owned_percentage}% Complete
                </p>
              </div>
            )}

            {/* Series Thumbnail Grid (guest mode: shows what's in the series) */}
            {isGuest && seriesThumbnails && seriesThumbnails.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                {seriesThumbnails.slice(0, 5).map((thumb) => (
                  <div
                    key={thumb.id}
                    className="w-8 h-8 rounded-md overflow-hidden bg-[#f5f5f5] border border-white shadow-sm"
                    title={thumb.title}
                  >
                    {thumb.image_url ? (
                      <img
                        src={thumb.image_url}
                        alt={thumb.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#e5e5e5]" />
                    )}
                  </div>
                ))}
                {seriesThumbnails.length > 5 && (
                  <span className="text-xs text-[#1a1a1a]/50 ml-1">
                    +{seriesThumbnails.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* View Collection Link */}
            <div className="flex items-center gap-1.5 mt-3 text-sm font-medium text-[#047AFF] group-hover:gap-2 transition-all">
              <span>{isGuest ? 'View Collection' : (hasProgress ? 'See Your Progress' : 'View Collection')}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
