'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { RotateCw } from 'lucide-react'

/** Static facade (87 KB) as LCP candidate; Spline 6.7MB scene mounts via requestIdleCallback. */
const SPLINE_FACADE_SRC = '/internal.webp'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import {
  loadImagePosition,
  DEFAULT_SIDE_POSITION,
  DEFAULT_SIDE_B_POSITION,
} from '@/lib/experience-image-position'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { ArtworkAccordions } from './ArtworkAccordions'

function SplinePreviewLoading() {
  const { theme } = useExperienceTheme()
  return (
    <div className={cn(
      'relative w-full h-full flex items-center justify-center',
      theme === 'light' ? 'bg-neutral-200/80' : 'bg-neutral-900/80'
    )}>
      <div className={cn(
        'w-8 h-8 border-2 rounded-full animate-spin',
        theme === 'light' ? 'border-neutral-300 border-t-neutral-600' : 'border-white/30 border-t-white'
      )} />
    </div>
  )
}

const Spline3DPreview = dynamic(
  () => import('@/app/template-preview/components/spline-3d-preview').then((mod) => mod.Spline3DPreview),
  { ssr: false, loading: () => <SplinePreviewLoading /> }
)

interface SplineFullScreenProps {
  image1: string | null
  image2: string | null
  rotateToSide: 'A' | 'B' | null
  rotateTrigger: number
  resetTrigger?: number
  onFrontSideSettled?: (side: 'A' | 'B') => void
  lampPreviewCount?: number
  pickerOpen?: boolean
  className?: string
  /** Optional content to render in the top bar (e.g. artwork info). May be a function receiving { onRotate, isDesktop }. */
  topBarContent?: React.ReactNode | ((inject: { onRotate: () => void; isDesktop: boolean }) => React.ReactNode)
  /** Gallery images — when set, Spline becomes slide 0 and images are slides 1,2,3... */
  galleryImages?: { url: string; altText?: string | null }[]
  /** Displayed product for accordion sections (What's included, Specs, Description, About Artist) — shown before gallery */
  displayedProduct?: ShopifyProduct | null
  /** When displayedProduct is the lamp, pass these for accordion */
  productIncludes?: { label: string; icon: 'lamp' | 'ruler' | 'cable' | 'plug' | 'book' | 'magnet' | 'package' | 'gift' | 'bag' }[]
  productSpecs?: { title: string; icon?: 'ruler' | 'scale' | 'box' | 'sun' | 'battery' | 'zap'; items: string[] }[]
  /** Current slide index: 0 = Spline, 1+ = gallery images. Accordion is not a slide. */
  currentSlide?: number
  /** Called when user swipes to a different slide */
  onSlideChange?: (index: number) => void
  /** Called when Spline section enters/leaves view (for carousel visibility) */
  onSplineInView?: (inView: boolean) => void
  /** When no artwork selected, use this image as placeholder (e.g. spotlight artwork) */
  spotlightFallbackImageUrl?: string | null
  /** Override slug for artist bio fetch — use spotlight's vendorSlug so bio matches selector */
  artistSlugOverride?: string
  /** When provided, use this spotlight data directly (includes gifUrl) — same as selector */
  spotlightDataOverride?: import('../../experience-v2/components/ArtistSpotlightBanner').SpotlightData | null
}

