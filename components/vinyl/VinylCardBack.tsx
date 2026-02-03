/**
 * VinylCardBack
 * 
 * The back face (B-side) of a vinyl artwork card.
 * Displays artist notes, edition details, and additional information.
 * 
 * Styled to feel like the back of a vinyl record sleeve.
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Award, Calendar, Hash, User, MapPin, Tag } from 'lucide-react'

export interface VinylCardBackProps {
  /** Artist name */
  artistName?: string
  /** Artist notes/statement */
  artistNotes?: string
  /** Edition number */
  editionNumber?: number
  /** Total editions */
  editionTotal?: number
  /** Edition type (e.g., "Artist Proof", "Limited") */
  editionType?: string
  /** Series name */
  seriesName?: string
  /** Purchase date */
  purchaseDate?: Date | string
  /** Price display */
  price?: string
  /** Location/origin */
  location?: string
  /** Additional tags */
  tags?: string[]
  /** Whether this is a collector view (shows different info) */
  isCollectorView?: boolean
  /** Additional className */
  className?: string
  /** Children for custom content */
  children?: React.ReactNode
}

export const VinylCardBack = React.forwardRef<HTMLDivElement, VinylCardBackProps>(
  (
    {
      artistName,
      artistNotes,
      editionNumber,
      editionTotal,
      editionType,
      seriesName,
      purchaseDate,
      price,
      location,
      tags,
      isCollectorView = false,
      className,
      children,
    },
    ref
  ) => {
    const formattedDate = purchaseDate 
      ? new Date(purchaseDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null

    return (
      <div
        ref={ref}
        data-flip-back
        className={cn(
          'absolute inset-0 rounded-[24px] overflow-hidden',
          'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
          'text-white p-6',
          'backface-hidden',
          className
        )}
        style={{ transform: 'rotateY(180deg)' }}
      >
        {/* Vinyl texture overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header - Edition Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {editionNumber && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                  <Hash className="w-3 h-3" />
                  <span className="text-xs font-bold">
                    {editionNumber}{editionTotal ? `/${editionTotal}` : ''}
                  </span>
                </div>
              )}
              {editionType && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {editionType}
                </span>
              )}
            </div>
            {!isCollectorView && price && (
              <span className="text-lg font-bold text-amber-400">
                {price}
              </span>
            )}
          </div>

          {/* Artist Info */}
          {artistName && (
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-200">
                {artistName}
              </span>
            </div>
          )}

          {/* Artist Notes */}
          {artistNotes && (
            <div className="flex-1 overflow-y-auto mb-4">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "{artistNotes}"
              </p>
            </div>
          )}

          {/* Series Info */}
          {seriesName && (
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                {seriesName}
              </span>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">
                {location}
              </span>
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-[10px] text-slate-400"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer - Purchase Info (Collector View) */}
          {isCollectorView && formattedDate && (
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Acquired {formattedDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Custom children */}
          {children}
        </div>

        {/* Decorative vinyl grooves */}
        <div className="absolute -right-20 -bottom-20 w-48 h-48 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
          </svg>
        </div>
      </div>
    )
  }
)

VinylCardBack.displayName = 'VinylCardBack'
