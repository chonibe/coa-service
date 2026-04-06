'use client'

import { useEffect, useState, useRef, useCallback, type MutableRefObject, type Ref } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { ArrowUp, RotateCw } from 'lucide-react'

/** Static facade (87 KB) as LCP candidate; Spline 6.7MB scene mounts via requestIdleCallback. */
const SPLINE_FACADE_SRC = '/internal.webp'

/** Once per tab session — reel scroll hint past Spline / carousel hide (see scroll nudge effect in this file). */
const EXPERIENCE_REEL_SCROLL_HINT_KEY = 'sc-experience-reel-scroll-hint-v2'
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
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { ArtworkAccordions } from './ArtworkAccordions'
import { FeaturedArtistBundleSection } from './FeaturedArtistBundleSection'
import type { FeaturedBundleFilterOffer } from '../../experience-v2/components/FilterPanel'

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null) {
  if (ref == null) return
  if (typeof ref === 'function') ref(value)
  else (ref as MutableRefObject<T | null>).current = value
}

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

/** Retry chunk load on ChunkLoadError; reload page once if retry fails (stale dev cache). */
const CHUNK_RELOAD_KEY = 'spline_chunk_reload'
const loadSpline3DPreview = () =>
  import('@/app/template-preview/components/spline-3d-preview')
    .then((mod) => mod.Spline3DPreview)
    .catch((err) => {
      const isChunkError = err?.name === 'ChunkLoadError' || err?.message?.includes?.('Loading chunk')
      if (!isChunkError) throw err
      return import('@/app/template-preview/components/spline-3d-preview')
        .then((m) => m.Spline3DPreview)
        .catch((retryErr) => {
          if (typeof window !== 'undefined' && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
            window.location.reload()
            return new Promise(() => {}) // Never resolves; page is reloading
          }
          throw retryErr
        })
    })

const Spline3DPreview = dynamic(loadSpline3DPreview, {
  ssr: false,
  loading: () => <SplinePreviewLoading />,
})

interface SplineFullScreenProps {
  image1: string | null
  image2: string | null
  rotateToSide: 'A' | 'B' | null
  rotateTrigger: number
  resetTrigger?: number
  onFrontSideSettled?: (side: 'A' | 'B') => void
  /** Count of artworks assigned to lamp preview (0–2). When `collectionArtworkCount` is omitted, idle turntable is off if at least one preview slot is filled. */
  lampPreviewCount?: number
  /**
   * Artworks in the experience collection/cart (not the lamp). When `0`, the lamp uses idle turntable; when `≥1`, idle spin follows the legacy `lampPreviewCount` rule. Cursor/touch orbit is always off on the 3D preview.
   */
  collectionArtworkCount?: number
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
  /** Ref to the main vertical reel (`overflow-y-auto`); used by [`ArtworkCarouselBar`](./ArtworkCarouselBar.tsx) to scroll the page while over the carousel. */
  experienceReelRef?: Ref<HTMLDivElement | null>
  /** When true and an artwork (not lamp) is shown, edition status renders above the Spline in the reel */
  editionLeadBeforeSpline?: boolean
  /** Street edition-states row for displayed artwork (scarcity ladder copy) */
  streetEditionRow?: StreetEditionStatesRow | null
  /** Early-access ladder pricing for displayed artwork */
  displayedProductEarlyAccess?: boolean
  /** When collection is empty and data is complete, featured bundle renders under the 3D preview in the reel */
  featuredBundleOffer?: FeaturedBundleFilterOffer | null
  bundlePreviewLamp?: ShopifyProduct | null
  bundlePreviewArtworks?: ShopifyProduct[] | null
}

