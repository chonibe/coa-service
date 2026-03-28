'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, animate, type PanInfo } from 'framer-motion'
import { Check, ChevronDown, ChevronLeft, ImageIcon, ZoomIn, ZoomOut, Package, Shield, RotateCcw, Lamp, Ruler, Cable, Plug, BookOpen, Magnet, List, Scale, Box, Sun, Battery, Zap, Gift, ShoppingBag, Globe, X } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn, formatPriceCompact } from '@/lib/utils'
import { ScarcityBadge } from './ScarcityBadge'
import { EditionBadgeForProduct } from './EditionBadge'
import { ArtworkEditionUnifiedSection } from './ArtworkEditionUnifiedSection'
import { ArtistSpotlightBanner, SpotlightCollectionGif, type SpotlightData } from './ArtistSpotlightBanner'
import { HorizontalTwoSlideGallery } from './HorizontalTwoSlideGallery'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { buildStreetLadderForScarcity } from '@/lib/shop/experience-street-ladder-display'

interface ArtistData {
  name: string
  slug: string
  bio?: string
  image?: string
  instagram?: string
}

interface ArtworkDetailProps {
  product: ShopifyProduct
  isSelected: boolean
  onToggleSelect: () => void
  onClose: () => void
  /** On desktop, use left slideout (next to lamp preview) instead of full-screen bottom sheet */
  isMobile?: boolean
  /** When true, full product details are still loading (show loading state) */
  isLoadingDetails?: boolean
  /** Optional badges shown above What's included (e.g. guarantee, returns, shipping) */
  productBadges?: { label: string; icon: 'shield' | 'rotate' | 'globe' }[]
  /** When true, hide the scarcity bar (e.g. for lamp product) */
  hideScarcityBar?: boolean
  /** Optional list of what's included with icon (e.g. for lamp product) */
  productIncludes?: { label: string; icon: 'lamp' | 'ruler' | 'cable' | 'plug' | 'book' | 'magnet' | 'package' | 'gift' | 'bag' }[]
  /** Optional specifications sections with icon (e.g. Dimensions, Weight, Materials) */
  productSpecs?: { title: string; icon?: 'ruler' | 'scale' | 'box' | 'sun' | 'battery' | 'zap'; items: string[] }[]
  /** Override add button label (e.g. "Add Lamp to order" for lamp product) */
  addToOrderLabel?: string
  /** When true, show "Collected" badge (user owns this from past orders) */
  isCollected?: boolean
  /** When true, show "New Drop" badge (part of artist spotlight) */
  isNewDrop?: boolean
  /** When true, show "Early access" badge (unlisted spotlight) instead of "New Drop" */
  isEarlyAccess?: boolean
  /** When true, render inline in a panel (no overlay/slideout) — for left-panel embedding on desktop */
  inline?: boolean
  /** When true, hide the add-to-order CTA button (e.g. for Experience V2 where selection is in picker) */
  hideCta?: boolean
  /** Override slug for artist fetch — use spotlight's vendorSlug when available so artist bio matches selector (e.g. jack-jc-art vs jack-j-c-art) */
  artistSlugOverride?: string
  /** When provided, use this spotlight data directly (includes gifUrl) — same as selector */
  spotlightDataOverride?: SpotlightData | null
  /** Street edition-states row for ladder copy in scarcity bar */
  streetEdition?: StreetEditionStatesRow | null
}

const artistCache = new Map<string, ArtistData | null>()
type SpotlightWithProducts = SpotlightData & { products?: ShopifyProduct[] }
const spotlightCache = new Map<string, SpotlightWithProducts | null>()

/** Horizontal gallery for artwork description + artist spotlight when both are present. */
function ArtworkArtistDetailGallery({
  description,
  artistLoading,
  spotlight,
  spotlightProducts,
  className,
  resetKey,
}: {
  description: string
  artistLoading: boolean
  spotlight: SpotlightData | null
  spotlightProducts: ShopifyProduct[]
  className?: string
  resetKey: string
}) {
  return (
    <div className={cn('py-3 border-t border-neutral-100 dark:border-white/10', className)}>
      <div className="relative rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/40 dark:bg-[#201c1c]/35 overflow-hidden">
        <HorizontalTwoSlideGallery
          resetKey={resetKey}
          ariaLabel="Artwork and artist details"
          first={
            <div className="px-3 sm:px-4 py-4 pl-9 sm:pl-10 pr-9 sm:pr-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
                </div>
                <span className="text-sm font-semibold text-neutral-800 dark:text-[#d4b8b8]">Artwork details</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed">{description}</p>
            </div>
          }
          second={
            <div className="px-3 sm:px-4 py-3 pl-9 sm:pl-10 pr-9 sm:pr-10">
              {artistLoading ? (
                <div className="py-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" />
                </div>
              ) : spotlight ? (
                <ArtistSpotlightBanner
                  embedded
                  spotlight={{ ...spotlight, gifUrl: undefined }}
                  spotlightProducts={spotlightProducts}
                />
              ) : null}
            </div>
          }
        />
      </div>
    </div>
  )
}

