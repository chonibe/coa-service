'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Product Series Info Component
 * 
 * Displays series information on product pages (Card Design - Option B).
 * Shows series name, progress, thumbnail, and link to browse series.
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
  className?: string
}

export function ProductSeriesInfo({ 
  series, 
  collectorProgress,
  className 
}: ProductSeriesInfoProps) {
  const hasProgress = collectorProgress && collectorProgress.owned_count > 0

  return (
    <div
      className={cn(
        'group relative overflow-hidden',
        'bg-gradient-to-br from-[#f5f5f5] to-[#fafafa]',
        'border border-[#1a1a1a]/10',
        'rounded-[16px]',
        'transition-all duration-300',
        'hover:border-[#2c4bce]/30 hover:shadow-md',
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2c4bce]/10 rounded-full">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2c4bce"
                  strokeWidth="2"
                  className="flex-shrink-0"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="text-xs font-medium text-[#2c4bce]">
                  Part of a Series
                </span>
              </div>
            </div>

            {/* Series Name */}
            <h3 className="font-heading text-base sm:text-lg font-semibold text-[#1a1a1a] mb-1 group-hover:text-[#2c4bce] transition-colors">
              {series.name}
            </h3>

            {/* Stats */}
            <div className="flex items-center flex-wrap gap-3 text-sm text-[#1a1a1a]/60">
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
                  <span className="text-[#1a1a1a]/20">•</span>
                  <span className="flex items-center gap-1.5 text-[#0a8754] font-medium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    You own {collectorProgress.owned_count} of {collectorProgress.total_artworks}
                  </span>
                </>
              )}
            </div>

            {/* Progress Bar (if collector has progress) */}
            {hasProgress && collectorProgress.owned_percentage > 0 && (
              <div className="mt-3">
                <div className="relative h-1.5 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0a8754] to-[#0cc46e] rounded-full transition-all duration-500"
                    style={{ width: `${collectorProgress.owned_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-[#1a1a1a]/50 mt-1.5">
                  {collectorProgress.owned_percentage}% Complete
                </p>
              </div>
            )}

            {/* View Collection Link */}
            <div className="flex items-center gap-1.5 mt-3 text-sm font-medium text-[#2c4bce] group-hover:gap-2 transition-all">
              <span>View Collection</span>
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