export function SplineFullScreen({
  image1,
  image2,
  rotateToSide,
  rotateTrigger,
  resetTrigger = 0,
  onFrontSideSettled,
  lampPreviewCount = 0,
  pickerOpen = false,
  className,
  topBarContent,
  galleryImages = [],
  displayedProduct = null,
  productIncludes,
  productSpecs,
  currentSlide = 0,
  onSlideChange,
  onSplineInView,
  spotlightFallbackImageUrl = null,
  artistSlugOverride,
  spotlightDataOverride,
}: SplineFullScreenProps) {
  const { theme } = useExperienceTheme()
  const [previewQuarterTurns, setPreviewQuarterTurns] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  // Facade pattern: show static image as LCP; mount Spline via requestIdleCallback (3s timeout) or tap
  const [splineReady, setSplineReady] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [imageScale, setImageScale] = useState(DEFAULT_SIDE_POSITION.scale)
  const [imageOffsetX, setImageOffsetX] = useState(DEFAULT_SIDE_POSITION.offsetX)
  const [imageOffsetY, setImageOffsetY] = useState(DEFAULT_SIDE_POSITION.offsetY)
  const [imageScaleX, setImageScaleX] = useState(DEFAULT_SIDE_POSITION.scaleX)
  const [imageScaleY, setImageScaleY] = useState(DEFAULT_SIDE_POSITION.scaleY)
  const [imageScaleB, setImageScaleB] = useState(DEFAULT_SIDE_B_POSITION.scale)
  const [imageOffsetXB, setImageOffsetXB] = useState(DEFAULT_SIDE_B_POSITION.offsetX)
  const [imageOffsetYB, setImageOffsetYB] = useState(DEFAULT_SIDE_B_POSITION.offsetY)
  const [imageScaleXB, setImageScaleXB] = useState(DEFAULT_SIDE_B_POSITION.scaleX)
  const [imageScaleYB, setImageScaleYB] = useState(DEFAULT_SIDE_B_POSITION.scaleY)

  useEffect(() => {
    const saved = loadImagePosition()
    if (saved) {
      setImageScale(saved.sideA.scale)
      setImageOffsetX(saved.sideA.offsetX)
      setImageOffsetY(saved.sideA.offsetY)
      setImageScaleX(saved.sideA.scaleX)
      setImageScaleY(saved.sideA.scaleY)
      setImageScaleB(saved.sideB.scale)
      setImageOffsetXB(saved.sideB.offsetX)
      setImageOffsetYB(saved.sideB.offsetY)
      setImageScaleXB(saved.sideB.scaleX)
      setImageScaleYB(saved.sideB.scaleY)
    }
  }, [])

  useEffect(() => {
    const dispatchSettled = () => window.dispatchEvent(new CustomEvent('experience-selector-settled'))
    const t1 = setTimeout(dispatchSettled, 50)
    const t2 = setTimeout(dispatchSettled, 300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pickerOpen])

  useEffect(() => {
    const dispatchSettled = () => window.dispatchEvent(new CustomEvent('experience-selector-settled'))
    // Fire multiple times to catch layout settling at different stages
    const t1 = setTimeout(dispatchSettled, 50)
    const t2 = setTimeout(dispatchSettled, 200)
    const t3 = setTimeout(dispatchSettled, 500)
    const t4 = setTimeout(dispatchSettled, 1000)
    window.addEventListener('resize', dispatchSettled)
    window.addEventListener('orientationchange', dispatchSettled)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('resize', dispatchSettled)
      window.removeEventListener('orientationchange', dispatchSettled)
    }
  }, [])

  // Defer Spline mount until idle (3s max) so 6.7MB scene does not block LCP
  useEffect(() => {
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 3000 })
        : (setTimeout(cb, 3000) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => setSplineReady(true))
    return () => cancel(id)
  }, [])

  const lampVariant = theme === 'light' ? 'light' : 'dark'
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasAccordion = !!displayedProduct
  const hasGallery = galleryImages.length > 1 // Skip first image (shown in details), need 2+ for gallery section
  const sectionCount = 1 + (hasAccordion ? 1 : 0) + (hasGallery ? 1 : 0)

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastReportedSectionRef = useRef(currentSlide)
  const scrollRafRef = useRef<number | null>(null)
  const lastProgrammaticSectionRef = useRef<number | null>(null)

  useEffect(() => {
    if (!scrollRef.current || sectionCount <= 1) return
    if (lastProgrammaticSectionRef.current === currentSlide) {
      lastProgrammaticSectionRef.current = null
      return
    }
    const target = sectionRefs.current[currentSlide]
    if (!target) return

    lastProgrammaticSectionRef.current = currentSlide
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentSlide, sectionCount])

  const handleScroll = useCallback(() => {
    if (!onSlideChange || sectionCount <= 1) return
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      const el = scrollRef.current
      if (!el) return
      const viewportMid = el.scrollTop + el.clientHeight / 2
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < sectionCount; i++) {
        const ref = sectionRefs.current[i]
        if (!ref) continue
        const sectionMid = ref.offsetTop + ref.offsetHeight / 2
        const dist = Math.abs(viewportMid - sectionMid)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      if (best === lastReportedSectionRef.current) return
      lastReportedSectionRef.current = best
      lastProgrammaticSectionRef.current = best
      onSlideChange(best)
    })
  }, [onSlideChange, sectionCount])

  useEffect(() => {
    lastReportedSectionRef.current = currentSlide
  }, [currentSlide])

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [])

  // Report when Spline section is in view (for carousel visibility)
  useEffect(() => {
    const scrollEl = scrollRef.current
    const splineEl = sectionRefs.current[0]
    if (!scrollEl || !splineEl || !onSplineInView) return
    const observer = new IntersectionObserver(
      ([entry]) => onSplineInView(entry.isIntersecting),
      { root: scrollEl, rootMargin: '0px', threshold: 0.1 }
    )
    observer.observe(splineEl)
    return () => observer.disconnect()
  }, [onSplineInView])

  return (
    <div className={cn(
      'absolute inset-0 w-full h-full min-w-0 min-h-0 flex flex-col',
      theme === 'light' ? 'bg-[#F5F5F5]' : 'bg-[#171515]',
      className
    )}>
      {/* One continuous reel: Spline at top, then images stacked — scroll down through all */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          'flex flex-col flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-[20vh] touch-pan-y overscroll-contain'
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity',
        } as React.CSSProperties}
      >
        {/* Section 0: Spline 3D — facade (LCP) then deferred Spline mount */}
        <div
          ref={(r) => { sectionRefs.current[0] = r }}
          className={cn(
            'flex-shrink-0 flex flex-col relative w-full',
            hasGallery || hasAccordion ? 'min-h-[100svh]' : 'flex-1 min-w-0'
          )}
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="flex-1 min-h-0 min-w-0 relative">
          {!splineReady ? (
            <button
              type="button"
              onClick={() => setSplineReady(true)}
              className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer focus:outline-none focus:ring-0"
              aria-label="Load 3D preview"
            >
              <Image
                src={image1 ?? image2 ?? spotlightFallbackImageUrl ?? SPLINE_FACADE_SRC}
                alt="Street Lamp preview"
                fill
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized={!!(image1 ?? image2 ?? spotlightFallbackImageUrl)}
              />
            </button>
          ) : (
          <ComponentErrorBoundary
            componentName="Spline3DPreview"
            fallback={
              (image1 ?? image2 ?? spotlightFallbackImageUrl) ? (
                <div className="relative w-full h-full">
                  <Image
                    src={image1 ?? image2 ?? spotlightFallbackImageUrl!}
                    alt="Artwork preview"
                    fill
                    className="object-contain"
                    sizes="100vw"
                    unoptimized
                  />
                </div>
              ) : (
                <div className={cn(
                  'flex h-full w-full items-center justify-center',
                  theme === 'light' ? 'bg-neutral-200/80' : 'bg-neutral-900/80'
                )}>
                  <div className="text-center px-4">
                    <p className={cn('text-sm', theme === 'light' ? 'text-neutral-600' : 'text-white/70')}>3D preview unavailable</p>
                    <p className={cn('text-xs mt-1', theme === 'light' ? 'text-neutral-500' : 'text-white/50')}>You can still browse and add artworks below.</p>
                  </div>
                </div>
              )
            }
          >
            <Spline3DPreview
              image1={image1}
              image2={image2}
              lampVariant={lampVariant}
              previewTheme={theme}
              side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"
              side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"
              minimal
              animate
              interactive
              idleSpinEnabled={lampPreviewCount < 2}
              className="relative w-full h-full min-h-0 min-w-0"
              swapLampSides
              flipForSide="B"
              flipForSideB="horizontal"
              imageScale={imageScale}
              imageOffsetX={imageOffsetX}
              imageOffsetY={imageOffsetY}
              imageScaleX={imageScaleX}
              imageScaleY={imageScaleY}
              imageScaleB={imageScaleB}
              imageOffsetXB={imageOffsetXB}
              imageOffsetYB={imageOffsetYB}
              imageScaleXB={imageScaleXB}
              imageScaleYB={imageScaleYB}
              resetTrigger={resetTrigger}
              rotateToSide={rotateToSide}
              rotateTrigger={rotateTrigger}
              onFrontSideSettled={onFrontSideSettled}
              previewQuarterTurns={previewQuarterTurns}
            />
          </ComponentErrorBoundary>
          )}
          </div>
        </div>

        {/* Section 1: Artist Bio & Artwork Details (with image and scarcity bar) */}
        {hasAccordion && displayedProduct && (
          <div
            ref={(r) => { sectionRefs.current[1] = r }}
            className="flex-shrink-0 w-full min-h-[60svh] flex flex-col items-center justify-start py-8"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ArtworkAccordions
              key={displayedProduct.id}
              product={displayedProduct}
              productIncludes={productIncludes}
              productSpecs={productSpecs}
              artistSlugOverride={artistSlugOverride}
              spotlightDataOverride={spotlightDataOverride}
            />
          </div>
        )}

        {/* Section 2 (or 1 if no accordion): Gallery — skip first image (artwork shown in details), show remaining */}
        {galleryImages.length > 1 && (
          <div
            ref={(r) => { sectionRefs.current[hasAccordion ? 2 : 1] = r }}
            className="flex-shrink-0 w-full flex flex-col items-center py-4"
            style={{ scrollSnapAlign: 'start' }}
          >
            {galleryImages.slice(1).map((img, idx) => (
              <div
                key={img.url || idx}
                className="w-full flex items-center justify-center py-3 px-4"
              >
                <div className="relative w-full max-w-[min(92vw,360px)] md:max-w-[min(65vh,520px)] mx-auto aspect-[4/5] overflow-hidden rounded-xl">
                  <Image
                    src={getShopifyImageUrl(img.url, 1200) ?? img.url}
                    alt={img.altText ?? `Gallery ${idx + 2}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={idx === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top bar + thumbnails: hug Spline preview on desktop with max-width container */}
      <div className="absolute top-3 left-0 right-0 z-10 pt-safe md:left-1/2 md:right-auto md:w-full md:max-w-[min(92vw,768px)] md:-translate-x-1/2 md:px-4">
        <div className="flex items-start justify-between gap-4 px-4 md:px-0">
          {/* Title/artist on left — hidden on desktop (moved to header center) */}
          {topBarContent && (
            <div className={cn('flex-1 min-w-0 flex justify-start', isDesktop && 'hidden')}>
              {typeof topBarContent === 'function'
                ? topBarContent({ onRotate: () => setPreviewQuarterTurns((prev) => (prev + 3) % 4), isDesktop })
                : topBarContent}
            </div>
          )}
          {/* Thumbnails + rotate on right — ml-auto on desktop when title in header */}
          <div className={cn('flex flex-col items-end gap-2 flex-shrink-0', isDesktop && 'md:ml-auto')}>
            {galleryImages.length === 0 && (
              <button
                type="button"
                onClick={() => setPreviewQuarterTurns((prev) => (prev + 3) % 4)}
                aria-label="Rotate preview 90 degrees"
                className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-[#f0e8e8]/80 dark:hover:text-[#f0e8e8] bg-white/80 dark:bg-[#171515]/70 hover:bg-white dark:hover:bg-black/60 backdrop-blur-sm transition-colors cursor-pointer"
                title="Rotate 90 degrees"
              >
                <RotateCw size={20} className="shrink-0" />
              </button>
            )}
            <div id="spline-thumbnail-slot" className="flex flex-col items-end" />
          </div>
        </div>
      </div>
    </div>
  )
}
