'use client'

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Award, Box, Info, Play, RotateCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import {
  buildExperienceReelGalleryItems,
  type ExperienceReelGalleryItem,
  reelGalleryItemKey,
} from '@/lib/shop/experience-reel-gallery'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'

interface ArtworkInfoBarProps {
  /** Product on lamp Side A (image1) */
  sideAProduct: ShopifyProduct | null
  /** Product on lamp Side B (image2) */
  sideBProduct: ShopifyProduct | null
  /** When no artworks on lamp, show this product (street lamp) — title, thumbnails, gallery */
  lampProduct?: ShopifyProduct | null
  /** Product ID of the last clicked artwork in the carousel */
  lastClickedProductId: string | null
  /** Called when gallery images change — parent passes to Spline carousel */
  onGalleryImagesChange?: (images: ExperienceReelGalleryItem[]) => void
  /** Called when user taps a thumbnail — 0 = Spline, 1+ = image index */
  onGoToSlide?: (slideIndex: number) => void
  /** Current slide index — for highlighting active thumbnail */
  currentSlide?: number
  /** Optional: open artwork detail when tapped */
  onViewDetail?: (product: ShopifyProduct) => void
  /** When two artworks on lamp: which is displayed (0 = sideA, 1 = sideB). Controlled by parent; 1|2 buttons live in header. */
  displayedIndex?: number
  /** Called when the displayed product changes (full product when available from cache) */
  onDisplayedProductChange?: (product: ShopifyProduct | null) => void
  /** 'inline' = thumbnails below title (default). 'right' = thumbnails portaled under rotate button. */
  thumbnailPlacement?: 'inline' | 'right'
  /** When Spline is selected (currentSlide 0), first thumbnail becomes rotate button. Pass to enable. */
  onRotate?: () => void
  /** When true, hide title/artist (moved to header center on desktop) */
  hideTitle?: boolean
  /** When true, do not push displayed product / gallery into the parent reel (collection landing). */
  suppressReelSync?: boolean
  /** When set, mobile hero title above Spline uses this instead of the active product title. */
  heroTitleOverride?: string | null
  /** Slide index for gallery image at thumb idx 1 (second image). Idx 0 uses slide 1 (details). */
  gallerySlideOffset?: number
  /** When true, reel has edition status as slide 0; Spline is slide 1, details slide 2 */
  editionLeadBeforeSpline?: boolean
}

