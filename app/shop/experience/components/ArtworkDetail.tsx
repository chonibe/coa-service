'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, animate, type PanInfo } from 'framer-motion'
import { Check, ChevronDown, User, ImageIcon, ZoomIn, ZoomOut, Package, Shield, RotateCcw, Lamp, Ruler, Cable, Plug, BookOpen, Magnet, List, Scale, Box, Sun, Battery, Zap, Gift, ShoppingBag, Globe } from 'lucide-react'
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
  /** Optional badges shown above What's included (e.g. guarantee, returns, shipping) */
  productBadges?: { label: string; icon: 'shield' | 'rotate' | 'globe' }[]
  /** When true, hide the scarcity bar (e.g. for lamp product) */
  hideScarcityBar?: boolean
  /** Optional list of what's included with icon (e.g. for lamp product) */
  productIncludes?: { label: string; icon: 'lamp' | 'ruler' | 'cable' | 'plug' | 'book' | 'magnet' | 'package' | 'gift' | 'bag' }[]
  /** Optional specifications sections with icon (e.g. Dimensions, Weight, Materials) */
  productSpecs?: { title: string; icon?: 'ruler' | 'scale' | 'box' | 'sun' | 'battery' | 'zap'; items: string[] }[]
}

const artistCache = new Map<string, ArtistData | null>()