export function ArtworkDetail({ product, isSelected, onToggleSelect, onClose, isLoadingDetails = false, productBadges, productIncludes, productSpecs, hideScarcityBar, isMobile = true, addToOrderLabel = 'Add artwork to order', isCollected = false, isNewDrop = false, isEarlyAccess = false, inline = false, hideCta = false, artistSlugOverride, spotlightDataOverride, streetEdition = null }: ArtworkDetailProps) {
  const images = product.images?.edges?.map((e) => e.node) ?? []
  const fallbackImage = product.featuredImage
  const allImages = images.length > 0 ? images : fallbackImage ? [fallbackImage] : []
  const displayImages = allImages

  const [imageIndex, setImageIndex] = useState(0)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [artistData, setArtistData] = useState<ArtistData | null>(null)
  const [spotlightData, setSpotlightData] = useState<SpotlightWithProducts | null>(null)
  const [artistLoading, setArtistLoading] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showSpecs, setShowSpecs] = useState(false)
  const [showIncludes, setShowIncludes] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [isOpen, setIsOpen] = useState(true)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dragX = useMotionValue(0)
  const panX = useMotionValue(0)
  const panY = useMotionValue(0)

  useEffect(() => {
    setImageIndex(0)
    setShowDescription(false)
    setShowSpecs(false)
    setShowIncludes(false)
    setImageZoom(1)
    setHasUserInteracted(false)
    setIsOpen(true)
  }, [product.id])

  useEffect(() => {
    setImageZoom(1)
    panX.set(0)
    panY.set(0)
    dragX.set(0)
  }, [imageIndex, dragX])

  // Scroll hint — nudge down on open so user sees accordions below the image
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTop = 0
    // Wait for the sheet spring animation to settle before nudging
    const timer = setTimeout(() => {
      el.scrollTo({ top: 120, behavior: 'smooth' })
    }, 650)
    return () => clearTimeout(timer)
  }, [product.id])

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

  const originalPriceAmount = product.priceRange?.minVariantPrice?.amount
    ? parseFloat(product.priceRange.minVariantPrice.amount)
    : 0
  const discountedPriceAmount = isEarlyAccess && originalPriceAmount > 0
    ? Math.round(originalPriceAmount * 0.9 * 100) / 100
    : originalPriceAmount
  const price = originalPriceAmount > 0
    ? `$${formatPriceCompact(discountedPriceAmount)}`
    : ''
  const originalPrice = isEarlyAccess && originalPriceAmount > 0
    ? `$${formatPriceCompact(originalPriceAmount)}`
    : ''
  const artist = product.vendor || ''
  const isSoldOut = !product.availableForSale
  const description = product.description || ''

  const firstVariant = product.variants?.edges?.[0]?.node
  const quantityAvailable = typeof firstVariant?.quantityAvailable === 'number' ? firstVariant.quantityAvailable : undefined
  const editionSize = product.metafields?.find((m) => m && m.namespace === 'custom' && m.key === 'edition_size')?.value
  const editionSizeNum = editionSize ? parseInt(editionSize, 10) : null
  const isLampOrBundleProduct = Boolean(productIncludes && productIncludes.length > 0)
  const streetLadderBlock = useMemo(
    () =>
      !isLampOrBundleProduct
        ? buildStreetLadderForScarcity(product, streetEdition ?? null, isEarlyAccess)
        : null,
    [product, streetEdition, isEarlyAccess, isLampOrBundleProduct]
  )
  const editionArtistName = (
    artistData?.name ||
    spotlightDataOverride?.vendorName ||
    spotlightData?.vendorName ||
    artist
  ).trim()

  const spotlightGifUrl = spotlightDataOverride?.gifUrl ?? spotlightData?.gifUrl

  const productIdShort = product.id.replace(/^gid:\/\/shopify\/Product\//i, '') || product.id
  const spotlightForBanner: SpotlightData | null =
    spotlightDataOverride ??
    spotlightData ??
    (artistData
      ? {
          vendorName: artistData.name,
          vendorSlug: artistData.slug,
          bio: artistData.bio,
          image: artistData.image,
          instagram: artistData.instagram,
          productIds: [productIdShort],
        }
      : null)
  const spotlightProductsForBanner = spotlightDataOverride?.products ?? spotlightData?.products ?? [product]
  const showArtworkArtistGallery = Boolean(
    description.trim() && artist && (artistLoading || spotlightForBanner)
  )

  const slugFromVendor = artist.toLowerCase().replace(/\s+/g, '-')
  const slug = artistSlugOverride || slugFromVendor

  /** Slug variants for artist-spotlight (e.g. jack-j.c.-art → jack-jc-art, jack-j-c-art) — same source as selector */
  const spotlightSlugsToTry = useMemo(() => {
    const base = slug.replace(/\./g, '') // jack-j.c.-art → jack-jc-art
    const withJc = base.replace(/-j-c-/g, '-jc-') // jack-j-c-art → jack-jc-art
    const withJC = base.replace(/-jc-/g, '-j-c-') // jack-jc-art → jack-j-c-art
    const set = new Set([slug, base, withJc, withJC].filter(Boolean))
    return [...set]
  }, [slug])

  useEffect(() => {
    if (!artist && !artistSlugOverride) return

    if (artistCache.has(slug)) {
      setArtistData(artistCache.get(slug) || null)
      setSpotlightData(spotlightCache.get(slug) ?? null)
      return
    }

    let cancelled = false
    setArtistLoading(true)

    async function fetchSpotlight(): Promise<SpotlightWithProducts | null> {
      for (const s of spotlightSlugsToTry) {
        const r = await fetch(`/api/shop/artist-spotlight?artist=${encodeURIComponent(s)}`)
        const data = r.ok ? await r.json() : null
        if (data?.vendorName && (data.bio || data.image || data.instagram || data.gifUrl)) return data
      }
      return null
    }

    // Use artist-spotlight as primary (same source as selector) — ensures bio matches
    fetchSpotlight()
      .then(async (spot) => {
        if (cancelled) return
        let spotToUse = spot
        if (spot?.vendorName && !spot.bio?.trim()) {
          try {
            const r = await fetch(`/api/shop/artists/${slug}${artist ? `?vendor=${encodeURIComponent(artist)}` : ''}`)
            const data = r.ok ? await r.json() : null
            const a = data && !data.error ? data : null
            const extraBio = a?.bio?.trim()
            if (extraBio) {
              spotToUse = { ...spot, bio: extraBio }
            }
          } catch {
            /* keep spot */
          }
        }
        if (
          spotToUse &&
          (spotToUse.vendorName ||
            spotToUse.bio ||
            spotToUse.image ||
            spotToUse.instagram ||
            spotToUse.gifUrl)
        ) {
          const valid = {
            name: spotToUse.vendorName ?? artist,
            slug: spotToUse.vendorSlug ?? slug,
            bio: spotToUse.bio,
            image: spotToUse.image,
            instagram: spotToUse.instagram,
          }
          artistCache.set(slug, valid)
          spotlightCache.set(slug, spotToUse)
          setArtistData(valid)
          setSpotlightData(spotToUse)
        } else {
          // Fallback: artists API
          const r = await fetch(`/api/shop/artists/${slug}${artist ? `?vendor=${encodeURIComponent(artist)}` : ''}`)
          const data = r.ok ? await r.json() : null
          const a = data && !data.error ? data : null
          if (a && !cancelled) {
            artistCache.set(slug, a)
            spotlightCache.set(slug, null)
            setArtistData(a)
            setSpotlightData(null)
          } else {
            artistCache.set(slug, null)
            spotlightCache.set(slug, null)
            setArtistData(null)
            setSpotlightData(null)
          }
        }
        if (!cancelled) setArtistLoading(false)
      })
      .catch(async () => {
        if (cancelled) return
        try {
          const r = await fetch(`/api/shop/artists/${slug}${artist ? `?vendor=${encodeURIComponent(artist)}` : ''}`)
          const data = r.ok ? await r.json() : null
          const a = data && !data.error ? data : null
          if (a && !cancelled) {
            artistCache.set(slug, a)
            spotlightCache.set(slug, null)
            setArtistData(a)
            setSpotlightData(null)
          } else {
            artistCache.set(slug, null)
            spotlightCache.set(slug, null)
            setArtistData(null)
            setSpotlightData(null)
          }
        } catch {
          artistCache.set(slug, null)
          spotlightCache.set(slug, null)
          setArtistData(null)
          setSpotlightData(null)
        }
        if (!cancelled) setArtistLoading(false)
      })

    return () => { cancelled = true }
  }, [artist, slug, artistSlugOverride, spotlightSlugsToTry])

  const goToIndex = useCallback((i: number) => {
    setHasUserInteracted(true)
    setImageIndex(i)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])
  const handleExitComplete = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); handleClose() }
      if (e.key === 'ArrowLeft') goToIndex((imageIndex - 1 + displayImages.length) % displayImages.length)
      if (e.key === 'ArrowRight') goToIndex((imageIndex + 1) % displayImages.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, displayImages.length, imageIndex, goToIndex])

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (displayImages.length <= 1) return
      setHasUserInteracted(true)
      const velocity = info.velocity.x
      const offset = info.offset.x
      const threshold = 40
      const velocityThreshold = 150
      const shouldNext = offset < -threshold || velocity < -velocityThreshold
      const shouldPrev = offset > threshold || velocity > velocityThreshold
      if (shouldNext) {
        setImageIndex((i) => (i + 1) % displayImages.length)
      } else if (shouldPrev) {
        setImageIndex((i) => (i - 1 + displayImages.length) % displayImages.length)
      } else {
        animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 40 })
      }
    },
    [displayImages.length, dragX]
  )

  const currentImage = displayImages[imageIndex]

  // Auto-rotate slideshow when user hasn't interacted
  useEffect(() => {
    if (
      hasUserInteracted ||
      displayImages.length <= 1
    )
      return
    const id = setInterval(() => {
      setImageIndex((i) => (i + 1) % displayImages.length)
    }, 4000)
    return () => clearInterval(id)
  }, [hasUserInteracted, displayImages.length])

  const carouselImage = currentImage

  const isSlideout = !isMobile

  // Inline mode: render content in a panel (no overlay) — for left-panel embedding on desktop
  const renderDesktopContent = () => (
    <>
      {/* Left: Image carousel + thumbnails */}
      <div className="flex flex-col min-w-0 w-[48%] max-w-[420px] shrink-0">
        {displayImages.length > 0 && (
          <div ref={constraintsRef} className="relative flex-1 min-h-0 bg-neutral-100 dark:bg-[#1a1616] rounded-xl overflow-hidden shadow-inner">
            <AnimatePresence initial={false} mode="sync">
              <motion.div
                key={`${imageIndex}-${currentImage?.url ?? ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                drag={imageZoom > 1 ? true : (displayImages.length > 1 ? 'x' : false)}
                dragConstraints={imageZoom > 1 ? { left: -150, right: 150, top: -150, bottom: 150 } : { left: -280, right: 280 }}
                dragElastic={imageZoom > 1 ? 0.1 : 0.2}
                dragMomentum={false}
                onDragEnd={imageZoom > 1 ? undefined : handleDragEnd}
                style={{ x: imageZoom > 1 ? panX : dragX, y: imageZoom > 1 ? panY : 0, scale: imageZoom }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                {carouselImage && (
                  <Image key={carouselImage.url} src={carouselImage.url} alt={carouselImage.altText || product.title} fill className={imageZoom > 1 ? 'object-contain' : 'object-cover'} sizes="(max-width: 768px) 100vw, 480px" draggable={false} />
                )}
              </motion.div>
            </AnimatePresence>
            <button type="button" onClick={handleZoomChange} className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors" aria-label={imageZoom > 1 ? 'Zoom out' : 'Zoom in'}>
              {imageZoom > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            {displayImages.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                {displayImages.map((_, i) => (
                  <button key={i} onClick={() => goToIndex(i)} className={cn('w-[4px] h-[4px] min-w-0 min-h-0 p-0 rounded-full transition-all shrink-0', i === imageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70')} style={{ width: 4, height: 4 }} aria-label={`Image ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        )}
        {displayImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 flex-shrink-0">
            {displayImages.map((img, i) => (
              <button key={i} onClick={() => goToIndex(i)} className={cn('w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors', i === imageIndex ? 'border-neutral-900 dark:border-white' : 'border-transparent opacity-60 hover:opacity-100')}>
                <Image src={img.url} alt={img.altText || `Image ${i + 1}`} width={56} height={56} className="w-full h-full object-cover" loading="lazy" unoptimized />
              </button>
            ))}
          </div>
        )}
        {!isLampOrBundleProduct && !hideScarcityBar && editionSizeNum != null && editionSizeNum > 0 && (
          <div className="mt-4 rounded-xl border border-neutral-200/90 dark:border-[#3d3636] bg-neutral-50/80 dark:bg-[#1c1818]/60 px-4 py-4 w-full">
            <ScarcityBadge
              quantityAvailable={quantityAvailable}
              editionSize={editionSizeNum}
              availableForSale={product.availableForSale}
              variant="bar"
              productId={product.id}
              productImage={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null}
              productTitle={product.title}
              unifiedSection
              className="w-full"
              streetLadder={streetLadderBlock ?? undefined}
            />
          </div>
        )}
      </div>
      {/* Right: Product info — artist, title, add button */}
      <div className="flex-1 min-w-0 flex flex-col pl-2 overflow-hidden">
        <div
          data-experience-artwork-scroll
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 pb-8"
        >
          <div className="flex-shrink-0 pb-4 border-b border-neutral-100 dark:border-white/10">
            {artist && <p className="text-[11px] font-medium text-neutral-500 dark:text-[#c4a0a0] uppercase tracking-widest">{artist}</p>}
            <h2 className="text-lg font-semibold text-[#FFBA94] mt-0.5 leading-tight">{product.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {price && (
                <div className="flex items-center gap-2">
                  <span className={cn('text-base font-semibold', isEarlyAccess && 'text-violet-600 dark:text-violet-400')}>{price}</span>
                  {isEarlyAccess && originalPrice && <span className="text-sm text-neutral-400 dark:text-[#a09090] line-through">{originalPrice}</span>}
                </div>
              )}
              {isSoldOut && <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">Sold out</span>}
              {isCollected && !isSoldOut && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded"><Package className="w-3 h-3" strokeWidth={2} /> Collected</span>}
              {(isNewDrop || isEarlyAccess) && !isSoldOut && !isCollected && <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', isEarlyAccess ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30')}>{isEarlyAccess ? 'Early access' : 'New Drop'}</span>}
            </div>
          </div>
          {isLoadingDetails && (
            <div className="py-3 border-b border-neutral-100 dark:border-white/10 flex items-center gap-2 text-neutral-500 dark:text-[#c4a0a0]">
              <div className="w-4 h-4 border-2 border-neutral-300 dark:border-[#3e3838] border-t-neutral-600 dark:border-t-white rounded-full animate-spin" />
              <span className="text-xs">Loading details…</span>
            </div>
          )}
          {showArtworkArtistGallery ? (
            <>
              {!isLampOrBundleProduct && (
                <div className="py-3 border-b border-neutral-100 dark:border-white/10 space-y-3">
                  {spotlightGifUrl ? <SpotlightCollectionGif gifUrl={spotlightGifUrl} /> : null}
                  <ArtworkEditionUnifiedSection className="w-full">
                    <EditionBadgeForProduct
                      product={product}
                      artistName={editionArtistName}
                      unifiedSection
                      className="w-full"
                    />
                  </ArtworkEditionUnifiedSection>
                </div>
              )}
              <ArtworkArtistDetailGallery
                resetKey={product.id}
                description={description}
                artistLoading={artistLoading}
                spotlight={spotlightForBanner}
                spotlightProducts={spotlightProductsForBanner}
              />
            </>
          ) : (
            <>
              {!isLampOrBundleProduct && (
                <div className="py-3 border-b border-neutral-100 dark:border-white/10 space-y-3">
                  {spotlightGifUrl ? <SpotlightCollectionGif gifUrl={spotlightGifUrl} /> : null}
                  <ArtworkEditionUnifiedSection className="w-full">
                    <EditionBadgeForProduct
                      product={product}
                      artistName={editionArtistName}
                      unifiedSection
                      className="w-full"
                    />
                  </ArtworkEditionUnifiedSection>
                </div>
              )}
              {description.trim() && (
                <div className="py-3 border-b border-neutral-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowDescription(!showDescription)}
                    className="w-full flex items-center justify-between py-2.5 -my-2.5 px-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-[#FFBA94]">
                        Artwork details
                      </span>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform duration-200', showDescription && 'rotate-180')} />
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
                        <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed pt-1 pb-2">{description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {artist && (
                <div className="py-3 border-b border-neutral-100 dark:border-white/10">
                  {artistLoading ? (
                    <div className="py-4 flex justify-center"><div className="w-5 h-5 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" /></div>
                  ) : spotlightForBanner ? (
                    <ArtistSpotlightBanner
                      spotlight={{ ...spotlightForBanner, gifUrl: undefined }}
                      spotlightProducts={spotlightProductsForBanner}
                    />
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex-shrink-0 border-t border-neutral-100 dark:border-white/10 bg-white dark:bg-[#171515] pt-3 pb-5 space-y-3">
          {isLampOrBundleProduct && !hideScarcityBar && (
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
          )}
          {!hideCta && (
            <button onClick={onToggleSelect} disabled={isSoldOut && !isSelected} className={cn('w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', isSelected ? 'bg-neutral-100 dark:bg-[#201c1c] text-neutral-900 dark:text-[#f0e8e8] hover:bg-neutral-200 dark:hover:bg-[#262222]' : isSoldOut ? 'bg-neutral-100 dark:bg-[#201c1c] text-neutral-400 dark:text-[#b89090] cursor-not-allowed' : 'bg-[#047AFF] text-white hover:bg-[#0366d6]')}>
              {isSelected ? <><Check className="w-4 h-4" />Added to order — Tap to remove</> : isSoldOut ? 'Sold Out' : <>{addToOrderLabel} — {price}{isEarlyAccess && originalPrice && <span className="ml-1.5 text-xs line-through opacity-60">{originalPrice}</span>}</>}
            </button>
          )}
        </div>
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#171515] overflow-hidden">
        <button type="button" onClick={onClose} className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-white/10 text-sm font-medium text-neutral-600 dark:text-[#c4a0a0] hover:text-neutral-900 dark:hover:text-[#f0e8e8] transition-colors" aria-label="Browse artworks">
          <ChevronLeft className="w-4 h-4" />
          Browse artworks
        </button>
        <div className="flex-1 min-h-0 flex flex-row overflow-hidden gap-6 px-6 pt-5 pb-4">
          {renderDesktopContent()}
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
      <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed inset-0 z-[80] pointer-events-none',
          isSlideout ? 'flex justify-start items-center' : 'flex items-end'
        )}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />

        <motion.div
          initial={isSlideout ? { x: '-100%' } : { y: '100%' }}
          animate={isSlideout ? { x: 0 } : { y: 0 }}
          exit={isSlideout ? { x: '-100%' } : { y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            'relative z-10 bg-white dark:bg-[#171515] overflow-hidden flex flex-col shadow-xl pointer-events-auto',
            isSlideout ? 'w-full max-w-4xl h-[88dvh] rounded-r-2xl' : 'w-full max-h-[95dvh] rounded-t-2xl'
          )}
        >
          {/* Desktop: close button top-right */}
          {isSlideout && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Content: two-column on desktop, single scroll on mobile */}
          <div
            ref={!isSlideout ? scrollContainerRef : undefined}
            className={cn(
              'flex-1 min-h-0',
              isSlideout ? 'flex flex-row overflow-hidden gap-8 px-6 pt-5 pb-0' : 'overflow-y-auto overflow-x-hidden pt-4 pb-64'
            )}
          >
            {isSlideout ? (
              /* Desktop: left = carousel (48%), right = info (52%) */
              <>
                {/* Left: Image carousel + thumbnails — 48% for balanced artwork focus */}
                <div className="flex flex-col min-w-0 w-[48%] max-w-[420px] shrink-0">
                  {displayImages.length > 0 && (
                    <div
                      ref={constraintsRef}
                      className="relative flex-1 min-h-0 bg-neutral-100 dark:bg-[#1a1616] rounded-xl overflow-hidden shadow-inner"
                    >
                      <AnimatePresence initial={false} mode="sync">
                        <motion.div
                          key={`${imageIndex}-${currentImage?.url ?? ''}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          drag={imageZoom > 1 ? true : (displayImages.length > 1 ? 'x' : false)}
                          dragConstraints={
                            imageZoom > 1
                              ? { left: -150, right: 150, top: -150, bottom: 150 }
                              : { left: -280, right: 280 }
                          }
                          dragElastic={imageZoom > 1 ? 0.1 : 0.2}
                          dragMomentum={false}
                          onDragEnd={imageZoom > 1 ? undefined : handleDragEnd}
                          style={{
                            x: imageZoom > 1 ? panX : dragX,
                            y: imageZoom > 1 ? panY : 0,
                            scale: imageZoom,
                          }}
                          className="absolute inset-0 cursor-grab active:cursor-grabbing"
                        >
                          {carouselImage && (
                            <Image
                              key={carouselImage.url}
                              src={carouselImage.url}
                              alt={carouselImage.altText || product.title}
                              fill
                              className={imageZoom > 1 ? 'object-contain' : 'object-cover'}
                              sizes="(max-width: 768px) 100vw, 480px"
                              draggable={false}
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={handleZoomChange}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        aria-label={imageZoom > 1 ? 'Zoom out' : 'Zoom in'}
                      >
                        {imageZoom > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                      </button>
                      {displayImages.length > 1 && (
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                          {displayImages.map((_, i) => (
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
                      )}
                    </div>
                  )}
                  {displayImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 flex-shrink-0">
                      {displayImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => goToIndex(i)}
                          className={cn(
                            'w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors',
                            i === imageIndex ? 'border-neutral-900 dark:border-white' : 'border-transparent opacity-60 hover:opacity-100'
                          )}
                        >
                          <Image
                            src={img.url}
                            alt={img.altText || `Image ${i + 1}`}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {!isLampOrBundleProduct && !hideScarcityBar && editionSizeNum != null && editionSizeNum > 0 && (
                    <div className="mt-4 rounded-xl border border-neutral-200/90 dark:border-[#3d3636] bg-neutral-50/80 dark:bg-[#1c1818]/60 px-4 py-4 w-full">
                      <ScarcityBadge
                        quantityAvailable={quantityAvailable}
                        editionSize={editionSizeNum}
                        availableForSale={product.availableForSale}
                        variant="bar"
                        productId={product.id}
                        productImage={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null}
                        productTitle={product.title}
                        unifiedSection
                        className="w-full"
                        streetLadder={streetLadderBlock ?? undefined}
                      />
                    </div>
                  )}
                </div>

                {/* Right: Product info — 52%, scrollable content + fixed bottom bar */}
                <div className="flex-1 min-w-0 flex flex-col min-w-0 pl-2 overflow-hidden">
                  {/* Scrollable content — pb ensures bottom text isn't cut off when scrolling */}
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 pb-8">
                  {/* Header: artist, title, price — edition size shown in scarcity / edition blocks */}
                  <div className="flex-shrink-0 pb-4 border-b border-neutral-100 dark:border-white/10">
                    {artist && (
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-[#c4a0a0] uppercase tracking-widest">
                        {artist}
                      </p>
                    )}
                    <h2 className="text-lg font-semibold text-[#FFBA94] mt-0.5 leading-tight">
                      {product.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {price && (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-base font-semibold',
                            isEarlyAccess && 'text-violet-600 dark:text-violet-400'
                          )}>
                            {price}
                          </span>
                          {isEarlyAccess && originalPrice && (
                            <span className="text-sm text-neutral-400 dark:text-[#a09090] line-through">
                              {originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                      {isSoldOut && (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
                          Sold out
                        </span>
                      )}
                      {isCollected && !isSoldOut && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                          <Package className="w-3 h-3" strokeWidth={2} />
                          Collected
                        </span>
                      )}
                      {(isNewDrop || isEarlyAccess) && !isSoldOut && !isCollected && (
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded',
                          isEarlyAccess
                            ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30'
                            : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                        )}>
                          {isEarlyAccess ? 'Early access' : 'New Drop'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Guarantee / returns / shipping badges — desktop */}
                  {productBadges && productBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-4 border-b border-neutral-100 dark:border-white/10">
                      {productBadges.map((item, i) => {
                        const Icon = { shield: Shield, rotate: RotateCcw, globe: Globe }[item.icon]
                        const styles = item.icon === 'shield'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                          : item.icon === 'rotate'
                            ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300'
                            : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                        return (
                          <span
                            key={i}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                              styles
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            {item.label}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-4">
                      {product.tags.slice(0, 10).map((tag) => (
                        <span key={tag} className="text-[11px] bg-neutral-100 dark:bg-[#201c1c]/80 text-neutral-600 dark:text-[#c4a0a0] px-2.5 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {productIncludes && productIncludes.length > 0 && (
                    <div className="py-3 border-t border-neutral-100 dark:border-white/10">
                      <button
                        onClick={() => setShowIncludes(!showIncludes)}
                        className="w-full flex items-center justify-between py-2.5 -my-2.5 px-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                            <Package className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
                          </div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-[#FFBA94]">
                            What&apos;s included
                          </span>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform duration-200', showIncludes && 'rotate-180')} />
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
                            <div className="flex flex-wrap gap-2 pt-3 pb-1">
                              {productIncludes.map((item, i) => {
                                const Icon = { lamp: Lamp, ruler: Ruler, cable: Cable, plug: Plug, book: BookOpen, magnet: Magnet, package: Package, gift: Gift, bag: ShoppingBag }[item.icon]
                                return (
                                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#201c1c] text-neutral-700 dark:text-[#d4b8b8] text-xs font-medium">
                                    <Icon className="w-3.5 h-3.5 text-neutral-500 dark:text-[#c4a0a0] flex-shrink-0" />
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
                  {productSpecs && productSpecs.length > 0 && (
                    <div className="py-3 border-t border-neutral-100 dark:border-white/10">
                      <button
                        onClick={() => setShowSpecs(!showSpecs)}
                        className="w-full flex items-center justify-between py-2.5 -my-2.5 px-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                            <List className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
                          </div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-[#FFBA94]">
                            Specifications
                          </span>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform duration-200', showSpecs && 'rotate-180')} />
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
                            <div className="grid gap-3 sm:grid-cols-2 pt-3 pb-1">
                              {productSpecs.map((spec, i) => {
                                const SpecIcon = spec.icon ? { ruler: Ruler, scale: Scale, box: Box, sun: Sun, battery: Battery, zap: Zap }[spec.icon] : List
                                const isSingleValue = spec.items.length === 1
                                return (
                                  <div key={i} className="rounded-lg border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/30 px-4 py-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <SpecIcon className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] flex-shrink-0" />
                                      <h4 className="text-[11px] font-semibold text-neutral-500 dark:text-experience-highlight uppercase tracking-wider">{spec.title}</h4>
                                    </div>
                                    {isSingleValue ? (
                                      <p className="text-sm text-neutral-700 dark:text-[#d4b8b8] leading-snug">{spec.items[0]}</p>
                                    ) : (
                                      <ul className="space-y-1.5">
                                        {spec.items.map((item, j) => (
                                          <li key={j} className="text-sm text-neutral-700 dark:text-[#d4b8b8] leading-relaxed flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-neutral-400 dark:bg-[#5c0000] mt-1.5 flex-shrink-0" />
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
                  {isLoadingDetails && (
                    <div className="py-3 border-t border-neutral-100 dark:border-white/10 flex items-center gap-2 text-neutral-500 dark:text-[#c4a0a0]">
                      <div className="w-4 h-4 border-2 border-neutral-300 dark:border-[#3e3838] border-t-neutral-600 dark:border-t-white rounded-full animate-spin" />
                      <span className="text-xs">Loading details…</span>
                    </div>
                  )}
                  {showArtworkArtistGallery ? (
                    <>
                      {!isLampOrBundleProduct && (
                        <div className="py-3 border-t border-neutral-100 dark:border-white/10 space-y-3">
                          {spotlightGifUrl ? <SpotlightCollectionGif gifUrl={spotlightGifUrl} /> : null}
                          <ArtworkEditionUnifiedSection className="w-full">
                            <EditionBadgeForProduct
                              product={product}
                              artistName={editionArtistName}
                              unifiedSection
                              className="w-full"
                            />
                          </ArtworkEditionUnifiedSection>
                        </div>
                      )}
                      <ArtworkArtistDetailGallery
                        resetKey={product.id}
                        description={description}
                        artistLoading={artistLoading}
                        spotlight={spotlightForBanner}
                        spotlightProducts={spotlightProductsForBanner}
                      />
                    </>
                  ) : (
                    <>
                      {description.trim() && (
                        <div className="py-3 border-t border-neutral-100 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => setShowDescription(!showDescription)}
                            className="w-full flex items-center justify-between py-2.5 -my-2.5 px-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-neutral-500 dark:text-[#c4a0a0]" />
                              </div>
                              <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-[#FFBA94]">
                                Artwork details
                              </span>
                            </div>
                            <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform duration-200', showDescription && 'rotate-180')} />
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
                                <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed pt-1 pb-2">{description}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      {!isLampOrBundleProduct && (
                        <div className="py-3 border-t border-neutral-100 dark:border-white/10 space-y-3">
                          {spotlightGifUrl ? <SpotlightCollectionGif gifUrl={spotlightGifUrl} /> : null}
                          <ArtworkEditionUnifiedSection className="w-full">
                            <EditionBadgeForProduct
                              product={product}
                              artistName={editionArtistName}
                              unifiedSection
                              className="w-full"
                            />
                          </ArtworkEditionUnifiedSection>
                        </div>
                      )}
                      {artist && (
                        <div className="py-3 border-t border-neutral-100 dark:border-white/10">
                          {artistLoading ? (
                            <div className="py-4 flex justify-center"><div className="w-5 h-5 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" /></div>
                          ) : spotlightForBanner ? (
                            <ArtistSpotlightBanner
                              spotlight={{ ...spotlightForBanner, gifUrl: undefined }}
                              spotlightProducts={spotlightProductsForBanner}
                            />
                          ) : null}
                        </div>
                      )}
                    </>
                  )}
                  </div>

                  {/* Fixed bar at bottom of right panel — add button (+ lamp scarcity) */}
                  <div className="flex-shrink-0 border-t border-neutral-100 dark:border-white/10 bg-white dark:bg-[#171515] pt-3 pb-5 space-y-3">
                    {isLampOrBundleProduct && !hideScarcityBar && (
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
                    )}
                    {!hideCta && (
                      <button
                        onClick={onToggleSelect}
                        disabled={isSoldOut && !isSelected}
                        className={cn(
                          'w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                          isSelected
                            ? 'bg-neutral-100 dark:bg-[#201c1c] text-neutral-900 dark:text-[#f0e8e8] hover:bg-neutral-200 dark:hover:bg-[#262222]'
                            : isSoldOut
                              ? 'bg-neutral-100 dark:bg-[#201c1c] text-neutral-400 dark:text-[#b89090] cursor-not-allowed'
                              : 'bg-[#047AFF] text-white hover:bg-[#0366d6]'
                        )}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4" />
                            Added to order — Tap to remove
                          </>
                        ) : isSoldOut ? (
                          'Sold Out'
                        ) : (
                          <>
                            {addToOrderLabel} — {price}
                            {isEarlyAccess && originalPrice && (
                              <span className="ml-1.5 text-xs line-through opacity-60">
                                {originalPrice}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
          /* Mobile: single scroll column */
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-64">
            {/* Swipeable image gallery */}
            {displayImages.length > 0 && (
              <div
                ref={constraintsRef}
                className="relative aspect-[4/5] bg-neutral-50 dark:bg-[#1a1616] mx-4 rounded-lg overflow-hidden"
              >
                {/* Close button on top of card (mobile only) */}
                {!isSlideout && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
                <AnimatePresence initial={false} mode="sync">
                  <motion.div
                    key={`${imageIndex}-${currentImage?.url ?? ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    drag={imageZoom > 1 ? true : (displayImages.length > 1 ? 'x' : false)}
                    dragConstraints={
                      imageZoom > 1
                        ? { left: -150, right: 150, top: -150, bottom: 150 }
                        : { left: -280, right: 280 }
                    }
                    dragElastic={imageZoom > 1 ? 0.1 : 0.2}
                    dragMomentum={false}
                    onDragEnd={imageZoom > 1 ? undefined : handleDragEnd}
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

                {displayImages.length > 1 && (
                  <>
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                      {displayImages.map((_, i) => (
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

            {!isLampOrBundleProduct && !hideScarcityBar && editionSizeNum != null && editionSizeNum > 0 && (
              <div className="mx-4 mt-3 rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 px-4 py-4">
                <ScarcityBadge
                  quantityAvailable={quantityAvailable}
                  editionSize={editionSizeNum}
                  availableForSale={product.availableForSale}
                  variant="bar"
                  productId={product.id}
                  productImage={product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null}
                  productTitle={product.title}
                  unifiedSection
                  className="w-full"
                  streetLadder={streetLadderBlock ?? undefined}
                />
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="px-4 pt-6 pb-3 flex flex-wrap gap-1.5">
                {product.tags.slice(0, 10).map((tag) => (
                  <span key={tag} className="text-xs bg-neutral-100 dark:bg-[#201c1c] text-neutral-500 dark:text-[#c4a0a0] px-2 py-0.5 rounded-full">
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
                  className="w-full flex items-center justify-between py-3 border-t border-neutral-100 dark:border-white/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                      <Package className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      What&apos;s included
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] transition-transform',
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#201c1c] text-neutral-700 dark:text-[#d4b8b8] text-xs font-medium"
                            >
                              <Icon className="w-3.5 h-3.5 text-neutral-500 dark:text-[#c4a0a0] flex-shrink-0" />
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
                  className="w-full flex items-center justify-between py-3 border-t border-neutral-100 dark:border-white/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                      <List className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      Specifications
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] transition-transform',
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
                              className="rounded-xl border border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-[#201c1c]/50 px-4 py-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <SpecIcon className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] flex-shrink-0" />
                                <h4 className="text-[11px] font-semibold text-neutral-500 dark:text-[#FFBA94] uppercase tracking-wider">
                                  {spec.title}
                                </h4>
                              </div>
                              {isSingleValue ? (
                                <p className="text-sm text-neutral-700 dark:text-[#d4b8b8] leading-snug">
                                  {spec.items[0]}
                                </p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {spec.items.map((item, j) => (
                                    <li key={j} className="text-sm text-neutral-700 dark:text-[#d4b8b8] leading-relaxed flex items-start gap-2">
                                      <span className="w-1 h-1 rounded-full bg-neutral-400 dark:bg-[#5c0000] mt-1.5 flex-shrink-0" />
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

            {/* Loading indicator when fetching full product details */}
            {isLoadingDetails && (
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-white/10 flex items-center gap-2 text-neutral-500 dark:text-[#c4a0a0]">
                <div className="w-4 h-4 border-2 border-neutral-300 dark:border-[#3e3838] border-t-neutral-600 dark:border-t-white rounded-full animate-spin" />
                <span className="text-xs">Loading details…</span>
              </div>
            )}

            {showArtworkArtistGallery ? (
              <>
                {!isLampOrBundleProduct && (
                  <div className="px-4 pb-3 border-t border-neutral-100 dark:border-white/10 pt-3 space-y-3">
                    {spotlightGifUrl ? <SpotlightCollectionGif gifUrl={spotlightGifUrl} /> : null}
                    <ArtworkEditionUnifiedSection className="w-full">
                      <EditionBadgeForProduct
                        product={product}
                        artistName={editionArtistName}
                        unifiedSection
                        className="w-full"
                      />
                    </ArtworkEditionUnifiedSection>
                  </div>
                )}
                <ArtworkArtistDetailGallery
                  resetKey={product.id}
                  description={description}
                  artistLoading={artistLoading}
                  spotlight={spotlightForBanner}
                  spotlightProducts={spotlightProductsForBanner}
                  className="px-4"
                />
              </>
            ) : (
              <>
                {description.trim() && (
                  <div className="px-4 pb-3">
                    <button
                      type="button"
                      onClick={() => setShowDescription(!showDescription)}
                      className="w-full flex items-center justify-between py-3 border-t border-neutral-100 dark:border-white/10 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#201c1c] flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-neutral-400 dark:text-[#d4b8b8]" />
                        </div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                          Artwork details
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-neutral-400 dark:text-[#d4b8b8] transition-transform',
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
                          <p className="text-sm text-neutral-600 dark:text-[#c4a0a0] leading-relaxed pb-3">{description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {!isLampOrBundleProduct && (
                  <div className="px-4 pb-3 border-t border-neutral-100 dark:border-white/10 pt-3 space-y-3">
                    {spotlightGifUrl ? <SpotlightCollectionGif gifUrl={spotlightGifUrl} /> : null}
                    <ArtworkEditionUnifiedSection className="w-full">
                      <EditionBadgeForProduct
                        product={product}
                        artistName={editionArtistName}
                        unifiedSection
                        className="w-full"
                      />
                    </ArtworkEditionUnifiedSection>
                  </div>
                )}

                {artist && (
                  <div className="px-4 pb-3 border-t border-neutral-100 dark:border-white/10 pt-3">
                    {artistLoading ? (
                      <div className="py-4 flex justify-center"><div className="w-5 h-5 border-2 border-neutral-200 dark:border-[#3e3838] border-t-neutral-500 dark:border-t-white rounded-full animate-spin" /></div>
                    ) : spotlightForBanner ? (
                      <ArtistSpotlightBanner
                        spotlight={{ ...spotlightForBanner, gifUrl: undefined }}
                        spotlightProducts={spotlightProductsForBanner}
                      />
                    ) : null}
                  </div>
                )}
              </>
            )}

          </div>
          )}
          </div>

          {/* Sticky action bar — mobile only; desktop has button/scarcity in right column */}
          {!isSlideout && (
          <div className="absolute bottom-0 left-0 right-0 z-10 pt-0">
            <div
              className={cn(
                'space-y-3 p-5 bg-white/90 dark:bg-[#171515]/95 backdrop-blur-xl border-t border-neutral-100 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]',
                productBadges?.length ? 'pt-4' : 'pt-5'
              )}
              style={{ backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' }}
            >
              {/* Guarantee / returns / shipping badges — mobile action bar */}
              {productBadges && productBadges.length > 0 && (
                <div className="flex flex-col items-center gap-2 pb-1">
                  {productBadges.slice(0, 1).map((item, i) => {
                    const Icon = { shield: Shield, rotate: RotateCcw, globe: Globe }[item.icon]
                    const styles = item.icon === 'shield'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                      : item.icon === 'rotate'
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300'
                        : 'bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300'
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
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                      : item.icon === 'rotate'
                        ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300'
                        : 'bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300'
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
                    <p className="text-xs font-medium text-neutral-500 dark:text-[#c4a0a0] uppercase tracking-wider">
                      {artist}
                    </p>
                  )}
                  <h2 className="text-sm font-semibold text-[#FFBA94] tracking-tight mt-0.5">
                    {product.title}
                  </h2>
                  {isSoldOut && (
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded w-fit mt-1">
                      Sold out
                    </span>
                  )}
                  {isCollected && !isSoldOut && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded w-fit mt-1">
                      <Package className="w-2.5 h-2.5" strokeWidth={2} />
                      Collected
                    </span>
                  )}
                  {(isNewDrop || isEarlyAccess) && !isSoldOut && !isCollected && (
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit mt-1',
                      isEarlyAccess
                        ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                    )}>
                      {isEarlyAccess ? 'Early access' : 'New Drop'}
                    </span>
                  )}
                </div>
              </div>
              {isLampOrBundleProduct && !hideScarcityBar && (
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
              )}
              {!hideCta && (
                <button
                  onClick={onToggleSelect}
                  disabled={isSoldOut && !isSelected}
                  className={cn(
                    'w-full h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    isSelected
                      ? 'bg-neutral-100 dark:bg-[#201c1c] text-neutral-900 dark:text-[#f0e8e8] hover:bg-neutral-200 dark:hover:bg-[#262222]'
                      : isSoldOut
                        ? 'bg-neutral-100 dark:bg-[#201c1c] text-neutral-400 dark:text-[#b89090] cursor-not-allowed'
                        : 'bg-[#047AFF] text-white hover:bg-[#0366d6]'
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
                    <>
                      {addToOrderLabel} &mdash; {price}
                      {isEarlyAccess && originalPrice && (
                        <span className="ml-1.5 text-xs line-through opacity-60">
                          {originalPrice}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          )}
        </motion.div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  )
}
