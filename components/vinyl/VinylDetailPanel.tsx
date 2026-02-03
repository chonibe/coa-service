/**
 * VinylDetailPanel Component
 * 
 * Expanded detail panel shown when an artwork is placed on the turntable viewer.
 * Displays comprehensive artwork information in a vinyl-record themed layout.
 * 
 * Features:
 * - Artist information and bio
 * - Edition details and rarity
 * - Certificate preview
 * - Purchase/ownership information
 * - Collector provenance (for owned works)
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp, scaleFade } from '@/lib/animations/framer-variants'

export interface VinylDetailPanelProps {
  /** Artwork details */
  artwork: {
    id: string
    title: string
    artist: {
      name: string
      bio?: string
      avatar?: string
    }
    description?: string
    image: string
    price?: number
    compareAtPrice?: number
    /** Edition info for limited editions */
    edition?: {
      current: number
      total: number
      type: 'limited' | 'open' | 'unique'
    }
    /** Series info if part of a collection */
    series?: {
      name: string
      artworksCount: number
    }
    /** Purchase date if owned */
    purchaseDate?: Date
    /** Certificate preview URL */
    certificatePreview?: string
  }
  /** Whether panel is visible */
  isOpen: boolean
  /** Close handler */
  onClose?: () => void
  /** Position: left or right of the turntable */
  position?: 'left' | 'right'
  /** Additional class names */
  className?: string
}

export function VinylDetailPanel({
  artwork,
  isOpen,
  onClose,
  position = 'right',
  className,
}: VinylDetailPanelProps) {
  const panelVariants = {
    hidden: {
      opacity: 0,
      x: position === 'right' ? 50 : -50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      x: position === 'right' ? 50 : -50,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'w-80 max-h-[80vh] overflow-y-auto',
            'bg-gradient-to-b from-zinc-900 to-zinc-950',
            'border border-zinc-800 rounded-2xl',
            'shadow-2xl shadow-black/50',
            'p-6',
            className
          )}
        >
          {/* Header with close button */}
          <motion.div 
            variants={itemVariants}
            className="flex items-start justify-between mb-6"
          >
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                {artwork.title}
              </h2>
              <p className="text-sm text-zinc-400">
                by {artwork.artist.name}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 -mt-1 -mr-1 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                aria-label="Close panel"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </motion.div>

          {/* Artist Section */}
          {artwork.artist.bio && (
            <motion.section variants={itemVariants} className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                About the Artist
              </h3>
              <div className="flex items-start gap-3">
                {artwork.artist.avatar && (
                  <img
                    src={artwork.artist.avatar}
                    alt={artwork.artist.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-4">
                  {artwork.artist.bio}
                </p>
              </div>
            </motion.section>
          )}

          {/* Edition Info */}
          {artwork.edition && (
            <motion.section variants={itemVariants} className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Edition
              </h3>
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Edition Type</span>
                  <span className="text-sm font-medium text-white capitalize">
                    {artwork.edition.type}
                  </span>
                </div>
                {artwork.edition.type === 'limited' && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-zinc-400">Number</span>
                      <span className="text-sm font-medium text-white">
                        #{artwork.edition.current} of {artwork.edition.total}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(artwork.edition.current / artwork.edition.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {artwork.edition.total - artwork.edition.current} editions remaining
                    </p>
                  </>
                )}
              </div>
            </motion.section>
          )}

          {/* Series Info */}
          {artwork.series && (
            <motion.section variants={itemVariants} className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Series
              </h3>
              <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    {artwork.series.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {artwork.series.artworksCount} artworks in collection
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                    <path
                      d="M4 5h12M4 10h12M4 15h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.section>
          )}

          {/* Price Info */}
          {artwork.price && (
            <motion.section variants={itemVariants} className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Price
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  ${artwork.price.toLocaleString()}
                </span>
                {artwork.compareAtPrice && artwork.compareAtPrice > artwork.price && (
                  <span className="text-sm text-zinc-500 line-through">
                    ${artwork.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </motion.section>
          )}

          {/* Purchase Info (for owned artworks) */}
          {artwork.purchaseDate && (
            <motion.section variants={itemVariants} className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Ownership
              </h3>
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-500">
                    <path
                      d="M13.333 4L6 11.333 2.667 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm font-medium text-emerald-400">
                    In Your Collection
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Acquired on {artwork.purchaseDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </motion.section>
          )}

          {/* Certificate Preview */}
          {artwork.certificatePreview && (
            <motion.section variants={itemVariants}>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Certificate of Authenticity
              </h3>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
                <img
                  src={artwork.certificatePreview}
                  alt="Certificate preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs text-white/80 text-center">
                    View full certificate in your collection
                  </p>
                </div>
              </div>
            </motion.section>
          )}

          {/* Description */}
          {artwork.description && (
            <motion.section variants={itemVariants} className="mt-6 pt-6 border-t border-zinc-800">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                About This Work
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {artwork.description}
              </p>
            </motion.section>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
