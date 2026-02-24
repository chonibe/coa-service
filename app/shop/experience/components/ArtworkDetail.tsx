'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Check, ChevronRight, ChevronDown, User } from 'lucide-react'
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
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  )
  const constraintsRef = useRef<HTMLDivElement>(null)
  const dragX = useMotionValue(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const fn = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const price = product.priceRange?.minVariantPrice?.amount
    ? `$${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`
    : ''
  const artist = product.vendor || ''
  const isSoldOut = !product.availableForSale
  const description = product.description || ''

  const firstVariant = product.variants?.edges?.[0]?.node
  const quantityAvailable = typeof firstVariant?.quantityAvailable === 'number' ? firstVariant.quantityAvailable : undefined
  const editionSize = product.metafields?.find((m) => m && m.namespace === 'custom' && m.key === 'edition_size')?.value
  const editionSizeNum = editionSize ? parseInt(editionSize, 10) : null

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
        className="fixed inset-0 z-[70] flex items-end md:items-stretch md:justify-start pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 md:left-0 md:top-0 md:bottom-0 md:right-auto md:w-[60%] bg-black/40 backdrop-blur-sm pointer-events-auto"
        />

        <motion.div
          initial={isDesktop ? { x: '-100%' } : { y: '100%' }}
          animate={{ x: 0, y: 0 }}
          exit={isDesktop ? { x: '-100%' } : { y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative z-10 w-full md:w-[420px] max-h-[90dvh] md:max-h-full md:h-full bg-white md:rounded-r-2xl md:rounded-tl-none rounded-t-2xl overflow-hidden flex flex-col shadow-xl pointer-events-auto"
        >
          {/* Top info: vendor/title, then scarcity bar */}
          <div className="flex-shrink-0 border-b border-neutral-100 relative">
            {/* Vendor + title */}
            <div className="flex items-center justify-center px-4 pt-4 pb-2 relative">
              <div className="md:hidden w-10 h-1 bg-neutral-300 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
              <div className="flex flex-col items-center justify-center text-center min-w-0 flex-1">
                {artist && (
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider truncate max-w-full">
                    {artist}
                  </p>
                )}
                <h2 className="text-base font-semibold text-neutral-900 tracking-tight truncate max-w-full mt-0.5">
                  {product.title}
                </h2>
                {isSoldOut && (
                  <div className="flex items-center justify-center mt-1">
                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      Sold out
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Scarcity bar — under vendor/title */}
            <div className="px-4 pb-3 overflow-visible">
              <ScarcityBadge
                quantityAvailable={quantityAvailable}
                editionSize={editionSizeNum}
                availableForSale={product.availableForSale}
                variant="bar"
                productId={product.id}
                productImage={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null}
                productTitle={product.title}
              />
            </div>
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
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImageIndex(i)}
                          className={cn(
                            'w-[4px] h-[4px] min-w-0 min-h-0 p-0 rounded-full transition-all shrink-0',
                            i === imageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                          )}
                          style={{ width: 4, height: 4 }}
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