export function ArtworkInfoBar({
  sideAProduct,
  sideBProduct,
  lampProduct = null,
  lastClickedProductId,
  onGalleryImagesChange,
  onGoToSlide,
  currentSlide = 0,
  onViewDetail,
  displayedIndex = 0,
  onDisplayedProductChange,
  thumbnailPlacement = 'inline',
  onRotate,
  hideTitle = false,
  suppressReelSync = false,
  heroTitleOverride = null,
  gallerySlideOffset = 1,
  editionLeadBeforeSpline = false,
}: ArtworkInfoBarProps) {
  const { theme } = useExperienceTheme()
  const hasA = !!sideAProduct
  const hasB = !!sideBProduct
  const hasTwo = hasA && hasB && sideAProduct.id !== sideBProduct.id

  const displayedProduct = hasTwo
    ? (displayedIndex === 0 ? sideAProduct : sideBProduct)
    : (sideAProduct ?? sideBProduct ?? lampProduct)

  // Cache full products by handle — pre-fetch for BOTH lamp sides so we have all images
  const [fullProductCache, setFullProductCache] = useState<Map<string, ShopifyProduct>>(new Map())
  const [imagesLoading, setImagesLoading] = useState(false)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, ShopifyProduct>>(new Map())
  cacheRef.current = fullProductCache

  useEffect(() => {
    const handles = new Set<string>()
    if (sideAProduct?.handle) handles.add(sideAProduct.handle)
    if (sideBProduct?.handle && sideBProduct.handle !== sideAProduct?.handle) handles.add(sideBProduct.handle)
    if (handles.size === 0) return

    const toFetch = [...handles].filter((h) => !cacheRef.current.has(h))
    if (toFetch.length === 0) {
      setImagesLoading(false)
      return
    }

    setImagesLoading(true)
    fetchAbortRef.current?.abort()
    fetchAbortRef.current = new AbortController()
    const signal = fetchAbortRef.current.signal

    Promise.all(
      toFetch.map((handle) =>
        fetch(`/api/shop/products/${encodeURIComponent(handle)}`, { signal })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => (data?.product ? { handle, product: data.product as ShopifyProduct } : null))
          .catch(() => null)
      )
    ).then((results) => {
      if (signal.aborted) return
      setFullProductCache((prev) => {
        const next = new Map(prev)
        for (const r of results) {
          if (r?.product) next.set(r.handle, r.product)
        }
        return next
      })
    }).finally(() => {
      if (!signal.aborted) setImagesLoading(false)
    })

    return () => { fetchAbortRef.current?.abort() }
  }, [sideAProduct?.handle, sideBProduct?.handle])

  const productForImages =
    displayedProduct && displayedProduct.id !== lampProduct?.id
      ? (displayedProduct.handle && fullProductCache.get(displayedProduct.handle)) ?? displayedProduct
      : displayedProduct

  useEffect(() => {
    if (suppressReelSync) return
    onDisplayedProductChange?.(productForImages ?? displayedProduct ?? null)
  }, [displayedProduct, productForImages, onDisplayedProductChange, suppressReelSync])

  const galleryImages = useMemo(
    () => buildExperienceReelGalleryItems(productForImages),
    [productForImages]
  )

  useEffect(() => {
    if (suppressReelSync) return
    onGalleryImagesChange?.(galleryImages)
  }, [galleryImages, onGalleryImagesChange, suppressReelSync])

  const [portalReady, setPortalReady] = useState(false)
  useLayoutEffect(() => {
    setPortalReady(true)
  }, [])

  if (!displayedProduct) return null

  const editionSlide = editionLeadBeforeSpline ? 0 : null
  const splineSlide = editionLeadBeforeSpline ? 1 : 0
  const detailSlide = editionLeadBeforeSpline ? 2 : 1

  /** Reel slide index for product image thumbnail idx (0 = hero in details section). */
  const slideForImageThumb = (idx: number) =>
    idx === 0 ? detailSlide : gallerySlideOffset + idx - 1

  const isLamp = displayedProduct?.id === lampProduct?.id
  const title = heroTitleOverride?.trim() ? heroTitleOverride.trim() : (displayedProduct.title ?? '')
  const artist = heroTitleOverride ? '' : isLamp ? '' : (displayedProduct.vendor ?? '')

  /** First reel slide that shows an extra product photo (after details hero). */
  const firstGalleryImageSlide =
    galleryImages.length > 1 ? slideForImageThumb(1) : null
  const lastGalleryImageSlide =
    galleryImages.length > 1 ? slideForImageThumb(galleryImages.length - 1) : null
  const galleryStackThumbActive =
    firstGalleryImageSlide != null &&
    lastGalleryImageSlide != null &&
    currentSlide >= firstGalleryImageSlide &&
    currentSlide <= lastGalleryImageSlide

  /**
   * Mobile: title over Spline when that slide is active — unless the reel has edition above Spline
   * (`editionLeadBeforeSpline`), in which case edition already surfaces artwork identity; hide duplicate.
   */
  const showMobileHeroTitle =
    !hideTitle && currentSlide === splineSlide && !editionLeadBeforeSpline

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        hideTitle ? 'items-start' : 'w-full max-w-full items-center text-center'
      )}
    >
        {/* Row: artwork title and artist — desktop: hidden (header); mobile: hero slide only, centered above Spline */}
        {showMobileHeroTitle && (
        <div className="flex w-full min-w-0 max-w-[min(92vw,20rem)] flex-col items-center justify-center px-1">
          {heroTitleOverride ? (
            <div className="min-w-0 w-full text-center cursor-default">
              <AnimatePresence mode="wait">
                <motion.div
                  key="hero-title-override"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-0.5 min-w-0 text-center"
                >
                  <p
                    className={cn(
                      'text-sm font-semibold text-balance line-clamp-2',
                      theme === 'light' ? 'text-neutral-900' : 'text-white'
                    )}
                  >
                    {title}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
          <button
            type="button"
            onClick={() => onViewDetail?.(displayedProduct)}
            className={cn(
              'min-w-0 w-full text-center',
              !onViewDetail && 'cursor-default'
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={displayedProduct.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="space-y-0.5 min-w-0 text-center"
              >
                <p
                  className={cn(
                    'text-sm font-semibold text-balance line-clamp-2',
                    theme === 'light' ? 'text-neutral-900' : 'text-white'
                  )}
                >
                  {title || 'Untitled'}
                </p>
                {artist && (
                  <p
                    className={cn(
                      'text-xs text-balance line-clamp-2',
                      theme === 'light' ? 'text-neutral-500' : 'text-white/70'
                    )}
                  >
                    by {artist}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </button>
          )}
        </div>
        )}

        {/* Thumbnails: [Spline] [img1] [img2]... — inline or portaled to right */}
        {(galleryImages.length > 0 || imagesLoading) && (() => {
          const thumbnails = (
            <div className="flex flex-col gap-1.5">
              {imagesLoading ? (
                <div className={cn('w-8 h-8 rounded-md animate-pulse', theme === 'light' ? 'bg-neutral-200' : 'bg-white/10')} />
              ) : (
                <>
                  {/* Edition reel jump — inline strip only; right-rail stack omits (edition block no longer first-class in reel) */}
                  {thumbnailPlacement !== 'right' &&
                    editionLeadBeforeSpline &&
                    editionSlide !== null && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onGoToSlide?.(editionSlide)
                      }}
                      title="Edition status"
                      className={cn(
                        'relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2',
                        currentSlide === editionSlide
                          ? theme === 'light'
                            ? 'border-[#FFBA94] bg-[#FFBA94]/10 dark:border-[#FFBA94] dark:bg-[#FFBA94]/10'
                            : 'border-[#FFBA94] bg-[#FFBA94]/10'
                          : theme === 'light'
                            ? 'border-transparent bg-neutral-200 opacity-80 hover:opacity-100'
                            : 'border-transparent bg-white/10 opacity-80 hover:opacity-100'
                      )}
                    >
                      <Award className={cn('w-4 h-4', theme === 'light' ? 'text-neutral-600' : 'text-white/80')} strokeWidth={2} />
                    </button>
                  )}
                  {/* Spline / 3D lamp — when selected, becomes rotate button */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (currentSlide === splineSlide && onRotate) onRotate()
                      else onGoToSlide?.(splineSlide)
                    }}
                    title={currentSlide === splineSlide && onRotate ? 'Rotate 90 degrees' : '3D lamp view'}
                    className={cn(
                      'relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2',
                    currentSlide === splineSlide
                      ? theme === 'light'
                        ? 'border-[#FFBA94] bg-[#FFBA94]/10 dark:border-[#FFBA94] dark:bg-[#FFBA94]/10'
                        : 'border-[#FFBA94] bg-[#FFBA94]/10'
                        : theme === 'light'
                          ? 'border-transparent bg-neutral-200 opacity-80 hover:opacity-100'
                          : 'border-transparent bg-white/10 opacity-80 hover:opacity-100'
                    )}
                  >
                    {currentSlide === splineSlide && onRotate ? (
                      <RotateCw className={cn('w-4 h-4', theme === 'light' ? 'text-neutral-600' : 'text-white/80')} />
                    ) : (
                      <Box className={cn('w-4 h-4', theme === 'light' ? 'text-neutral-600' : 'text-white/80')} strokeWidth={1.5} />
                    )}
                  </button>
                  {/* Info icon — scroll to artist bio & artwork details section */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onGoToSlide?.(detailSlide)
                    }}
                    title="View details"
                    className={cn(
                      'relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2',
                      currentSlide === detailSlide
                        ? theme === 'light'
                          ? 'border-[#FFBA94] bg-[#FFBA94]/10 dark:border-[#FFBA94] dark:bg-[#FFBA94]/10'
                          : 'border-[#FFBA94] bg-[#FFBA94]/10'
                        : theme === 'light'
                          ? 'border-transparent bg-neutral-200 opacity-80 hover:opacity-100'
                          : 'border-transparent bg-white/10 opacity-80 hover:opacity-100'
                    )}
                  >
                    <Info className={cn('w-4 h-4', theme === 'light' ? 'text-neutral-600' : 'text-white/80')} />
                  </button>
                  {thumbnailPlacement === 'right' ? (
                    firstGalleryImageSlide != null && galleryImages[1] ? (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onGoToSlide?.(firstGalleryImageSlide)
                        }}
                        title={
                          galleryImages[1].kind === 'video' || galleryImages[1].kind === 'externalVideo'
                            ? 'Product video'
                            : galleryImages.length > 2
                              ? `${galleryImages.length - 1} artwork photos — opens first`
                              : 'View artwork photo'
                        }
                        className={cn(
                          'relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden transition-all border-2',
                          galleryStackThumbActive
                            ? 'border-[#FFBA94]'
                            : theme === 'light'
                              ? 'border-transparent opacity-80 hover:opacity-100 hover:border-neutral-300'
                              : 'border-transparent opacity-80 hover:opacity-100 hover:border-white/30'
                        )}
                      >
                        {(() => {
                          const g1 = galleryImages[1]
                          const poster =
                            g1.kind === 'image'
                              ? g1.url
                              : g1.posterUrl ?? null
                          const isVid = g1.kind === 'video' || g1.kind === 'externalVideo'
                          return (
                            <>
                              {poster ? (
                                <Image
                                  src={getShopifyImageUrl(poster, 88) ?? poster}
                                  alt={g1.altText ?? displayedProduct.title ?? 'Gallery'}
                                  fill
                                  unoptimized
                                  className="object-cover pointer-events-none"
                                  sizes="32px"
                                  loading="eager"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'absolute inset-0 flex items-center justify-center',
                                    theme === 'light' ? 'bg-neutral-300' : 'bg-white/15'
                                  )}
                                  aria-hidden
                                >
                                  <Play className="h-4 w-4 text-white drop-shadow" strokeWidth={2} />
                                </div>
                              )}
                              {isVid && poster ? (
                                <span
                                  className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25"
                                  aria-hidden
                                >
                                  <Play
                                    className="h-3.5 w-3.5 text-white drop-shadow"
                                    strokeWidth={2.5}
                                    fill="currentColor"
                                  />
                                </span>
                              ) : null}
                            </>
                          )
                        })()}
                        {galleryImages.length > 2 ? (
                          <span
                            className="pointer-events-none absolute bottom-0 right-0 rounded-tl-md bg-black/80 px-1 py-0.5 text-[11px] font-extrabold tabular-nums leading-none tracking-tight text-white"
                            aria-hidden
                          >
                            +{galleryImages.length - 2}
                          </span>
                        ) : null}
                      </button>
                    ) : null
                  ) : (
                    galleryImages.map((item, idx) => {
                      const thumbSrc =
                        item.kind === 'image' ? item.url : item.posterUrl ?? null
                      const isVideo = item.kind === 'video' || item.kind === 'externalVideo'
                      return (
                        <button
                          key={reelGalleryItemKey(item, idx)}
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onGoToSlide?.(slideForImageThumb(idx))
                          }}
                          title={isVideo ? 'Product video' : 'View full image'}
                          className={cn(
                            'relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden transition-all border-2',
                            currentSlide === slideForImageThumb(idx)
                              ? 'border-[#FFBA94]'
                              : theme === 'light'
                                ? 'border-transparent opacity-80 hover:opacity-100 hover:border-neutral-300'
                                : 'border-transparent opacity-80 hover:opacity-100 hover:border-white/30'
                          )}
                        >
                          {thumbSrc ? (
                            <Image
                              src={getShopifyImageUrl(thumbSrc, 88) ?? thumbSrc}
                              alt={item.altText ?? displayedProduct.title ?? `Artwork ${idx + 1}`}
                              fill
                              unoptimized
                              className="object-cover pointer-events-none"
                              sizes="32px"
                              loading="eager"
                            />
                          ) : (
                            <div
                              className={cn(
                                'absolute inset-0 flex items-center justify-center',
                                theme === 'light' ? 'bg-neutral-300' : 'bg-white/15'
                              )}
                              aria-hidden
                            >
                              <Play className="h-4 w-4 text-white drop-shadow" strokeWidth={2} />
                            </div>
                          )}
                          {isVideo && thumbSrc ? (
                            <span
                              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25"
                              aria-hidden
                            >
                              <Play className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={2.5} fill="currentColor" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })
                  )}
                </>
              )}
            </div>
          )
          if (thumbnailPlacement === 'right') {
            if (portalReady && typeof document !== 'undefined') {
              const slot = document.getElementById('spline-thumbnail-slot')
              if (slot) return createPortal(thumbnails, slot)
            }
            return null
          }
          return thumbnails
        })()}
    </div>
  )
}