export function SplineFullScreen({
  image1,
  image2,
  rotateToSide,
  rotateTrigger,
  resetTrigger = 0,
  onFrontSideSettled,
  lampPreviewCount = 0,
  collectionArtworkCount,
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
  experienceReelRef,
  editionLeadBeforeSpline = false,
  streetEditionRow = null,
  displayedProductEarlyAccess = false,
  featuredBundleOffer = null,
  bundlePreviewLamp = null,
  bundlePreviewArtworks = null,
}: SplineFullScreenProps) {
  const { theme } = useExperienceTheme()
  const featuredBundleDataReady =
    featuredBundleOffer != null &&
    bundlePreviewLamp != null &&
    Array.isArray(bundlePreviewArtworks) &&
    bundlePreviewArtworks.length === 2
  /** Render when lamp + pair + offer exist; CTA uses `offer.disabled` when not actionable. */
  const showFeaturedBundleSection = featuredBundleDataReady
  const [previewQuarterTurns, setPreviewQuarterTurns] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)
  /** True when Spline + top thumb column have scrolled mostly out of the reel — show a docked Back to top FAB. */
  const [backToTopDocked, setBackToTopDocked] = useState(false)
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
  /** Compact glass control — sits left, above carousel + add row (see docked wrapper padding). */
  const backToTopIconClass = cn(
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-[0.96]',
    'backdrop-blur-xl backdrop-saturate-150 shadow-md',
    theme === 'light'
      ? [
          'border border-white/80 bg-white/45 text-neutral-800',
          'shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)]',
          'hover:bg-white/60 hover:border-white',
        ]
      : [
          'border border-white/30 bg-white/18 text-[#f0e8e8]',
          'shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:bg-white/28 hover:border-white/45',
        ]
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const setScrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node
      assignRef(experienceReelRef, node)
    },
    [experienceReelRef]
  )
  /** Outer flex shell (reel + overlays). Used to forward wheel to `scrollRef` when the pointer is over overlays (top bar) that sit outside the scrolling reel. */
  const shellRef = useRef<HTMLDivElement>(null)
  const hasAccordion = !!displayedProduct
  const hasGallery = galleryImages.length > 1 // Skip first image (shown in details), need 2+ for gallery section
  /** One scroll section per image after the first (matches thumbnail slide indices from ArtworkInfoBar). */
  const gallerySectionCount = hasGallery ? galleryImages.length - 1 : 0
  const editionLead = !!(editionLeadBeforeSpline && hasAccordion && displayedProduct)
  /** Reel section index of the Spline block (0 when no edition lead; 1 when edition strip is above). */
  const splineSectionIndex = editionLead ? 1 : 0
  /** Reel section index of accordion body (details / GIF / artist); -1 if no accordion. */
  const accordionContentSectionIndex = editionLead ? 2 : hasAccordion ? 1 : -1
  /** First gallery image section index in the reel. */
  const galleryBaseSectionIndex = editionLead ? 3 : hasAccordion ? 2 : 1
  const sectionCount =
    (editionLead ? 3 : hasAccordion ? 2 : 1) + gallerySectionCount

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastReportedSectionRef = useRef(currentSlide)
  const scrollRafRef = useRef<number | null>(null)
  const lastProgrammaticSectionRef = useRef<number | null>(null)
  /** While > Date.now(), ignore midpoint-based slide sync (avoids fighting smooth scrollIntoView from thumbnails). */
  const ignoreSlideSyncUntilRef = useRef(0)
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // One-time reel scroll: down past the Spline block (artwork carousel hides) then back — first visit / tab session only.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(EXPERIENCE_REEL_SCROLL_HINT_KEY)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem(EXPERIENCE_REEL_SCROLL_HINT_KEY, '1')
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeoutIds: ReturnType<typeof setTimeout>[] = []
    let pollAttempts = 0
    let rafChainPending = false
    /** ~12s max wait for layout + Spline section height */
    const MAX_POLL_ATTEMPTS = 85
    const MIN_SCROLLABLE = 16

    const clearTimers = () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
      timeoutIds.forEach(clearTimeout)
      timeoutIds = []
    }

    const animateScroll = (
      scrollEl: HTMLDivElement,
      from: number,
      to: number,
      durationMs: number,
      done: () => void
    ) => {
      const t0 = performance.now()
      const step = (now: number) => {
        if (cancelled) return
        const u = Math.min(1, (now - t0) / durationMs)
        const eased = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2
        scrollEl.scrollTop = from + (to - from) * eased
        if (u < 1) requestAnimationFrame(step)
        else done()
      }
      requestAnimationFrame(step)
    }

    /** Content Y of spline section bottom; scrollTop >= this clears hero from view (matches carousel `splineInView` off). */
    const splineBottomScrollTop = (scrollEl: HTMLDivElement, spline: HTMLDivElement): number => {
      const portTop = scrollEl.getBoundingClientRect().top
      const splineTopInContent =
        spline.getBoundingClientRect().top - portTop + scrollEl.scrollTop
      return splineTopInContent + spline.offsetHeight
    }

    const runNudge = (scrollEl: HTMLDivElement): boolean => {
      if (cancelled || sessionStorage.getItem(EXPERIENCE_REEL_SCROLL_HINT_KEY)) return false
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
      if (maxScroll < MIN_SCROLLABLE) return false

      const spline = sectionRefs.current[splineSectionIndex]
      const start = scrollEl.scrollTop

      let target = maxScroll
      if (spline && spline.offsetHeight >= 64) {
        const pastSpline = splineBottomScrollTop(scrollEl, spline)
        target = Math.min(maxScroll, Math.max(start + MIN_SCROLLABLE, pastSpline))
      }

      // If we still barely move (e.g. flex layout), use a strong “past the fold” scroll
      if (target <= start + 24 && maxScroll > 40) {
        target = Math.min(
          maxScroll,
          start + Math.max(Math.floor(scrollEl.clientHeight * 0.58), 120)
        )
      }

      if (target <= start + 8) {
        target = maxScroll
      }
      if (target <= start + 8) return false

      sessionStorage.setItem(EXPERIENCE_REEL_SCROLL_HINT_KEY, '1')

      // Longer guard: carousel animation + two scroll tweens
      ignoreSlideSyncUntilRef.current = Date.now() + 5200
      lastReportedSectionRef.current = splineSectionIndex
      lastProgrammaticSectionRef.current = splineSectionIndex

      const leadMs = splineReady ? 380 : 720
      const downMs = 1050
      const pauseMs = 380
      const upMs = 950

      const t = window.setTimeout(() => {
        if (cancelled) return
        animateScroll(scrollEl, start, target, downMs, () => {
          if (cancelled) return
          const t2 = window.setTimeout(() => {
            if (cancelled) return
            animateScroll(scrollEl, scrollEl.scrollTop, start, upMs, () => {
              lastReportedSectionRef.current = splineSectionIndex
              lastProgrammaticSectionRef.current = splineSectionIndex
            })
          }, pauseMs)
          timeoutIds.push(t2)
        })
      }, leadMs)
      timeoutIds.push(t)
      return true
    }

    const trySchedule = () => {
      const el = scrollRef.current
      if (!el || cancelled) return
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll < MIN_SCROLLABLE) {
        pollAttempts += 1
        if (pollAttempts >= MAX_POLL_ATTEMPTS) clearTimers()
        return
      }
      const spline = sectionRefs.current[splineSectionIndex]
      if (!spline) {
        pollAttempts += 1
        if (pollAttempts >= MAX_POLL_ATTEMPTS) clearTimers()
        return
      }
      // Wait briefly for Spline / hero layout; then run anyway (fold fallback inside runNudge)
      if (spline.offsetHeight < 48 && pollAttempts < 35) {
        pollAttempts += 1
        return
      }
      if (rafChainPending) return
      rafChainPending = true
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rafChainPending = false
          if (cancelled) return
          const started = runNudge(el)
          if (started) clearTimers()
          else {
            pollAttempts += 1
            if (pollAttempts >= MAX_POLL_ATTEMPTS) clearTimers()
          }
        })
      })
    }

    intervalId = window.setInterval(trySchedule, 160)
    trySchedule()

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [splineReady, sectionCount, splineSectionIndex, hasAccordion, displayedProduct?.id, galleryImages.length, editionLeadBeforeSpline])

  useEffect(() => {
    if (!scrollRef.current || sectionCount <= 1) return
    if (lastProgrammaticSectionRef.current === currentSlide) {
      lastProgrammaticSectionRef.current = null
      return
    }
    const el = scrollRef.current
    const target = sectionRefs.current[currentSlide]
    if (!target) return

    lastProgrammaticSectionRef.current = currentSlide
    const slideIndex = currentSlide
    const clearProgrammaticScrollGuard = () => {
      ignoreSlideSyncUntilRef.current = 0
      lastReportedSectionRef.current = slideIndex
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current)
        programmaticScrollTimeoutRef.current = null
      }
    }
    const onScrollEnd = () => {
      el.removeEventListener("scrollend", onScrollEnd)
      clearProgrammaticScrollGuard()
    }
    ignoreSlideSyncUntilRef.current = Date.now() + 800
    el.addEventListener("scrollend", onScrollEnd, { passive: true })
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      el.removeEventListener("scrollend", onScrollEnd)
      clearProgrammaticScrollGuard()
    }, 850)
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    return () => {
      el.removeEventListener("scrollend", onScrollEnd)
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current)
        programmaticScrollTimeoutRef.current = null
      }
    }
  }, [currentSlide, sectionCount])

  const handleScroll = useCallback(() => {
    if (!onSlideChange || sectionCount <= 1) return
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      if (Date.now() < ignoreSlideSyncUntilRef.current) return
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

  const handleGalleryBackToTop = useCallback(() => {
    const el = scrollRef.current
    const target = sectionRefs.current[splineSectionIndex]
    if (!el || !target) return
    ignoreSlideSyncUntilRef.current = Date.now() + 800
    lastReportedSectionRef.current = splineSectionIndex
    lastProgrammaticSectionRef.current = splineSectionIndex
    onSlideChange?.(splineSectionIndex)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [onSlideChange, splineSectionIndex])

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

  // Forward vertical wheel from overlay UI (top bar / thumbnail slot) into the main reel — those nodes are not inside `scrollRef`, so the browser would not scroll the reel.
  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const wheelDeltaY = (e: WheelEvent, scrollEl: HTMLDivElement) => {
      let dy = e.deltaY
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) dy *= 16
      if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) dy *= scrollEl.clientHeight
      return dy
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return
      const scrollEl = scrollRef.current
      if (!scrollEl) return
      const t = e.target as Node | null
      if (!t || !shell.contains(t)) return
      if (scrollEl.contains(t)) return

      const host = t instanceof Element ? t : t.parentElement
      const horiz = host?.closest('[data-experience-carousel-strip], .overflow-x-auto')
      if (horiz && Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return

      const dy = wheelDeltaY(e, scrollEl)
      if (dy === 0) return
      const max = scrollEl.scrollHeight - scrollEl.clientHeight
      if (max <= 0) return
      const st = scrollEl.scrollTop
      if (dy < 0 && st <= 0) return
      if (dy > 0 && st >= max - 1) return
      scrollEl.scrollTop += dy
      e.preventDefault()
    }

    shell.addEventListener('wheel', onWheel, { passive: false })
    return () => shell.removeEventListener('wheel', onWheel)
  }, [])

  // Report when Spline section is in view (for carousel visibility)
  useEffect(() => {
    const scrollEl = scrollRef.current
    const splineEl = sectionRefs.current[splineSectionIndex]
    if (!scrollEl || !splineEl || !onSplineInView) return
    const observer = new IntersectionObserver(
      ([entry]) => onSplineInView(entry.isIntersecting),
      { root: scrollEl, rootMargin: '0px', threshold: 0.1 }
    )
    observer.observe(splineEl)
    return () => observer.disconnect()
  }, [onSplineInView, splineSectionIndex])

  // Dock Back to top at bottom of preview once the top reel (3D + thumbnail stack) is largely scrolled away
  useEffect(() => {
    if (!hasGallery) {
      setBackToTopDocked(false)
      return
    }
    let observer: IntersectionObserver | null = null
    let cancelled = false
    let rafOuter = 0
    let rafInner = 0
    const run = () => {
      const root = scrollRef.current
      const target = sectionRefs.current[splineSectionIndex]
      if (!root || !target || cancelled) return
      observer = new IntersectionObserver(
        ([entry]) => {
          if (cancelled) return
          // Below ~12% visible ≈ user has scrolled into details / gallery; top "slider" no longer usable
          setBackToTopDocked(entry.intersectionRatio < 0.12)
        },
        { root, rootMargin: '0px', threshold: [0, 0.05, 0.12, 0.2, 0.35, 0.5, 1] }
      )
      observer.observe(target)
    }
    rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(run)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(rafOuter)
      cancelAnimationFrame(rafInner)
      observer?.disconnect()
    }
  }, [hasGallery, sectionCount, galleryImages.length, hasAccordion, displayedProduct?.id, splineSectionIndex])

  return (
    <div
      ref={shellRef}
      className={cn(
      'absolute inset-0 w-full h-full min-w-0 min-h-0 flex flex-col',
      theme === 'light' ? 'bg-[#F5F5F5]' : 'bg-[#171515]',
      className
    )}
    >
      {/* One continuous reel: Spline at top, then images stacked — scroll down through all */}
      <div
        ref={setScrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          'flex flex-col flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-[20vh] touch-pan-y overscroll-contain'
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          // No scroll-snap: JS wheel forwarding sets scrollTop + preventDefault; y proximity snap
          // was snapping the reel back (scrollTop stuck ~64 while deltaY kept firing — see debug-2240e8.log).
        } as React.CSSProperties}
      >
        {/* Edition status (artworks only) — above Spline when editionLeadBeforeSpline */}
        {editionLead && displayedProduct && (
          <div
            ref={(r) => { sectionRefs.current[0] = r }}
            className="relative z-[5] -mb-5 flex w-full flex-shrink-0 sm:-mb-6 md:-mb-8"
          >
            <ArtworkAccordions
              key={`${displayedProduct.id}-edition-lead`}
              variant="editionOnly"
              product={displayedProduct}
              productIncludes={productIncludes}
              productSpecs={productSpecs}
              artistSlugOverride={artistSlugOverride}
              spotlightDataOverride={spotlightDataOverride}
            />
          </div>
        )}

        {/* Spline 3D — facade (LCP) then deferred Spline mount */}
        <div
          ref={(r) => { sectionRefs.current[splineSectionIndex] = r }}
          className={cn(
            'relative z-0 flex w-full flex-shrink-0 flex-col',
            !hasGallery && !hasAccordion
              ? 'flex-1 min-w-0'
              : hasAccordion
                ? 'min-h-[72svh]'
                : 'min-h-[100svh]'
          )}
        >
          <div className="flex-1 min-h-0 min-w-0 max-h-[min(72svh,820px)] relative">
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
              parentScrollMode="contain"
              reelScrollContainerRef={scrollRef}
              animate
              interactive={false}
              idleSpinEnabled={
                typeof collectionArtworkCount === 'number'
                  ? collectionArtworkCount === 0
                    ? true
                    : lampPreviewCount < 1
                  : lampPreviewCount < 1
              }
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
          {showFeaturedBundleSection && featuredBundleOffer && bundlePreviewLamp && bundlePreviewArtworks ? (
            <FeaturedArtistBundleSection
              theme={theme}
              offer={featuredBundleOffer}
              lamp={bundlePreviewLamp}
              artworks={[bundlePreviewArtworks[0]!, bundlePreviewArtworks[1]!]}
            />
          ) : null}
        </div>

        {/* Artist bio, artwork card, specs (full stack or content-only when edition is above Spline) */}
        {hasAccordion && displayedProduct && accordionContentSectionIndex >= 0 && (
          <div
            ref={(r) => { sectionRefs.current[accordionContentSectionIndex] = r }}
            className={cn(
              'relative z-0 flex-shrink-0 w-full min-h-[46svh] flex flex-col items-center justify-start',
              'mt-0 pt-3 pb-6 md:pt-4 md:pb-8'
            )}
          >
            <ArtworkAccordions
              key={displayedProduct.id}
              variant={editionLead ? 'contentOnly' : 'full'}
              product={displayedProduct}
              productIncludes={productIncludes}
              productSpecs={productSpecs}
              artistSlugOverride={artistSlugOverride}
              spotlightDataOverride={spotlightDataOverride}
              streetEdition={streetEditionRow}
              isEarlyAccess={displayedProductEarlyAccess}
            />
          </div>
        )}

        {/* Gallery: one scroll section per image after the first */}
        {galleryImages.length > 1 &&
          galleryImages.slice(1).map((img, idx) => {
            const sectionIndex = galleryBaseSectionIndex + idx
            return (
              <div
                key={img.url || idx}
                ref={(r) => {
                  sectionRefs.current[sectionIndex] = r
                }}
                className="flex-shrink-0 w-full flex flex-col items-center py-4"
              >
                <div className="w-full flex items-center justify-center py-3 px-4">
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
              </div>
            )
          })}
        {hasGallery && !backToTopDocked && (
          <div className="flex flex-shrink-0 justify-start px-4 pb-10 pt-4 md:px-6">
            <button
              type="button"
              onClick={handleGalleryBackToTop}
              className={backToTopIconClass}
              title="Back to top of preview"
              aria-label="Back to top of preview"
            >
              <ArrowUp className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        )}
      </div>

      {/* Docked back-to-top — left, compact; lifted above carousel strip (+ add artwork row) */}
      {hasGallery && backToTopDocked && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[19] flex justify-start pl-4 pr-4 md:pl-6 md:pr-6"
          style={{
            paddingBottom:
              'calc(4.75rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))',
          }}
        >
          <button
            type="button"
            onClick={handleGalleryBackToTop}
            className={cn('pointer-events-auto', backToTopIconClass)}
            title="Back to top of preview"
            aria-label="Back to top of preview"
          >
            <ArrowUp className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      )}

      {/* Top bar + thumbnails: hug Spline preview on desktop with max-width container.
          pointer-events-none on shells so empty flex space does not block wheel/touch on the 3D preview below. */}
      <div className="pointer-events-none absolute top-3 left-0 right-0 z-10 pt-safe md:left-1/2 md:right-auto md:w-full md:max-w-[min(92vw,768px)] md:-translate-x-1/2 md:px-4">
        {/* Mobile: title absolutely centered in full width; thumbnails stay top-right in normal flow (same row as before). */}
        <div className="pointer-events-none relative flex items-start justify-end gap-4 px-4 md:px-0">
          {topBarContent && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 z-[1] flex justify-center px-12 md:px-0',
                isDesktop && 'hidden'
              )}
            >
              <div className="pointer-events-auto flex w-full max-w-[min(92vw,20rem)] justify-center min-w-0">
                {typeof topBarContent === 'function'
                  ? topBarContent({ onRotate: () => setPreviewQuarterTurns((prev) => (prev + 3) % 4), isDesktop })
                  : topBarContent}
              </div>
            </div>
          )}
          {/* Thumbnails + rotate — right-aligned; z above title band for taps */}
          <div
            className={cn(
              'pointer-events-auto relative z-[2] flex flex-col items-end gap-2 flex-shrink-0',
              isDesktop && 'md:ml-auto'
            )}
          >
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
