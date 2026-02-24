'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { X, Check, ChevronLeft, ChevronRight, ChevronDown, User } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { ScarcityBadge } from './ScarcityBadge'

interface ArtistData {
  name: string
  slug: string
  bio?: string
  image?: string
}

interface ArtworkDetailProps {
  product: ShopifyProduct
  isSelected: boolean
  onToggleSelect: () => void
  onClose: () => void
}

const artistCache = new Map<string, ArtistData | null>()

export function ArtworkDetail({ product, isSelected, onToggleSelect, onClose }: ArtworkDetailProps) {
  const images = product.images?.edges?.map((e) => e.node) ?? []
  const fallbackImage = product.featuredImage
  const allImages = images.length > 0 ? images : fallbackImage ? [fallbackImage] : []

  const [imageIndex, setImageIndex] = useState(0)
  const [artistData, setArtistData] = useState<ArtistData | null>(null)
  const [artistLoading, setArtistLoading] = useState(false)
  const [showArtistBio, setShowArtistBio] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const dragX = useMotionValue(0)

  const price = product.priceRange?.minVariantPrice?.amount
    ? `$${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`
    : ''
  const artist = product.vendor || ''
  const isSoldOut = !product.availableForSale
  const description = product.description || ''

  const quantityAvailable = product.variants?.edges?.[0]?.node?.availableForSale
    ? undefined
    : undefined

  const slug = artist.toLowerCase().replace(/\s+/g, '-')

  useEffect(() => {
    if (!artist) return

    if (artistCache.has(slug)) {
      setArtistData(artistCache.get(slug) || null)
      return
    }

    let cancelled = false
    setArtistLoading(true)
    fetch(`/api/shop/artists/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          artistCache.set(slug, data)
          setArtistData(data)
          setArtistLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          artistCache.set(slug, null)
          setArtistLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [artist, slug])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'ArrowLeft') setImageIndex((i) => (i - 1 + allImages.length) % allImages.length)
      if (e.key === 'ArrowRight') setImageIndex((i) => (i + 1) % allImages.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, allImages.length])

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (allImages.length <= 1) return
    if (info.offset.x < -50) setImageIndex((i) => (i + 1) % allImages.length)
    else if (info.offset.x > 50) setImageIndex((i) => (i - 1 + allImages.length) % allImages.length)
  }, [allImages.length])

  const currentImage = allImages[imageIndex]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end md:items-stretch md:justify-end"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative z-10 w-full md:w-[420px] max-h-[90dvh] md:max-h-full md:h-full bg-white md:rounded-none rounded-t-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <div className="md:hidden w-10 h-1 bg-neutral-300 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Artwork Details</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Swipeable image gallery */}
            {allImages.length > 0 && (
              <div ref={constraintsRef} className="relative aspect-square bg-neutral-50 mx-4 rounded-lg overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={imageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    drag={allImages.length > 1 ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    style={{ x: dragX }}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                  >
                    {currentImage && (
                      <Image
                        src={currentImage.url}
                        alt={currentImage.altText || product.title}
                        fill
                        className="object-cover pointer-events-none"
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setImageIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-colors z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImageIndex((i) => (i + 1) % allImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-colors z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIndex(i)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            i === imageIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                          )}
                          aria-label={`Image ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 px-4 mt-3 overflow-x-auto scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={cn(
                      'w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors',
                      i === imageIndex ? 'border-neutral-900' : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `Image ${i + 1}`}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product info */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {product.title}
              </h2>
              {artist && (
                <p className="text-sm text-neutral-500 mt-1">by {artist}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-medium text-neutral-900">{price}</span>
                {isSoldOut && (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Sold Out
                  </span>
                )}
              </div>
            </div>

            {/* Scarcity indicator */}
            <div className="px-4 pb-3">
              <ScarcityBadge
                quantityAvailable={quantityAvailable}
                availableForSale={product.availableForSale}
                variant="full"
              />
            </div>

            {/* Description */}
            {description && (
              <div className="px-4 pb-3">
                <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {product.tags.slice(0, 10).map((tag) => (
                  <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* About the Artist */}
            {artist && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowArtistBio(!showArtistBio)}
                  className="w-full flex items-center justify-between py-3 border-t border-neutral-100 group"
                >
                  <div className="flex items-center gap-3">
                    {artistData?.image ? (
                      <Image
                        src={artistData.image}
                        alt={artistData.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      About {artistData?.name || artist}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-neutral-400 transition-transform',
                    showArtistBio && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {showArtistBio && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {artistLoading ? (
                        <div className="py-4 flex justify-center">
                          <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin" />
                        </div>
                      ) : artistData?.bio ? (
                        <div className="pb-3 space-y-3">
                          <p className="text-sm text-neutral-600 leading-relaxed">{artistData.bio}</p>
                          <Link
                            href={`/shop/artists/${slug}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            View all works <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400 pb-3">No bio available for this artist.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sticky action bar */}
          <div className="flex-shrink-0 p-4 border-t border-neutral-100">
            <button
              onClick={onToggleSelect}
              disabled={isSoldOut && !isSelected}
              className={cn(
                'w-full h-12 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                isSelected
                  ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                  : isSoldOut
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-950 text-white hover:bg-neutral-800'
              )}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to order &mdash; Tap to remove
                </>
              ) : isSoldOut ? (
                'Sold Out'
              ) : (
                <>Add to order &mdash; {price}</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
