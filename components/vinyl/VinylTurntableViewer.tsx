/**
 * VinylTurntableViewer
 * 
 * Full-screen immersive viewing mode for artwork.
 * Like placing a record on a turntable for focused listening.
 * 
 * Features:
 * - GSAP Flip animation from card position to fullscreen
 * - Immersive backdrop blur
 * - Detailed artwork information panel
 * - Drag-off to close or click backdrop
 */

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, ZoomIn, ZoomOut, RotateCw, ExternalLink, ShoppingCart } from 'lucide-react'
import { gsap, Flip, durations, customEases } from '@/lib/animations'
import { useGSAP } from '@gsap/react'

export interface VinylTurntableViewerProps {
  /** Whether the viewer is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Image URL */
  image: string
  /** Image alt text */
  imageAlt?: string
  /** Title */
  title: string
  /** Artist name */
  artistName?: string
  /** Artist statement/notes */
  artistNotes?: string
  /** Price */
  price?: string
  /** Edition info */
  editionNumber?: number
  editionTotal?: number
  editionType?: string
  /** Series info */
  seriesName?: string
  /** Product link */
  href?: string
  /** Add to cart handler */
  onAddToCart?: () => void
  /** Whether product is available */
  available?: boolean
  /** Source element for FLIP animation */
  sourceElement?: Element | null
  /** Children for additional content */
  children?: React.ReactNode
  /** Additional className */
  className?: string
}

export const VinylTurntableViewer = React.forwardRef<HTMLDivElement, VinylTurntableViewerProps>(
  (
    {
      isOpen,
      onClose,
      image,
      imageAlt,
      title,
      artistName,
      artistNotes,
      price,
      editionNumber,
      editionTotal,
      editionType,
      seriesName,
      href,
      onAddToCart,
      available = true,
      sourceElement,
      children,
      className,
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const imageContainerRef = React.useRef<HTMLDivElement>(null)
    const [zoom, setZoom] = React.useState(1)
    const [rotation, setRotation] = React.useState(0)

    // GSAP Flip animation when opening
    useGSAP(() => {
      if (!isOpen || !sourceElement || !imageContainerRef.current) return

      // Capture the source element state
      const state = Flip.getState(sourceElement)

      // Animate from source to target
      Flip.from(state, {
        targets: imageContainerRef.current,
        duration: durations.flip,
        ease: customEases.vinylFlip,
        scale: true,
        absolute: true,
      })
    }, { dependencies: [isOpen, sourceElement] })

    // Close on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Prevent scroll when open
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
    const handleRotate = () => setRotation((r) => r + 90)
    const handleReset = () => {
      setZoom(1)
      setRotation(0)
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'fixed inset-0 z-[100]',
              'bg-black/90 backdrop-blur-xl',
              className
            )}
            onClick={onClose}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-12 h-12 rounded-full',
                'bg-white/10 hover:bg-white/20',
                'flex items-center justify-center',
                'text-white transition-colors'
              )}
              aria-label="Close viewer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Content */}
            <div 
              className="h-full flex flex-col lg:flex-row items-center justify-center gap-8 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Section */}
              <div className="relative flex-1 max-w-2xl w-full flex items-center justify-center">
                {/* Turntable base effect */}
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-50 blur-3xl"
                  style={{ transform: 'scale(1.5)' }}
                />

                {/* Image Container */}
                <motion.div
                  ref={imageContainerRef}
                  className="relative rounded-[24px] overflow-hidden shadow-2xl"
                  animate={{
                    scale: zoom,
                    rotate: rotation,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <img
                    src={image}
                    alt={imageAlt || title}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    onDoubleClick={handleReset}
                  />

                  {/* Vinyl grooves overlay (subtle) */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.02]"
                    style={{
                      background: `repeating-radial-gradient(
                        circle at center,
                        transparent 0px,
                        transparent 5px,
                        black 5px,
                        black 6px
                      )`,
                    }}
                  />
                </motion.div>

                {/* Zoom/Rotate Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="text-white/70 text-sm min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-white/20 mx-2" />
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                    aria-label="Rotate"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info Panel */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-full lg:w-96 bg-white/10 backdrop-blur-lg rounded-[24px] p-6 text-white"
              >
                {/* Header */}
                <div className="mb-6">
                  {artistName && (
                    <p className="text-sm text-white/60 uppercase tracking-wider mb-1">
                      {artistName}
                    </p>
                  )}
                  <h2 className="font-heading text-2xl font-bold">{title}</h2>
                  
                  {/* Edition Badge */}
                  {editionNumber && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                        #{editionNumber}{editionTotal ? `/${editionTotal}` : ''}
                      </span>
                      {editionType && (
                        <span className="text-sm text-amber-400 uppercase tracking-wider">
                          {editionType}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Artist Notes */}
                {artistNotes && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
                      Artist Statement
                    </h3>
                    <p className="text-sm text-white/80 leading-relaxed italic">
                      "{artistNotes}"
                    </p>
                  </div>
                )}

                {/* Series */}
                {seriesName && (
                  <div className="mb-6 p-4 bg-white/5 rounded-xl">
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      Part of
                    </span>
                    <p className="text-sm font-semibold mt-1">{seriesName}</p>
                  </div>
                )}

                {/* Custom content */}
                {children}

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {price && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Price</span>
                      <span className="text-2xl font-bold">{price}</span>
                    </div>
                  )}

                  {onAddToCart && available && (
                    <button
                      type="button"
                      onClick={onAddToCart}
                      className={cn(
                        'w-full py-4 px-6 rounded-full',
                        'bg-[#f0c417] text-[#1a1a1a]',
                        'font-semibold text-base',
                        'hover:bg-[#e0b415] active:scale-[0.98]',
                        'transition-all duration-200',
                        'flex items-center justify-center gap-2'
                      )}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  )}

                  {!available && (
                    <div className="w-full py-4 px-6 rounded-full bg-white/10 text-center">
                      <span className="text-white/60 font-medium">Sold Out</span>
                    </div>
                  )}

                  {href && (
                    <a
                      href={href}
                      className={cn(
                        'w-full py-3 px-6 rounded-full',
                        'border border-white/30 text-white',
                        'font-medium text-sm',
                        'hover:bg-white/10',
                        'transition-all duration-200',
                        'flex items-center justify-center gap-2'
                      )}
                    >
                      View Full Details
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

VinylTurntableViewer.displayName = 'VinylTurntableViewer'