export function ArtworkDetail({ product, isSelected, onToggleSelect, onClose, productBadges, productIncludes, productSpecs, hideScarcityBar }: ArtworkDetailProps) {
  const images = product.images?.edges?.map((e) => e.node) ?? []
  const fallbackImage = product.featuredImage
  const allImages = images.length > 0 ? images : fallbackImage ? [fallbackImage] : []

  const [imageIndex, setImageIndex] = useState(0)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [artistData, setArtistData] = useState<ArtistData | null>(null)
  const [artistLoading, setArtistLoading] = useState(false)
  const [showArtistBio, setShowArtistBio] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showSpecs, setShowSpecs] = useState(false)
  const [showIncludes, setShowIncludes] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  )
  const constraintsRef = useRef<HTMLDivElement>(null)
  const dragX = useMotionValue(0)
  const panX = useMotionValue(0)
  const panY = useMotionValue(0)

  useEffect(() => {
    setImageIndex(0)
    setShowDescription(false)
    setShowArtistBio(false)
    setShowSpecs(false)
    setShowIncludes(false)
    setImageZoom(1)
    setHasUserInteracted(false)
  }, [product.id])

  useEffect(() => {
    setImageZoom(1)
    panX.set(0)
    panY.set(0)
    dragX.set(0)
  }, [imageIndex, dragX])

  const handleZoomChange = useCallback(() => {
    setImageZoom((z) => {
      if (z === 1) {
        panX.set(0)
        panY.set(0)
        return 2
      }
      panX.set(0)
      panY.set(0)
      return 1
    })
  }, [panX, panY])

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
    fetch(`/api/shop/artists/${slug}${artist ? `?vendor=${encodeURIComponent(artist)}` : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          const valid = data && !data.error ? data : null
          artistCache.set(slug, valid)
          setArtistData(valid)
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

  const goToIndex = useCallback((i: number) => {
    setHasUserInteracted(true)
    setImageIndex(i)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'ArrowLeft') goToIndex((imageIndex - 1 + allImages.length) % allImages.length)
      if (e.key === 'ArrowRight') goToIndex((imageIndex + 1) % allImages.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, allImages.length, imageIndex, goToIndex])

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (allImages.length <= 1) return
      setHasUserInteracted(true)
      const velocity = info.velocity.x
      const offset = info.offset.x
      const threshold = 40
      const velocityThreshold = 150
      const shouldNext = offset < -threshold || velocity < -velocityThreshold
      const shouldPrev = offset > threshold || velocity > velocityThreshold
      if (shouldNext) {
        setImageIndex((i) => (i + 1) % allImages.length)
      } else if (shouldPrev) {
        setImageIndex((i) => (i - 1 + allImages.length) % allImages.length)
      } else {
        animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    },
    [allImages.length, dragX]
  )

  const currentImage = allImages[imageIndex]
  const showingArtistInCarousel = showArtistBio && !!artistData?.image

  // Auto-rotate slideshow when user hasn't interacted
  useEffect(() => {
    if (
      hasUserInteracted ||
      showingArtistInCarousel ||
      allImages.length <= 1
    )
      return
    const id = setInterval(() => {
      setImageIndex((i) => (i + 1) % allImages.length)
    }, 4000)
    return () => clearInterval(id)
  }, [hasUserInteracted, showingArtistInCarousel, allImages.length])

  const carouselImage = showingArtistInCarousel
    ? { url: artistData!.image!, altText: artistData!.name }
    : currentImage

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end md:items-center md:justify-start pointer-events-none"
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
          className="relative z-10 w-full md:w-[420px] max-h-[95dvh] md:h-[85vh] md:max-h-[85vh] bg-white md:rounded-r-2xl md:rounded-tl-none rounded-t-2xl overflow-hidden flex flex-col shadow-xl pointer-events-auto"
        >
          {/* Top: drag handle on mobile only */}
          <div className="flex-shrink-0 md:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-neutral-300 rounded-full" />
          </div>

          {/* Scrollable content — pb allows content to scroll behind the action bar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pt-4 pb-64">
            {/* Swipeable image gallery — shows artist image when About section is open */}
            {(allImages.length > 0 || (showArtistBio && artistData?.image)) && (
              <div
                ref={constraintsRef}
                className="relative aspect-[4/5] bg-neutral-50 mx-4 rounded-lg overflow-hidden"
              >
                <AnimatePresence initial={false} mode="sync">
                  <motion.div
                    key={showingArtistInCarousel ? `artist-${artistData?.image}` : `${imageIndex}-${currentImage?.url ?? ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    drag={imageZoom > 1 ? true : (!showingArtistInCarousel && allImages.length > 1 ? 'x' : false)}
                    dragConstraints={
                      imageZoom > 1
                        ? { left: -150, right: 150, top: -150, bottom: 150 }
                        : { left: -280, right: 280 }
                    }
                    dragElastic={imageZoom > 1 ? 0.1 : 0.2}
                    dragMomentum={false}
                    onDragEnd={imageZoom > 1 || showingArtistInCarousel ? undefined : handleDragEnd}
                    style={{
                      x: imageZoom > 1 ? panX : dragX,
                      y: imageZoom > 1 ? panY : 0,
                      scale: imageZoom,
                    }}
                    className={cn(
                      'absolute inset-0',
                      imageZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
                    )}
                  >
                    {carouselImage && (
                      <Image
                        key={carouselImage.url}
                        src={carouselImage.url}
                        alt={carouselImage.altText || product.title}
                        fill
                        className={cn(
                          imageZoom > 1 ? 'object-contain' : 'object-cover'
                        )}
                        sizes="(max-width: 768px) 100vw, 420px"
                        draggable={false}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Zoom button */}
                <button
                  type="button"
                  onClick={handleZoomChange}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                  aria-label={imageZoom > 1 ? 'Zoom out' : 'Zoom in'}
                >
                  {imageZoom > 1 ? (
                    <ZoomOut className="w-4 h-4" />
                  ) : (
                    <ZoomIn className="w-4 h-4" />
                  )}
                </button>

                {!showingArtistInCarousel && allImages.length > 1 && (
                  <>
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goToIndex(i)}
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
            {!showingArtistInCarousel && allImages.length > 1 && (
              <div className="flex gap-2 px-4 mt-3 overflow-x-auto scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToIndex(i)}
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

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="px-4 pt-6 pb-3 flex flex-wrap gap-1.5">
                {product.tags.slice(0, 10).map((tag) => (
                  <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* What's included (collapsible) */}
            {productIncludes && productIncludes.length > 0 && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => setShowIncludes(!showIncludes)}
                  className="w-full flex items-center justify-between py-3 border-t border-neutral-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      What&apos;s included
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-neutral-400 transition-transform',
                    showIncludes && 'rotate-180'
                  )} />
                </button>
                <AnimatePresence>
                  {showIncludes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pt-2 pb-1 justify-center">
                        {productIncludes.map((item, i) => {
                          const Icon = {
                            lamp: Lamp,
                            ruler: Ruler,
                            cable: Cable,
                            plug: Plug,
                            book: BookOpen,
                            magnet: Magnet,
                            package: Package,
                            gift: Gift,
                            bag: ShoppingBag,
                          }[item.icon]
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium"
                            >
                              <Icon className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                              {item.label}
                            </span>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Specifications (collapsible) */}
            {productSpecs && productSpecs.length > 0 && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => setShowSpecs(!showSpecs)}
                  className="w-full flex items-center justify-between py-3 border-t border-neutral-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <List className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      Specifications
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-neutral-400 transition-transform',
                    showSpecs && 'rotate-180'
                  )} />
                </button>
                <AnimatePresence>
                  {showSpecs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 pt-2 pb-1">
                        {productSpecs.map((spec, i) => {
                          const SpecIcon = spec.icon
                            ? { ruler: Ruler, scale: Scale, box: Box, sun: Sun, battery: Battery, zap: Zap }[spec.icon]
                            : List
                          const isSingleValue = spec.items.length === 1
                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <SpecIcon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                <h4 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                  {spec.title}
                                </h4>
                              </div>
                              {isSingleValue ? (
                                <p className="text-sm text-neutral-700 leading-snug">
                                  {spec.items[0]}
                                </p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {spec.items.map((item, j) => (
                                    <li key={j} className="text-sm text-neutral-700 leading-relaxed flex items-start gap-2">
                                      <span className="w-1 h-1 rounded-full bg-neutral-400 mt-1.5 flex-shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Description (expandable) — product description */}
            {description && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => {
                    setShowDescription(!showDescription)
                    if (!showDescription) setShowArtistBio(false)
                  }}
                  className="w-full flex items-center justify-between py-3 border-t border-neutral-100 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      Artwork details
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-neutral-400 transition-transform',
                    showDescription && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {showDescription && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-neutral-600 leading-relaxed pb-3">{description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* About the Artist — underneath Description */}
            {artist && (
              <div className="px-4 pb-3">
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
                        <div className="pb-3">
                          <p className="text-sm text-neutral-600 leading-relaxed">{artistData.bio}</p>
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

          {/* Sticky action bar — absolute overlay so content scrolls behind for glass effect */}
          <div className="absolute bottom-0 left-0 right-0 z-10 pt-0">
            {/* Scarcity bar — centered on top border */}
            {!hideScarcityBar && (
            <div className="absolute left-0 right-4 top-0 -translate-y-1/2 z-10">
              <ScarcityBadge
                quantityAvailable={quantityAvailable}
                editionSize={editionSizeNum}
                availableForSale={product.availableForSale}
                variant="bar"
                productId={product.id}
                productImage={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null}
                productTitle={product.title}
                className="w-full"
              />
            </div>
            )}
            <div
              className={cn('p-5 space-y-3 bg-white/80 backdrop-blur-lg border-t border-white/50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]', productBadges?.length ? 'pt-4' : 'pt-7')}
              style={{ backdropFilter: 'blur(16px) saturate(140%)', WebkitBackdropFilter: 'blur(16px) saturate(140%)' }}
            >
              {/* Guarantee / returns / shipping badges — one top, two bottom, close to vendor */}
              {productBadges && productBadges.length > 0 && (
                <div className="flex flex-col items-center gap-2 pb-1">
                  {productBadges.slice(0, 1).map((item, i) => {
                    const Icon = { shield: Shield, rotate: RotateCcw, globe: Globe }[item.icon]
                    const styles = item.icon === 'shield'
                      ? 'bg-emerald-50 text-emerald-800'
                      : item.icon === 'rotate'
                        ? 'bg-sky-50 text-sky-800'
                        : 'bg-violet-50 text-violet-800'
                    const iconStyles = item.icon === 'shield'
                      ? 'text-emerald-600'
                      : item.icon === 'rotate'
                        ? 'text-sky-600'
                        : 'text-violet-600'
                    return (
                      <span
                        key={i}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                          styles
                        )}
                      >
                        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', iconStyles)} />
                        {item.label}
                      </span>
                    )
                  })}
                  {productBadges.length > 1 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {productBadges.slice(1).map((item, i) => {
                        const Icon = { shield: Shield, rotate: RotateCcw, globe: Globe }[item.icon]
                        const styles = item.icon === 'shield'
                          ? 'bg-emerald-50 text-emerald-800'
                          : item.icon === 'rotate'
                            ? 'bg-sky-50 text-sky-800'
                            : 'bg-violet-50 text-violet-800'
                        const iconStyles = item.icon === 'shield'
                          ? 'text-emerald-600'
                          : item.icon === 'rotate'
                            ? 'text-sky-600'
                            : 'text-violet-600'
                        return (
                          <span
                            key={i}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                              styles
                            )}
                          >
                            <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', iconStyles)} />
                            {item.label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2 flex flex-col items-center text-center">
                <div className="flex flex-col items-center min-w-0 w-full">
                  {artist && (
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {artist}
                    </p>
                  )}
                  <h2 className="text-sm font-semibold text-neutral-900 tracking-tight mt-0.5">
                    {product.title}
                  </h2>
                  {editionSizeNum && editionSizeNum > 0 && (
                    <span className="mt-1 text-[10px] text-neutral-500 uppercase tracking-wider">
                      Limited Edition of {editionSizeNum}
                    </span>
                  )}
                  {isSoldOut && (
                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit mt-1">
                      Sold out
                    </span>
                  )}
                </div>
              </div>
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
