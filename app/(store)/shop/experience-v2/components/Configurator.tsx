'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, SlidersHorizontal, ChevronUp, ChevronDown, LayoutGrid, ArrowLeftRight, Sun, Moon, FlaskConical, Eye, Info, Check, Plus, Minus, TicketPercent, ChevronRight, ShoppingCart, Camera, RotateCw, Globe, ShieldCheck, RotateCcw } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import type { QuizAnswers } from './IntroQuiz'
import type { SeasonPageInfo } from './ExperienceClient'
import { formatPriceCompact } from '@/lib/utils'

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

const EXPERIENCE_CART_KEY = 'sc-experience-cart'
const WIZARD_COMPLETED_KEY = 'sc-experience-wizard-completed'

function loadExperienceCart(ownsLamp: boolean): {
  cartOrder: string[]
  lampQuantity: number
  lampPaywallSkipped: boolean
  wizardCompleted: boolean
} {
  if (typeof window === 'undefined') {
    return { cartOrder: [], lampQuantity: 0, lampPaywallSkipped: false, wizardCompleted: false }
  }
  try {
    const raw = localStorage.getItem(EXPERIENCE_CART_KEY)
    const cart = !raw
      ? { cartOrder: [], lampQuantity: 0, lampPaywallSkipped: false }
      : (() => {
          const p = JSON.parse(raw) as Record<string, unknown>
          return {
            cartOrder: Array.isArray(p.cartOrder) ? p.cartOrder : [],
            lampQuantity: typeof p.lampQuantity === 'number' && p.lampQuantity >= 0 ? p.lampQuantity : 0,
            lampPaywallSkipped: !!p.lampPaywallSkipped,
          }
        })()
    const wizardCompleted = localStorage.getItem(WIZARD_COMPLETED_KEY) === '1'
    return { ...cart, wizardCompleted }
  } catch {
    return { cartOrder: [], lampQuantity: 0, lampPaywallSkipped: false, wizardCompleted: false }
  }
}

/** Retry chunk load on ChunkLoadError; reload page once if retry fails (stale dev cache). */
const CHUNK_RELOAD_KEY = 'spline_chunk_reload'
const loadSpline3DPreview = () =>
  import('@/app/template-preview/components/spline-3d-preview')
    .then((m) => ({ default: m.Spline3DPreview }))
    .catch((err) => {
      const isChunkError = err?.name === 'ChunkLoadError' || err?.message?.includes?.('Loading chunk')
      if (!isChunkError) throw err
      return import('@/app/template-preview/components/spline-3d-preview')
        .then((m) => ({ default: m.Spline3DPreview }))
        .catch((retryErr) => {
          if (typeof window !== 'undefined' && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
            window.location.reload()
            return new Promise(() => {})
          }
          throw retryErr
        })
    })

const Spline3DPreview = dynamic(loadSpline3DPreview, {
  ssr: false,
  loading: () => <SplinePreviewLoading />,
})
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import { ArtworkStrip } from './ArtworkStrip'
import { LampGridCard } from './LampGridCard'
import { getAdPreset, resolvePresetProducts } from '@/lib/experience/ad-presets'
import { spotlightOverridesForProduct } from '@/lib/shop/experience-spotlight-match'

import { ArtistSpotlightBanner } from './ArtistSpotlightBanner'
import { ArtworkDetail } from './ArtworkDetail'
import { FilterPanel, applyFilters, hasActiveFilters, DEFAULT_FILTERS, type FilterState } from './FilterPanel'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { useExperienceTheme } from '../ExperienceThemeContext'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'
import { trackViewItem, trackAddToCart, trackSearch, trackEnhancedEvent, isGAEnabled } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { useShopAuth } from '@/lib/shop/useShopAuth'
import { useRatingSync } from '@/lib/experience/useRatingSync'
import { setAffiliateDismissedCookie } from '@/lib/affiliate-tracking'
import { cn } from '@/lib/utils'
import {
  loadImagePosition,
  saveImagePosition as persistImagePosition,
  DEFAULT_SIDE_POSITION,
  DEFAULT_SIDE_B_POSITION,
} from '@/lib/experience-image-position'
import { useCameraFeed } from '../hooks/useCameraFeed'
import { SplineScenePreload } from '../SplineScenePreload'

/** Loading fallback for Spline 3D preview — theme-aware */
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

/** Always use the first/preview image of a product (featured or first in gallery). */
function getFirstImage(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

type SeasonTab = 'season1' | 'season2'

interface ConfiguratorProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: SeasonPageInfo
  pageInfoSeason2: SeasonPageInfo
  quizAnswers: QuizAnswers
  onRetakeQuiz: () => void
  /** Pre-filter by artist when arriving from artist link (e.g. Instagram) */
  initialFilters?: Pick<FilterState, 'artists'> | null
  /** Affiliate/vendor slug for initial artist spotlight (from cookie/URL); spotlight stays until user removes filter */
  initialArtistSlug?: string | null
  /** When true, request spotlight with ?unlisted=1 so API returns unlisted (early access UI) */
  forceUnlisted?: boolean
  /** When true, always show lamp paywall when user has no lamp (A/B skip variant must see paywall) */
  forceShowLampPaywall?: boolean
  /** Named ad preset key (?preset=X); bypasses blocking paywall, pins preset artworks first in grid */
  adPreset?: string
}

const LAMP_TRUST_CHIPS = [
  { icon: Globe, label: 'Free Shipping' },
  { icon: ShieldCheck, label: '1 year guarantee' },
  { icon: RotateCcw, label: '30 day returns' },
]

export function Configurator({
  lamp,
  productsSeason1: initialSeason1,
  productsSeason2: initialSeason2,
  pageInfoSeason1: initialPage1,
  pageInfoSeason2: initialPage2,
  quizAnswers,
  onRetakeQuiz,
  initialFilters,
  initialArtistSlug,
  forceUnlisted = false,
  forceShowLampPaywall = false,
  adPreset,
}: ConfiguratorProps) {
  useRatingSync()
  const { isAuthenticated } = useShopAuth()
  const [activeSeason, setActiveSeason] = useState<SeasonTab>('season2')
  const [crewCountMap, setCrewCountMap] = useState<Record<string, number>>({})
  const [collectedProductIds, setCollectedProductIds] = useState<Set<string>>(new Set())
  const [spotlightData, setSpotlightData] = useState<{
    vendorName: string
    vendorSlug: string
    bio?: string
    image?: string
    instagram?: string
    productIds: string[]
    seriesName?: string
    gifUrl?: string
    unlisted?: boolean
  } | null>(null)
  const [productsSeason1, setProductsSeason1] = useState<ShopifyProduct[]>(() => initialSeason1)
  const [productsSeason2, setProductsSeason2] = useState<ShopifyProduct[]>(() => initialSeason2)
  const [pageInfoSeason1, setPageInfoSeason1] = useState<SeasonPageInfo>(() => initialPage1)
  const [pageInfoSeason2, setPageInfoSeason2] = useState<SeasonPageInfo>(() => initialPage2)
  const [loadingMore, setLoadingMore] = useState(false)
  const [retryingArtworks, setRetryingArtworks] = useState(false)
  const products = activeSeason === 'season1' ? productsSeason1 : productsSeason2
  const pageInfo = activeSeason === 'season1' ? pageInfoSeason1 : pageInfoSeason2

  // Ad preset: resolve handles to products from loaded arrays; show all artworks toggle
  const resolvedPreset = useMemo(() => getAdPreset(adPreset), [adPreset])
  const allLoadedProducts = useMemo(() => [...productsSeason1, ...productsSeason2], [productsSeason1, productsSeason2])
  const presetProducts = useMemo(() => {
    if (!resolvedPreset) return []
    return resolvePresetProducts(resolvedPreset, allLoadedProducts)
  }, [resolvedPreset, allLoadedProducts])
  const [showAllArtworks, setShowAllArtworks] = useState(false)
  const [gridBlurred, setGridBlurred] = useState(true)

  const artworkStripScrollRef = useRef<HTMLDivElement>(null)
  /** True when current spotlight was loaded from affiliate (initialArtistSlug); switch to default when user removes filter */
  const spotlightFromAffiliateRef = useRef(false)

  const loadMoreForSeason = useCallback(async (season: SeasonTab) => {
    const info = season === 'season1' ? pageInfoSeason1 : pageInfoSeason2
    if (!info.hasNextPage || !info.endCursor || loadingMore) return
    const handle = season === 'season1' ? SEASON_1_HANDLE : SEASON_2_HANDLE
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/shop/experience/collection-products?handle=${encodeURIComponent(handle)}&after=${encodeURIComponent(info.endCursor)}&first=${LOAD_MORE_PAGE_SIZE}`
      )
      const data = await res.json().catch(() => ({}))
      const newProducts = data.products ?? []
      if (season === 'season1') {
        setProductsSeason1((prev) => [...prev, ...newProducts])
        setPageInfoSeason1({
          hasNextPage: data.hasNextPage ?? false,
          endCursor: data.endCursor ?? null,
        })
      } else {
        setProductsSeason2((prev) => [...prev, ...newProducts])
        setPageInfoSeason2({
          hasNextPage: data.hasNextPage ?? false,
          endCursor: data.endCursor ?? null,
        })
      }
    } finally {
      setLoadingMore(false)
    }
  }, [pageInfoSeason1, pageInfoSeason2, loadingMore])

  /** When server-side collection fetch timed out, retry loading both seasons from the API (client-side). */
  const retryLoadArtworks = useCallback(async () => {
    if (retryingArtworks) return
    setRetryingArtworks(true)
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/shop/experience/collection-products?handle=${encodeURIComponent(SEASON_1_HANDLE)}&first=${LOAD_MORE_PAGE_SIZE}`),
        fetch(`/api/shop/experience/collection-products?handle=${encodeURIComponent(SEASON_2_HANDLE)}&first=${LOAD_MORE_PAGE_SIZE}`),
      ])
      const data1 = await res1.json().catch(() => ({}))
      const data2 = await res2.json().catch(() => ({}))
      const list1 = data1.products ?? []
      const list2 = data2.products ?? []
      setProductsSeason1(list1)
      setProductsSeason2(list2)
      setPageInfoSeason1({
        hasNextPage: Boolean(data1.hasNextPage),
        endCursor: data1.endCursor ?? null,
      })
      setPageInfoSeason2({
        hasNextPage: Boolean(data2.hasNextPage),
        endCursor: data2.endCursor ?? null,
      })
    } finally {
      setRetryingArtworks(false)
    }
  }, [retryingArtworks])

  const scrollArtworkStripToTop = useCallback(() => {
    artworkStripScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const setActiveSeasonAndReset = useCallback((season: SeasonTab) => {
    setActiveSeason(season)
    setPreviewIndex(0)
    scrollArtworkStripToTop()
  }, [scrollArtworkStripToTop])
  const allProducts = useMemo(
    () => [...productsSeason1, ...productsSeason2],
    [productsSeason1, productsSeason2]
  )
  const [previewIndex, setPreviewIndex] = useState(0)
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

  const saveImagePosition = useCallback(() => {
    persistImagePosition({
      sideA: {
        scale: imageScale, offsetX: imageOffsetX, offsetY: imageOffsetY,
        scaleX: imageScaleX, scaleY: imageScaleY,
      },
      sideB: {
        scale: imageScaleB, offsetX: imageOffsetXB, offsetY: imageOffsetYB,
        scaleX: imageScaleXB, scaleY: imageScaleYB,
      },
    })
  }, [imageScale, imageOffsetX, imageOffsetY, imageScaleX, imageScaleY, imageScaleB, imageOffsetXB, imageOffsetYB, imageScaleXB, imageScaleYB])

  const [lampPreviewOrder, setLampPreviewOrder] = useState<string[]>([])
  const [splineResetTrigger, setSplineResetTrigger] = useState(0)
  const [rotateToSide, setRotateToSide] = useState<'A' | 'B' | null>(null)
  // Facade pattern: show static image immediately as LCP candidate; mount heavy Spline runtime
  // only after the browser is idle (requestIdleCallback) or the user taps the preview area.
  const [splineReady, setSplineReady] = useState(false)
  const [rotateTrigger, setRotateTrigger] = useState(0)
  const currentFrontSideRef = useRef<'A' | 'B'>('B')
  const [previewQuarterTurns, setPreviewQuarterTurns] = useState(0)
  const loadedCart = loadExperienceCart(quizAnswers.ownsLamp)
  const [cartOrder, setCartOrder] = useState<string[]>(() => loadedCart.cartOrder)
  /** Non-lamp owners start at 0; they must add lamp via paywall first, then choose artwork */
  const [lampQuantity, setLampQuantity] = useState(() => loadedCart.lampQuantity)
  const [detailProduct, setDetailProduct] = useState<ShopifyProduct | null>(null)
  const [detailProductFull, setDetailProductFull] = useState<ShopifyProduct | null>(null)
  const [detailProductLoading, setDetailProductLoading] = useState(false)
  const fullProductCacheRef = useRef<Map<string, ShopifyProduct>>(new Map())
  const prefetchingRef = useRef<Set<string>>(new Set())
  /** Mobile only: 'collapsed' = show preview, selector bar only; 'half' = selector visible alongside preview */
  const [selectorSheetState, setSelectorSheetState] = useState<'collapsed' | 'half'>('half')
  const [lampVariant, setLampVariant] = useState<'light' | 'dark'>('dark')
  const [panelStatus, setPanelStatus] = useState<{ sideA: boolean; sideB: boolean; sameObject: boolean } | null>(null)

  const hasSelection = cartOrder.length > 0

  const [isMobile, setIsMobile] = useState(false)
  const selectorBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Cycle selector state: collapsed <-> half (mobile only)
  const cycleSelectorState = useCallback(() => {
    setSelectorSheetState((s) => (s === 'collapsed' ? 'half' : 'collapsed'))
    // Notify Spline to resize after transition settles
    const delay = typeof window !== 'undefined' && window.innerWidth < 768 ? 600 : 400
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('experience-selector-settled'))
    }, delay)
  }, [])

  const previewVisible = true

  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  /** Spotlight card expanded state — vendor filter is applied only while true (not derived from filters, avoids affiliate name mismatch). */
  const [spotlightExpanded, setSpotlightExpanded] = useState(false)

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    if (newFilters === DEFAULT_FILTERS) scrollArtworkStripToTop()
  }, [scrollArtworkStripToTop])
  const [filterOpen, setFilterOpen] = useState(false)
  const [scrollToProductId, setScrollToProductId] = useState<string | null>(null)
  const [ratingsVersion, setRatingsVersion] = useState(0)
  const [previewEngaged, setPreviewEngaged] = useState(() => loadedCart.wizardCompleted)
  const [highlightStep, setHighlightStep] = useState(0)
  const highlightStepRef = useRef(highlightStep)
  highlightStepRef.current = highlightStep
  const [triedSteps, setTriedSteps] = useState<[boolean, boolean, boolean, boolean, boolean, boolean]>([false, false, false, false, false, false])
  const autoAdvancedStepsRef = useRef<[boolean, boolean, boolean, boolean, boolean, boolean]>([false, false, false, false, false, false])
  const [wizardPosition, setWizardPosition] = useState<{ top?: string; left?: string; right?: string; bottom?: string }>({ top: '0.75rem', left: '0.75rem' })
  const wizardCardRef = useRef<HTMLDivElement>(null)
  const lampButtonRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const chevronButtonRef = useRef<HTMLButtonElement>(null)
  
  // Unified wizard highlight style for consistent visual affordance
  const wizardHighlightClass = 'ring-2 ring-blue-400/90 shadow-[0_0_24px_rgba(59,130,246,0.95)] animate-pulse'
  const handleOpenFilter = useCallback(() => {
    setFilterOpen(true)
    setTriedSteps((prev) => {
      const next: [boolean, boolean, boolean, boolean, boolean, boolean] = [...prev]
      next[4] = true
      return next
    })
    if (highlightStepRef.current === 4) {
      if (isMobile) setHighlightStep(5)
      else setPreviewEngaged(true)
    }
  }, [isMobile])

  const handleCycleSelectorState = useCallback(() => {
    cycleSelectorState()
    setTriedSteps((prev) => {
      const next: [boolean, boolean, boolean, boolean, boolean, boolean] = [...prev]
      next[5] = true
      return next
    })
    if (highlightStepRef.current === 5) setPreviewEngaged(true)
  }, [cycleSelectorState])

  // Apply initial artist filter when parent passes it (e.g. deep links); expand spotlight so UI matches filtered grid.
  useEffect(() => {
    if (initialFilters?.artists?.length) {
      setFilters((prev) => ({ ...prev, artists: initialFilters!.artists }))
      setSpotlightExpanded(true)
    }
  }, [initialFilters])

  const isGift = quizAnswers.purpose === 'gift'

  const filteredProducts = useMemo(() => {
    return applyFilters(products, filters, searchQuery, cartOrder)
  }, [products, filters, searchQuery, cartOrder, ratingsVersion])

  const filteredAllProducts = useMemo(() => {
    return applyFilters(allProducts, filters, searchQuery, cartOrder)
  }, [allProducts, filters, searchQuery, cartOrder, ratingsVersion])

  const spotlightProducts = useMemo(() => {
    if (!spotlightData?.productIds?.length) return []
    const idSet = new Set(spotlightData.productIds)
    const numericSet = new Set(spotlightData.productIds.map((id) => id.replace(/^gid:\/\/shopify\/Product\//i, '') || id))
    return allProducts.filter(
      (p) =>
        idSet.has(p.id) ||
        numericSet.has(p.id) ||
        numericSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, ''))
    )
  }, [allProducts, spotlightData])

  /** Must match `product.vendor` for applyFilters — API vendorName can differ from Shopify. */
  const spotlightArtistVendorForFilter = useMemo(() => {
    if (!spotlightData) return ''
    const fromCatalog = spotlightProducts[0]?.vendor?.trim()
    return fromCatalog || spotlightData.vendorName
  }, [spotlightData, spotlightProducts])

  // When spotlight is expanded: filter to that artist and switch series. When collapsed: remove filter.
  const handleSpotlightSelect = useCallback((isExpanding: boolean) => {
    if (!spotlightData) return
    setSpotlightExpanded(isExpanding)
    const vendorKey = spotlightArtistVendorForFilter || spotlightData.vendorName
    if (isExpanding) {
      const idSet = new Set(spotlightData.productIds.map((id) => id.replace(/^gid:\/\/shopify\/Product\//i, '') || id))
      const inSeason1 = productsSeason1.some((p) => idSet.has(p.id) || idSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, '')))
      const inSeason2 = productsSeason2.some((p) => idSet.has(p.id) || idSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, '')))
      if (inSeason2 && activeSeason !== 'season2') setActiveSeason('season2')
      else if (inSeason1 && !inSeason2 && activeSeason !== 'season1') setActiveSeason('season1')
      setFilters((prev) => {
        if (prev.artists.includes(vendorKey)) return prev
        return { ...prev, artists: [...prev.artists, vendorKey] }
      })
    } else {
      setFilters((prev) => ({
        ...prev,
        artists: prev.artists.filter(
          (a) => a !== spotlightData.vendorName && a !== vendorKey
        ),
      }))
    }
  }, [spotlightData, spotlightArtistVendorForFilter, productsSeason1, productsSeason2, activeSeason])

  useEffect(() => {
    if (!spotlightData?.vendorName) return
    const vendorKey = spotlightArtistVendorForFilter || spotlightData.vendorName
    const inFilters =
      filters.artists.includes(spotlightData.vendorName) ||
      (vendorKey ? filters.artists.includes(vendorKey) : false)
    if (!inFilters) setSpotlightExpanded(false)
  }, [spotlightData?.vendorName, spotlightArtistVendorForFilter, filters.artists])

  useEffect(() => {
    if (!scrollToProductId) return
    const idx = filteredProducts.findIndex((p) => p.id === scrollToProductId)
    if (idx >= 0) setPreviewIndex(idx)
    const t = setTimeout(() => setScrollToProductId(null), 800)
    return () => clearTimeout(t)
  }, [scrollToProductId, filteredProducts])

  // Desktop: expand left panel when artwork detail is opened (from Info button or preview select)
  useEffect(() => {
    if (detailProduct && !isMobile) setSelectorSheetState('half')
  }, [detailProduct, isMobile])

  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus()
  }, [searchExpanded])

  // Prefetch full product when card enters view — so detail drawer opens instantly
  const prefetchProduct = useCallback((handle: string) => {
    if (!handle || handle === lamp.handle) return
    if (fullProductCacheRef.current.has(handle)) return
    if (prefetchingRef.current.has(handle)) return
    prefetchingRef.current.add(handle)
    fetch(`/api/shop/products/${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.product) {
          const full = data.product as ShopifyProduct
          fullProductCacheRef.current.set(handle, full)
        }
      })
      .catch(() => {
        // Best-effort prefetch only; ignore fetch failures.
      })
      .finally(() => { prefetchingRef.current.delete(handle) })
  }, [lamp.handle])

  // Fetch full product on-demand when opening artwork detail (list products are lightweight)
  useEffect(() => {
    if (!detailProduct) {
      setDetailProductFull(null)
      setDetailProductLoading(false)
      return
    }
    if (detailProduct.id === lamp.id) {
      setDetailProductFull(detailProduct)
      setDetailProductLoading(false)
      return
    }
    const handle = detailProduct.handle
    const cached = fullProductCacheRef.current.get(handle)
    if (cached) {
      setDetailProductFull(cached)
      setDetailProductLoading(false)
      return
    }
    let cancelled = false
    setDetailProductLoading(true)
    setDetailProductFull(null)
    fetch(`/api/shop/products/${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.product) return
        const full = data.product as ShopifyProduct
        fullProductCacheRef.current.set(handle, full)
        setDetailProductFull(full)
        setDetailProductLoading(false)
      })
      .catch(() => {
        if (!cancelled) setDetailProductLoading(false)
      })
    return () => { cancelled = true }
  }, [detailProduct, lamp.id])

  const previewed = filteredProducts[previewIndex] ?? filteredProducts[0]

  // E-commerce: track view_item when previewed artwork changes (stage: experience)
  useEffect(() => {
    if (!previewed) return
    const variant = previewed.variants?.edges?.[0]?.node
    trackViewItem({ ...storefrontProductToItem(previewed, variant, 1), item_list_name: 'experience' })
  }, [previewed?.id, previewIndex])

  // Fetch collected product IDs when authenticated (for "Collected" badge)
  useEffect(() => {
    if (!isAuthenticated) {
      setCollectedProductIds(new Set())
      return
    }
    let cancelled = false
    fetch('/api/shop/collected-products')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { productIds?: string[] } | null) => {
        if (!cancelled && data && Array.isArray(data.productIds)) {
          setCollectedProductIds(new Set(data.productIds))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isAuthenticated])

  // Fetch artist spotlight: use affiliate artist when present so spotlight starts as that artist until user removes filter
  useEffect(() => {
    let cancelled = false
    let url = initialArtistSlug
      ? `/api/shop/artist-spotlight?artist=${encodeURIComponent(initialArtistSlug)}`
      : '/api/shop/artist-spotlight'
    if (forceUnlisted && initialArtistSlug) url += '&unlisted=1'
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.vendorName && Array.isArray(data?.productIds)) {
          setSpotlightData(data)
          spotlightFromAffiliateRef.current = !!initialArtistSlug
          // Merge spotlight products so they appear in selector (Jack J.C. Art, etc.)
          const products = (data.products as ShopifyProduct[] | undefined) ?? []
          if (products.length) {
            setProductsSeason2((prev) => {
              const existingIds = new Set(prev.map((p) => p.id))
              const toAdd = products.filter((p) => !existingIds.has(p.id))
              if (toAdd.length === 0) return prev
              return [...prev, ...toAdd]
            })
          }
        } else {
          setSpotlightData(null)
          spotlightFromAffiliateRef.current = false
        }
      })
      .catch(() => {
        setSpotlightData(null)
        spotlightFromAffiliateRef.current = false
      })
    return () => { cancelled = true }
  }, [initialArtistSlug, forceUnlisted])

  // When user removes the affiliate artist from the filter (first session): only set "dismissed" cookie.
  // Spotlight stays as affiliate for the rest of the first session. Next load (refresh or second session)
  // will see dismissed and not apply filter; middleware will clear affiliate cookies then.
  useEffect(() => {
    if (!spotlightData || !spotlightFromAffiliateRef.current) return
    const vendorKey = spotlightArtistVendorForFilter || spotlightData.vendorName
    if (filters.artists.includes(spotlightData.vendorName) || filters.artists.includes(vendorKey)) return
    setAffiliateDismissedCookie()
  }, [filters.artists, spotlightData, spotlightArtistVendorForFilter])

  // Fetch crew counts when authenticated (for taste-similar social proof)
  useEffect(() => {
    if (!isAuthenticated || filteredProducts.length === 0) {
      setCrewCountMap({})
      return
    }
    const productIds = filteredProducts.map((p) => p.id).join(',')
    if (!productIds) return
    let cancelled = false
    fetch(`/api/crew/count?productIds=${encodeURIComponent(productIds)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, number> | null) => {
        if (!cancelled && data && typeof data === 'object') setCrewCountMap(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isAuthenticated, filteredProducts, ratingsVersion])
  const selectedProducts = useMemo(
    () => cartOrder.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean) as ShopifyProduct[],
    [allProducts, cartOrder]
  )

  // Lamp discount (7.5% per artwork, 14 artworks = 100% off) — matches OrderBar logic
  const ARTWORKS_PER_FREE_LAMP = 14
  const DISCOUNT_PER_ARTWORK = 7.5
  const lampPrice = parseFloat(lamp.priceRange?.minVariantPrice?.amount ?? '0')
  const artworkCount = selectedProducts.length
  const lampPrices: number[] = []
  const lampProgress: number[] = []
  for (let k = 1; k <= lampQuantity; k++) {
    const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
    const end = k * ARTWORKS_PER_FREE_LAMP
    const allocated = Math.max(0, Math.min(artworkCount, end) - start)
    const discountPct = Math.min(allocated * DISCOUNT_PER_ARTWORK, 100)
    lampPrices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    lampProgress.push(Math.min(100, (allocated / ARTWORKS_PER_FREE_LAMP) * 100))
  }
  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const lampSavings = lampQuantity > 0 ? lampQuantity * lampPrice - lampTotal : 0
  const discountBarLabel = 'Volume discount : 7.5% Off the Street lamp - for each artwork you add'
  const firstLampDiscountPercent = lampQuantity > 0 ? Math.min(Math.min(artworkCount, ARTWORKS_PER_FREE_LAMP) * DISCOUNT_PER_ARTWORK, 100) : 0
  const artworksTotal = selectedProducts.reduce((sum, p) => sum + parseFloat(p.priceRange?.minVariantPrice?.amount ?? '0'), 0)
  const orderTotal = lampTotal + artworksTotal
  const orderItemCount = selectedProducts.length + lampQuantity

  /** When true, user skipped paywall or deselected lamp — show artworks without requiring lamp. A/B skip variant always starts false so they must see paywall first. */
  const [lampPaywallSkipped, setLampPaywallSkipped] = useState(() => (forceShowLampPaywall ? false : loadedCart.lampPaywallSkipped))
  /** Session-only skip: resets on refresh. On ads page we use this so lamp card shows every new session but they can skip during the session. */
  const [sessionLampPaywallSkipped, setSessionLampPaywallSkipped] = useState(false)
  /** When user deselects lamp (quantity → 0), keep them on artworks */
  const handleLampQuantityChange = useCallback((n: number) => {
    setLampQuantity(n)
    if (n > 0) {
      setTriedSteps((prev) => { const next: [boolean, boolean, boolean, boolean, boolean, boolean] = [...prev]; next[3] = true; return next })
      if (highlightStepRef.current === 3) setHighlightStep(4)
    }
    if (n === 0 && !quizAnswers.ownsLamp) {
      setLampPaywallSkipped(true)
      setSessionLampPaywallSkipped(true)
    }
  }, [])

  const handleAdjustArtworkQuantity = useCallback((runStartIndex: number, delta: 1 | -1) => {
    setCartOrder((prev) => {
      const id = prev[runStartIndex]
      if (!id) return prev
      let end = runStartIndex
      while (end < prev.length && prev[end] === id) end++
      if (delta === -1) {
        if (end === runStartIndex) return prev
        const next = [...prev]
        next.splice(end - 1, 1)
        return next
      }
      const next = [...prev]
      next.splice(end, 0, id)
      return next
    })
  }, [])

  /** Lamp card: on ads use session skip only (card shows every new session, skip hides for current session). Else use persisted skip. */
  const showLampPaywall = lampQuantity === 0 && (adPreset ? !sessionLampPaywallSkipped : !lampPaywallSkipped)
  const showHighlightAnimation = false // temporarily hidden for user testing
  const totalWizardSteps = isMobile ? 6 : 5
  const lastWizardStep = totalWizardSteps - 1

  useEffect(() => {
    if (!isMobile && highlightStep > 4) setHighlightStep(4)
  }, [isMobile, highlightStep])

  // Mobile step visibility guard: ensure targets are visible before showing instructions
  useEffect(() => {
    if (!showHighlightAnimation || !isMobile) return
    
    // Ensure appropriate panel state and scroll position for each step
    const ensureTargetVisible = () => {
      if (highlightStep <= 2) {
        // Steps 0-2: Artwork card buttons - ensure first card is visible
        const firstCard = document.querySelector('[data-highlight-card]')
        if (firstCard) {
          firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        // Ensure selector is expanded so artwork strip is visible
        if (selectorSheetState === 'collapsed') {
          cycleSelectorState()
        }
      } else if (highlightStep === 3) {
        // Step 3: Lamp button (if present on mobile) - ensure selector is expanded
        // Note: Lamp button may not be visible on mobile, but step should still work
        if (selectorSheetState === 'collapsed') {
          cycleSelectorState()
        }
      } else if (highlightStep === 4 || highlightStep === 5) {
        // Steps 4-5: Filter and chevron buttons - ensure selector is expanded (they're in bottom bar)
        if (selectorSheetState === 'collapsed') {
          cycleSelectorState()
        }
      }
    }
    
    const timeoutId = setTimeout(ensureTargetVisible, 100)
    return () => clearTimeout(timeoutId)
  }, [showHighlightAnimation, isMobile, highlightStep, selectorSheetState, cycleSelectorState])

  // Position wizard card: fixed dock on mobile, contextual on desktop
  useEffect(() => {
    if (!showHighlightAnimation) {
      setWizardPosition({ top: '0.75rem', left: '0.75rem' })
      return
    }
    
    // Mobile: fixed bottom dock (no positioning calculations needed)
    if (isMobile) {
      setWizardPosition({ top: undefined, bottom: '5.5rem', left: '1rem', right: '1rem' })
      return
    }
    
    // Desktop: position near target element
    const updatePosition = () => {
      let targetElement: HTMLElement | null = null
      
      // Steps 0-2: buttons on artwork card (virtualized, use querySelector)
      if (highlightStep <= 2) {
        const btnType = highlightStep === 0 ? 'eye' : highlightStep === 1 ? 'info' : 'add'
        targetElement = document.querySelector(`[data-highlight-btn="${btnType}"]`) as HTMLElement
      } else if (highlightStep === 3) {
        // Lamp button in selector header (use ref for stability)
        targetElement = lampButtonRef.current
      } else if (highlightStep === 4) {
        // Filter button (use ref for stability)
        targetElement = filterButtonRef.current
      }
      
      if (!targetElement) {
        setWizardPosition({ top: '0.75rem', left: '0.75rem' })
        return
      }
      
      const rect = targetElement.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const measuredWizardRect = wizardCardRef.current?.getBoundingClientRect()
      const wizardHeight = measuredWizardRect?.height ?? 90
      const wizardWidth = Math.min(
        viewportWidth - 32,
        measuredWizardRect?.width ?? 460
      )
      const offset = 12
      
      let top: string | undefined
      let bottom: string | undefined
      const targetCenterX = rect.left + rect.width / 2
      
      if (spaceBelow >= wizardHeight + offset) {
        top = `${rect.bottom + offset}px`
      } else if (spaceAbove >= wizardHeight + offset) {
        bottom = `${viewportHeight - rect.top + offset}px`
      } else {
        bottom = '1rem'
      }
      
      const horizontalPadding = 16
      const bubbleLeft = Math.max(
        horizontalPadding,
        Math.min(viewportWidth - wizardWidth - horizontalPadding, targetCenterX - wizardWidth / 2)
      )
      const left = `${bubbleLeft}px`

      setWizardPosition({ top, bottom, left, right: undefined })
    }
    
    const timeoutId = setTimeout(updatePosition, 150)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showHighlightAnimation, highlightStep, isMobile])

  useEffect(() => {
    if (!showHighlightAnimation) return
    const completionByStep: [boolean, boolean, boolean, boolean, boolean, boolean] = [
      lampPreviewOrder.length > 0,
      !!detailProduct,
      cartOrder.length > 0,
      lampQuantity > 0,
      filterOpen,
      triedSteps[5] || selectorSheetState !== 'half',
    ]
    const step = highlightStepRef.current as 0 | 1 | 2 | 3 | 4 | 5
    if (step > lastWizardStep) {
      setPreviewEngaged(true)
      return
    }
    if (!completionByStep[step]) return
    if (autoAdvancedStepsRef.current[step]) return
    autoAdvancedStepsRef.current[step] = true
    setTriedSteps((prev) => {
      if (prev[step]) return prev
      const next: [boolean, boolean, boolean, boolean, boolean, boolean] = [...prev]
      next[step] = true
      return next
    })
    if (step < lastWizardStep) setHighlightStep(step + 1)
    else setPreviewEngaged(true)
  }, [
    showHighlightAnimation,
    lastWizardStep,
    lampPreviewOrder.length,
    detailProduct,
    cartOrder.length,
    lampQuantity,
    filterOpen,
    selectorSheetState,
    triedSteps,
  ])

  const { setOrderSummary, setOrderBarProps, orderBarRef, openOrderBar, setDiscountCelebrationAmount } = useExperienceOrder()
  const { theme, setTheme } = useExperienceTheme()
  const [arCameraOn, setArCameraOn] = useState(false)
  const { videoRef, status: cameraStatus, error: cameraError, requestAccess, stopStream, isSupported: isCameraSupported } = useCameraFeed()

  const handleArCameraToggle = useCallback(() => {
    if (arCameraOn) {
      stopStream()
      setArCameraOn(false)
    } else {
      setArCameraOn(true)
      requestAccess()
    }
  }, [arCameraOn, stopStream, requestAccess])

  const isArModeActive = arCameraOn && cameraStatus === 'active'

  useEffect(() => {
    if (arCameraOn && (cameraStatus === 'denied' || cameraStatus === 'error')) {
      setArCameraOn(false)
    }
  }, [arCameraOn, cameraStatus])

  // Persist cart state so it survives refresh
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(
        EXPERIENCE_CART_KEY,
        JSON.stringify({
          cartOrder,
          lampQuantity,
          lampPaywallSkipped,
        })
      )
    } catch {
      // Ignore quota/parse errors
    }
  }, [cartOrder, lampQuantity, lampPaywallSkipped])

  // Persist wizard completed so it stays closed across sessions
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (previewEngaged) {
        localStorage.setItem(WIZARD_COMPLETED_KEY, '1')
      }
    } catch {
      // Ignore quota errors
    }
  }, [previewEngaged])

  useEffect(() => {
    setOrderSummary({ total: orderTotal, itemCount: orderItemCount })
  }, [orderTotal, orderItemCount, setOrderSummary])

  // Provide OrderBar props to shared OrderBar (rendered in ExperienceClient)
  useEffect(() => {
    setOrderBarProps({
      lamp,
      selectedArtworks: selectedProducts,
      lampQuantity,
      onLampQuantityChange: handleLampQuantityChange,
      onAdjustArtworkQuantity: handleAdjustArtworkQuantity,
      onSelectArtwork: (product) => {
        const inSeason1 = productsSeason1.some((p) => p.id === product.id)
        if (inSeason1 && activeSeason !== 'season1') setActiveSeasonAndReset('season1')
        if (!inSeason1 && activeSeason !== 'season2') setActiveSeasonAndReset('season2')
        setScrollToProductId(product.id)
      },
      onViewLampDetail: setDetailProduct,
      isGift,
      lampPrice,
      lampTotal,
      discountBarLabel,
      artworkCount,
      lampSavings,
      lampProgressPercent: lampQuantity > 0 ? (lampProgress[lampProgress.length - 1] ?? 0) : 0,
      pastLampPaywall: !showLampPaywall,
      collectedProductIds,
      wizardHighlightStep: highlightStep,
      wizardHighlightActive: showHighlightAnimation,
    })
  }, [
    lamp,
    selectedProducts,
    lampQuantity,
    handleLampQuantityChange,
    handleAdjustArtworkQuantity,
    productsSeason1,
    activeSeason,
    setActiveSeasonAndReset,
    setScrollToProductId,
    setDetailProduct,
    isGift,
    lampPrice,
    lampTotal,
    discountBarLabel,
    artworkCount,
    lampSavings,
    showLampPaywall,
    collectedProductIds,
    highlightStep,
    showHighlightAnimation,
    setOrderBarProps,
  ])

  // Lamp preview = last 2 selected on lamp (tap on card; separate from cart)
  const sideA = lampPreviewOrder[0] ?? null
  const sideB = lampPreviewOrder[1] ?? null

  const headline = isGift
    ? 'Build a gift'
    : quizAnswers.ownsLamp
      ? 'Add to your collection'
      : 'Build your lamp'

  // Resolve side products for the 3D preview — lamp only shows user-selected artworks
  const sideAProduct = sideA ? allProducts.find((p) => p.id === sideA) ?? null : null
  const sideBProduct = sideB ? allProducts.find((p) => p.id === sideB) ?? null : null
  // When 0 selected: both sides empty (user selects artworks to preview)
  // When 1 selected: only side A shows the artwork (side B remains empty)
  // When 2 selected: each side shows its selection
  const image1Fallback = sideAProduct ? (getShopifyImageUrl(getFirstImage(sideAProduct), 1200) ?? getFirstImage(sideAProduct)) : null
  const image2Fallback = sideBProduct ? (getShopifyImageUrl(getFirstImage(sideBProduct), 1200) ?? getFirstImage(sideBProduct)) : null

  // Pre-warm the Supabase cache in the background when a product is selected.
  // We do NOT use the returned URL directly in Spline — the resized Shopify fallback is passed
  // directly so Spline only ever sees one URL change per product (no double-fire that causes flash).
  useEffect(() => {
    if (!sideAProduct || !image1Fallback) return
    const currentProductId = sideAProduct.id
    fetch(`/api/spline-artwork?productId=${encodeURIComponent(currentProductId)}&url=${encodeURIComponent(image1Fallback)}`)
      .catch(() => {})
  }, [sideAProduct?.id, image1Fallback])

  useEffect(() => {
    if (!sideBProduct || !image2Fallback) return
    const currentProductId = sideBProduct.id
    fetch(`/api/spline-artwork?productId=${encodeURIComponent(currentProductId)}&url=${encodeURIComponent(image2Fallback)}`)
      .catch(() => {})
  }, [sideBProduct?.id, image2Fallback])

  // Pass the resized Shopify URL directly to Spline — single URL change per product, no flash.
  const image1 = image1Fallback
  const image2 = image2Fallback

  const handleSwapSides = useCallback(() => {
    setLampPreviewOrder((prev) =>
      prev.length >= 2 ? [prev[1], prev[0]] : prev
    )
  }, [])

  const getSideToShowForProduct = useCallback((order: string[], productId: string): 'A' | 'B' => {
    const productIndex = order.indexOf(productId)
    // With swapLampSides=true in Spline3DPreview:
    // index 0 (image1/sideA) renders on Side B object
    // index 1 (image2/sideB) renders on Side A object
    if (productIndex === 0) return 'B'
    if (productIndex === 1) return 'A'
    return 'A'
  }, [])

  const handleLampSelect = useCallback((product: ShopifyProduct) => {
    const wasInPreview = lampPreviewOrder.includes(product.id)
    setLampPreviewOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) {
        // Removing artwork: rotate toward the side that still has artwork.
        const newOrder = prev.filter((id) => id !== product.id)
        if (newOrder.length === 0) {
          setSplineResetTrigger((t) => t + 1)
          setRotateToSide(null)
        } else {
          const remainingId = newOrder[0]
          const sideToShow = getSideToShowForProduct(newOrder, remainingId)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
        }
        return newOrder
      }
      // With both slots occupied, replace the side that is currently hidden
      // so the visible side does not jump before rotate-in.
      const newOrder = prev.length >= 2
        ? (currentFrontSideRef.current === 'A'
          ? [product.id, prev[1]]
          : [prev[0], product.id])
        : [...prev, product.id]

      // Determine which side the new artwork is on AFTER adding it
      // newOrder[0] is sideA (becomes image1), newOrder[1] is sideB (becomes image2)
      // With swapLampSides=true: image1 goes to Side B object, image2 goes to Side A object
      // So: if product is at index 0 (sideA/image1) → shows on Side B object → rotate to 'B'
      //     if product is at index 1 (sideB/image2) → shows on Side A object → rotate to 'A'
      const sideToShow = getSideToShowForProduct(newOrder, product.id)
      
      // Increment trigger to force re-trigger even if rotating to same side
      setRotateTrigger((prev) => prev + 1)
      setRotateToSide(sideToShow)
      
      return newOrder
    })
    // Desktop: when user selects an artwork for preview, open its information card in the left panel
    if (!isMobile && !wasInPreview) {
      setDetailProduct(product)
      setSelectorSheetState('half') // Expand left panel to show artwork info
    }
  }, [getSideToShowForProduct, isMobile, lampPreviewOrder])

  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)

  const handleAddToCart = useCallback((product: ShopifyProduct) => {
    const isAdding = !cartOrder.includes(product.id)
    setCartOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) return prev.filter((id) => id !== product.id)
      return [...prev, product.id]
    })
    if (isAdding) {
      const variant = product.variants?.edges?.[0]?.node
      trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience' })
      setLastAddedProductId(product.id)
      setLampPreviewOrder((prev) => {
        const idx = prev.indexOf(product.id)
        if (idx >= 0) {
          // Keep preview order, but still rotate to that side for consistency.
          const sideToShow = getSideToShowForProduct(prev, product.id)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          return prev
        }
        // Match eye-select replacement behavior so model side changes are consistent.
        const newOrder = prev.length >= 2
          ? (currentFrontSideRef.current === 'A'
            ? [product.id, prev[1]]
            : [prev[0], product.id])
          : [...prev, product.id]
        const sideToShow = getSideToShowForProduct(newOrder, product.id)
        setRotateTrigger((t) => t + 1)
        setRotateToSide(sideToShow)
        return newOrder
      })
      const savingsFromOneArtwork = lampPrice * (DISCOUNT_PER_ARTWORK / 100)
      if (savingsFromOneArtwork >= 0.01) setDiscountCelebrationAmount(savingsFromOneArtwork)
    } else {
      // Removing from cart: keep Spline in sync with the strip (same IDs as lampPreviewOrder).
      setLampPreviewOrder((prev) => {
        const idx = prev.indexOf(product.id)
        if (idx < 0) return prev
        const newOrder = prev.filter((id) => id !== product.id)
        if (newOrder.length === 0) {
          setSplineResetTrigger((t) => t + 1)
          setRotateToSide(null)
        } else {
          const remainingId = newOrder[0]
          const sideToShow = getSideToShowForProduct(newOrder, remainingId)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
        }
        return newOrder
      })
    }
  }, [cartOrder, lampPrice, setDiscountCelebrationAmount, getSideToShowForProduct])

  useEffect(() => {
    if (!lastAddedProductId) return
    const t = setTimeout(() => setLastAddedProductId(null), 1200)
    return () => clearTimeout(t)
  }, [lastAddedProductId])

  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index)
    setSelectorSheetState((s) => (s === 'collapsed' ? 'half' : s))
  }, [])

  const activeFilterCount = (filters.artists.length > 0 ? 1 : 0) +
    (filters.tags.length > 0 ? 1 : 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0) +
    (filters.minStarRating !== null ? 1 : 0)

  if (products.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-950 text-white">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3 text-[#FFBA94]">Artworks unavailable</h1>
          <p className="text-neutral-400 mb-6">
            {retryingArtworks
              ? 'Loading artworks…'
              : "We couldn't load the artworks. You can try again or refresh the page."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={retryLoadArtworks}
              disabled={retryingArtworks}
              className="inline-block px-6 py-2.5 bg-white text-neutral-950 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {retryingArtworks ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin align-middle mr-2" />
                  Loading…
                </>
              ) : (
                'Try again'
              )}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              disabled={retryingArtworks}
              className="inline-block px-6 py-2.5 bg-transparent border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-70"
            >
              Refresh page
            </button>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 bg-transparent border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row md:flex-row-reverse h-full bg-white md:bg-transparent">
      {/* 3D Lamp viewer — on mobile: size depends on selectorSheetState */}
      <motion.div
        data-wizard-spline
        layout={false}
        className={cn(
          'relative overflow-hidden flex-shrink-0 transition-[height,min-height,flex-basis] duration-200 ease-out',
          'max-w-[100vw] max-h-[100dvh] min-w-0',
          isArModeActive ? 'bg-transparent' : (theme === 'light' ? 'bg-[#F5F5F5]' : 'bg-[#171515]'),
          /* Desktop: side-by-side, preview 60% — bigger (75%) when selector collapsed */
          'md:flex-none md:h-full md:min-h-0',
          selectorSheetState === 'collapsed' ? 'md:w-[75%]' : 'md:w-[60%]',
          /* Mobile: 2 states — larger preview when selector collapsed; 40/60 split when half */
          selectorSheetState === 'collapsed' && 'min-h-[55dvh] flex-1',
          selectorSheetState !== 'collapsed' && (showHighlightAnimation ? 'flex-[25] min-h-0 basis-0' : 'flex-[4] min-h-0 basis-0')
        )}
        style={{ 
          maxHeight: '100dvh',
          maxWidth: '100vw',
        }}
      >
        <div className="relative w-full h-full">
          <SplineScenePreload />
          {isArModeActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover [transform:scaleX(-1)]"
              aria-hidden
            />
          )}
          <ComponentErrorBoundary
            componentName="Spline3DPreview"
            fallback={
              <div className={cn(
                'flex h-full w-full items-center justify-center',
                theme === 'light' ? 'bg-neutral-200/80' : 'bg-neutral-900/80'
              )}>
                <div className="text-center px-4">
                  <p className={cn('text-sm', theme === 'light' ? 'text-neutral-600' : 'text-white/70')}>3D preview unavailable</p>
                  <p className={cn('text-xs mt-1', theme === 'light' ? 'text-neutral-500' : 'text-white/50')}>You can still browse and add artworks below.</p>
                </div>
              </div>
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
              idleSpinEnabled={lampPreviewOrder.length === 0}
              className="relative w-full h-full"
              onPanelsFound={setPanelStatus}
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
              resetTrigger={splineResetTrigger}
              cameraFeedMode={isArModeActive}
              rotateToSide={rotateToSide}
              rotateTrigger={rotateTrigger}
              onFrontSideSettled={(side) => { currentFrontSideRef.current = side }}
              previewQuarterTurns={previewQuarterTurns}
            />
          </ComponentErrorBoundary>
        </div>

        {/* AR camera + Light/dark mode toggles — overlay in Spline preview (camera toggle hidden for now) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {false && isCameraSupported && (
            <button
              type="button"
              onClick={handleArCameraToggle}
              disabled={cameraStatus === 'loading'}
              aria-label={arCameraOn ? 'Turn off camera view' : 'View with camera (AR preview)'}
              aria-pressed={arCameraOn}
              title={cameraStatus === 'denied' || cameraStatus === 'error' ? (cameraError ?? 'Camera unavailable') : undefined}
              className={cn(
                'inline-flex items-center justify-center p-2 rounded-lg backdrop-blur-sm transition-colors cursor-pointer',
                arCameraOn
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/20 dark:bg-amber-400/20 hover:bg-amber-500/30'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-[#f0e8e8]/80 dark:hover:text-[#f0e8e8] bg-white/80 dark:bg-[#171515]/70 hover:bg-white dark:hover:bg-black/60',
                (cameraStatus === 'denied' || cameraStatus === 'error') && 'opacity-70'
              )}
            >
              {cameraStatus === 'loading' ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
              ) : (
                <Camera size={20} className="shrink-0" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreviewQuarterTurns((prev) => (prev + 3) % 4)}
            aria-label="Rotate preview 90 degrees"
            className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-[#f0e8e8]/80 dark:hover:text-[#f0e8e8] bg-white/80 dark:bg-[#171515]/70 hover:bg-white dark:hover:bg-black/60 backdrop-blur-sm transition-colors cursor-pointer"
            title="Rotate 90 degrees"
          >
            <RotateCw size={20} className="shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-[#f0e8e8]/80 dark:hover:text-[#f0e8e8] bg-white/80 dark:bg-[#171515]/70 hover:bg-white dark:hover:bg-black/60 backdrop-blur-sm transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />}
          </button>
        </div>

        {/* Wizard explanation card — chat bubble style, positioned next to highlighted button */}
        {showHighlightAnimation && (
          <div
            className={cn(
              'fixed z-50'
            )}
            style={{
              top: wizardPosition.top,
              bottom: wizardPosition.bottom,
              left: wizardPosition.left,
              right: wizardPosition.right,
            }}
          >
            <div 
              ref={wizardCardRef}
              className={cn(
                'bg-blue-500 dark:bg-blue-600 border border-blue-400 dark:border-blue-500 shadow-2xl transition-all duration-200',
                // Mobile: positioned next to button
                isMobile 
                  ? 'w-full max-w-[400px] mx-auto rounded-2xl px-4 py-3'
                  : 'md:max-w-[460px] rounded-lg px-2.5 py-2'
              )}
              aria-live="polite"
            >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'font-semibold tracking-wide uppercase text-white/85 mb-1',
                    isMobile ? 'text-[11px]' : 'text-[10px]'
                  )}>
                    Step {Math.min(highlightStep + 1, totalWizardSteps)} of {totalWizardSteps}
                  </p>
                  <p className={cn(
                    'font-semibold text-white flex items-center gap-1 flex-wrap',
                    isMobile ? 'text-sm leading-snug' : 'text-xs'
                  )}>
                  {highlightStep === 0 && (
                    <>
                      Tap <Eye className={cn('shrink-0 text-white', isMobile ? 'w-5 h-5' : 'w-4 h-4')} aria-hidden /> to preview the artwork on the 3d viewer
                    </>
                  )}
                  {highlightStep === 1 && (
                    <>
                      Tap <Info className={cn('shrink-0 text-white', isMobile ? 'w-5 h-5' : 'w-4 h-4')} aria-hidden /> for more info about the artwork & artist
                    </>
                  )}
                  {highlightStep === 2 && (
                    <>
                      Tap{' '}
                      <span className={cn(
                        'inline-flex items-center justify-center rounded text-white shrink-0',
                        isMobile ? 'px-2 py-1 text-xs font-medium bg-white/20' : 'px-1.5 py-0.5 text-[10px] font-medium bg-white/20'
                      )}>
                        Add
                      </span>{' '}
                      to add to your cart <ShoppingCart className={cn('shrink-0 text-white', isMobile ? 'w-5 h-5' : 'w-4 h-4')} aria-hidden />
                    </>
                  )}
                  {highlightStep === 3 && (
                    <>
                      Tap{' '}
                      <svg viewBox="0 0 306 400" fill="currentColor" className={cn('shrink-0 text-white', isMobile ? 'w-5 h-6' : 'w-4 h-5')} aria-hidden xmlns="http://www.w3.org/2000/svg">
                        <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                      </svg>{' '}
                      the + - to add or remove Street lamps
                    </>
                  )}
                  {highlightStep === 4 && (
                    <>
                      Tap <SlidersHorizontal className={cn('shrink-0 text-white', isMobile ? 'w-5 h-5' : 'w-4 h-4')} aria-hidden /> the filter to narrow by artist, price & more
                    </>
                  )}
                  {isMobile && highlightStep === 5 && (
                    <>
                      Tap{' '}
                      {selectorSheetState === 'half' ? (
                        <ChevronUp className={cn('shrink-0 text-white', isMobile ? 'w-5 h-5' : 'w-4 h-4')} aria-hidden />
                      ) : (
                        <ChevronDown className={cn('shrink-0 text-white', isMobile ? 'w-5 h-5' : 'w-4 h-4')} aria-hidden />
                      )}{' '}
                      to expand / collapse view
                    </>
                  )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (highlightStep < lastWizardStep) setHighlightStep((s) => s + 1)
                    else setPreviewEngaged(true)
                  }}
                  className={cn(
                    'flex items-center gap-0.5 text-white/90 hover:text-white font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded',
                    isMobile ? 'text-sm px-2 py-1' : 'text-xs'
                  )}
                  aria-label={highlightStep < lastWizardStep ? 'Next tip' : 'Finish wizard'}
                >
                  {highlightStep < lastWizardStep ? <>Next <ChevronRight className={isMobile ? 'w-4 h-4' : 'w-3 h-3'} /></> : 'Got it'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewEngaged(true)}
                  className={cn(
                    'flex items-center justify-center text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded',
                    isMobile ? 'w-7 h-7' : 'w-5 h-5'
                  )}
                  aria-label="Skip tips"
                >
                  <X className={isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* No collapse button — tap the selector bar to switch */}

        {/* Side B unavailable notice */}
        {previewVisible && panelStatus && !panelStatus.sideB && (
          <div className="absolute top-14 left-3 right-3 z-20 px-2 py-1.5 rounded-lg bg-amber-500/90 text-white text-[10px] font-medium text-center">
            Side B not found in 3D scene — edit the lamp in Spline to add a second panel
          </div>
        )}
        {previewVisible && panelStatus?.sideB && panelStatus?.sameObject && (
          <div className="absolute top-14 left-3 right-3 z-20 px-2 py-1.5 rounded-lg bg-amber-500/90 text-white text-[10px] font-medium text-center">
            Both sides share one panel — A and B will show the same image
          </div>
        )}
        {/* Light/dark lamp toggle — hidden for now */}
        {false && previewVisible && (
          <button
            type="button"
            onClick={() => setLampVariant((v) => (v === 'light' ? 'dark' : 'light'))}
            className="absolute top-4 right-4 z-20 flex items-center justify-center gap-1.5 w-9 h-9 rounded-full bg-black/65 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
            aria-label={lampVariant === 'light' ? 'Switch to dark lamp' : 'Switch to light lamp'}
          >
            {lampVariant === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}

        {/* Test $0 order — small icon in corner (dev/testing) — hidden for now */}
        {false && previewVisible && (
          <button
            type="button"
            onClick={() => orderBarRef.current?.testZeroOrder()}
            className="absolute bottom-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/65 text-white/80 hover:text-white transition-colors backdrop-blur-sm"
            aria-label="Test $0 order"
            title="Test $0 order"
          >
            <FlaskConical className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Lamp side labels + swap + position — order = last 2 selected */}
        {previewVisible && (
          <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 z-20 space-y-2">
            {/* Image position controls (hidden — defaults in lib/experience-image-position.ts) */}
            {false && (
            <div className="rounded-lg bg-black/50 backdrop-blur-sm p-2 space-y-1.5 max-h-[50vh] overflow-y-auto">
              <span className="text-[10px] text-white/90 font-medium block">Side A</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">Size</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={imageScale}
                  onChange={(e) => setImageScale(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-7 tabular-nums">{Math.round(imageScale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">W</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.01"
                  value={imageScaleX}
                  onChange={(e) => setImageScaleX(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageScaleX.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">H</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={imageScaleY}
                  onChange={(e) => setImageScaleY(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageScaleY.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">X</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={imageOffsetX}
                  onChange={(e) => setImageOffsetX(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageOffsetX.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">Y</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={imageOffsetY}
                  onChange={(e) => setImageOffsetY(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageOffsetY.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-white/90 font-medium block pt-1 border-t border-white/20">Side B</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">Size</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={imageScaleB}
                  onChange={(e) => setImageScaleB(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-7 tabular-nums">{Math.round(imageScaleB * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">W</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.01"
                  value={imageScaleXB}
                  onChange={(e) => setImageScaleXB(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageScaleXB.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">H</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.01"
                  value={imageScaleYB}
                  onChange={(e) => setImageScaleYB(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageScaleYB.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">X</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={imageOffsetXB}
                  onChange={(e) => setImageOffsetXB(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageOffsetXB.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">Y</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={imageOffsetYB}
                  onChange={(e) => setImageOffsetYB(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 accent-white"
                />
                <span className="text-[10px] text-white/60 w-12 tabular-nums text-right">{imageOffsetYB.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={saveImagePosition}
                className="w-full mt-1 py-1.5 rounded text-[10px] font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                Save as default
              </button>
            </div>
            )}
            {false && (sideAProduct || sideBProduct) && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                  <span className="opacity-60">A:</span>
                  <span className="truncate max-w-[60px]">{sideAProduct?.title ?? '—'}</span>
                </div>
                <button
                  onClick={handleSwapSides}
                  disabled={!sideAProduct || !sideBProduct}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Swap sides"
                  title="Swap A ↔ B"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                  <span className="opacity-60">B:</span>
                  <span className="truncate max-w-[60px]">{sideBProduct?.title ?? '—'}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </motion.div>

      {/* Right: Selector Panel — 3 states on mobile: collapsed | half | full */}
      <motion.div
        layout={false}
        className={cn(
          'relative flex flex-col bg-white dark:bg-[#171515] overflow-hidden min-h-0 transition-[height,flex] duration-200 ease-out',
          /* Desktop: always full */
          'md:flex-1 md:h-full',
          /* Mobile: 2 states — when collapsed, keep expand tab visible (min 56px); 60/40 split when half */
          selectorSheetState === 'collapsed' && 'min-h-[56px] flex-shrink-0 md:h-auto md:min-h-0',
          selectorSheetState !== 'collapsed' && (showHighlightAnimation ? 'flex-[75] min-h-0 basis-0' : 'flex-[6] min-h-0 basis-0')
        )}
      >
        {/* Selector UI */}
        <>
        {/* Step indicator bar — mobile only; on desktop steps are in top toolbar (hidden) */}
        {false && selectorSheetState !== 'collapsed' && (
          <div className="md:hidden flex-shrink-0 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#171515]">
            {/* Step 1 */}
            <div className={cn('flex items-center gap-1.5', lampQuantity === 0 ? 'opacity-100' : 'opacity-60')}>
              <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0', lampQuantity === 0 ? 'bg-[#047AFF] text-white' : 'bg-[#047AFF] text-white')}>
                {lampQuantity > 0 ? <Check className="w-2.5 h-2.5" /> : '1'}
              </span>
              <span className={cn('text-xs font-semibold whitespace-nowrap', lampQuantity === 0 ? 'text-[#047AFF]' : 'text-neutral-600 dark:text-neutral-400')}>
                {lampQuantity === 0 ? 'Add Street Lamp' : ''}
              </span>
            </div>
            <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600 shrink-0" />
            {/* Step 2 */}
            <div className={cn('flex items-center gap-1.5', lampQuantity > 0 && cartOrder.length === 0 ? 'opacity-100' : lampQuantity > 0 && cartOrder.length > 0 ? 'opacity-60' : 'opacity-40')}>
              <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0', lampQuantity > 0 && cartOrder.length === 0 ? 'bg-[#047AFF] text-white' : lampQuantity > 0 && cartOrder.length > 0 ? 'bg-[#047AFF] text-white' : 'bg-neutral-400 dark:bg-neutral-600 text-white')}>
                {lampQuantity > 0 && cartOrder.length > 0 ? <Check className="w-2.5 h-2.5" /> : '2'}
              </span>
              <span className={cn('text-xs font-semibold whitespace-nowrap', lampQuantity > 0 && cartOrder.length === 0 ? 'text-[#047AFF]' : lampQuantity > 0 && cartOrder.length > 0 ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-500')}>
                {lampQuantity === 0 ? 'Add your Art' : cartOrder.length === 0 ? '' : 'Artwork added'}
              </span>
            </div>
          </div>
        )}
        {/* Top bar: Season tabs, filter, search (desktop); Artworks bar (mobile collapsed). Hidden when showing inline artwork info on desktop. */}
        {(!isMobile || selectorSheetState === 'collapsed') && !(detailProduct && !isMobile) && (
        <div
          role={selectorSheetState === 'collapsed' && isMobile ? 'button' : undefined}
          tabIndex={selectorSheetState === 'collapsed' && isMobile ? 0 : undefined}
          onClick={selectorSheetState === 'collapsed' && isMobile ? cycleSelectorState : undefined}
          onKeyDown={selectorSheetState === 'collapsed' && isMobile ? (e) => e.key === 'Enter' && cycleSelectorState() : undefined}
          className={cn(
            'relative flex-shrink-0 w-full flex items-center gap-2 px-4 py-2.5',
            selectorSheetState === 'collapsed' ? 'border-b-0 md:border-b' : (showLampPaywall ? 'border-b-0' : 'border-b border-neutral-100 dark:border-[#342e2e]'),
            selectorSheetState === 'collapsed' && 'bg-white/70 dark:bg-[#1a1616]/90 backdrop-blur-xl backdrop-saturate-150 border-white/50 dark:border-white/10',
            selectorSheetState === 'collapsed' && isMobile && 'cursor-pointer active:bg-white/85 dark:active:bg-neutral-800/95 justify-center',
          )}
          style={selectorSheetState === 'collapsed' ? { backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' } : undefined}
          aria-label={selectorSheetState === 'collapsed' && isMobile ? 'Expand artworks' : undefined}
        >
          {selectorSheetState === 'collapsed' ? (
            /* Collapsed: Artworks bar with LayoutGrid, ChevronUp */
            <>
              <LayoutGrid className="w-4 h-4 shrink-0 text-neutral-500 dark:text-[#c4a0a0]" />
              <span className="text-xs font-medium text-neutral-700 dark:text-experience-highlight">Artworks</span>
              <ChevronUp className="w-3 h-3 shrink-0 text-neutral-500 dark:text-[#c4a0a0] md:hidden" />
            </>
          ) : (
            <>
          {/* Top bar: on desktop = full; on mobile = just chevron (season/filter/search in bottom bar) */}
          {!isMobile && (
            <>
              {/* Season tabs + filter — hidden while lamp paywall is active */}
              {!showLampPaywall && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Filter — left */}
                <button
                  ref={filterButtonRef}
                  onClick={handleOpenFilter}
                  className={cn(
                    'relative flex items-center justify-center w-9 h-9 rounded-lg text-xs font-medium transition-colors border flex-shrink-0',
                    hasActiveFilters(filters)
                      ? 'bg-neutral-900 dark:bg-[#262222] text-white border-neutral-900 dark:border-[#2c2828]'
                      : 'bg-white dark:bg-[#201c1c] text-neutral-700 dark:text-[#d4b8b8] border-neutral-200 dark:border-[#3e3838] hover:border-neutral-300 dark:hover:border-[#4a4444] hover:bg-neutral-50 dark:hover:bg-[#262222]',
                    showHighlightAnimation && highlightStep === 4 && wizardHighlightClass
                  )}
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white dark:bg-[#2c2828] text-neutral-900 dark:text-[#f0e8e8] ring-1 ring-neutral-200 dark:ring-[#4a4444] text-[10px] flex items-center justify-center font-bold leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {/* Discount chip — middle (hidden) */}
                {false && lampQuantity > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex-shrink-0">
                    <TicketPercent className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <p className="text-[11px] font-semibold bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent leading-none whitespace-nowrap">The more art you collect, the more you save on your lamp</p>
                  </div>
                )}
                {/* Season buttons — right */}
                <div className="flex rounded-lg border border-neutral-200 dark:border-[#2c2828] p-0.5 bg-neutral-50 dark:bg-[#201c1c]/50 flex-shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveSeasonAndReset('season1')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      activeSeason === 'season1'
                        ? 'bg-white dark:bg-[#262222] text-neutral-900 dark:text-[#f0e8e8] shadow-sm'
                        : 'text-neutral-500 dark:text-[#c4a0a0] hover:text-neutral-700 dark:hover:text-[#e8d4d4]'
                    )}
                  >
                    Season 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSeasonAndReset('season2')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      activeSeason === 'season2'
                        ? 'bg-white dark:bg-[#262222] text-neutral-900 dark:text-[#f0e8e8] shadow-sm'
                        : 'text-neutral-500 dark:text-[#c4a0a0] hover:text-neutral-700 dark:hover:text-[#e8d4d4]'
                    )}
                  >
                    Season 2
                  </button>
                </div>
              </div>
              )}

            </>
          )}
            {/* Mobile: show lamp paywall heading in top bar */}
            {isMobile && showLampPaywall && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#FFBA94] leading-tight">Start with the Street Lamp</p>
                <p className="text-[11px] text-neutral-500 dark:text-[#c4a0a0] mt-0.5">Choose your lamp, then personalize with artwork.</p>
              </div>
            )}
            </>
          )}
        </div>
        )}

        {/* Selector body: expanded content + OrderBar — keep visible when collapsed so OrderBar (fixed on mobile) still renders */}
        <div ref={selectorBodyRef} className="flex flex-col flex-1 min-h-0 overflow-hidden min-w-0">
        {/* Desktop: when artwork selected, show inline info panel in place of selector */}
        {detailProduct && !isMobile ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ArtworkDetail
              inline
              product={detailProductFull ?? detailProduct}
              {...spotlightOverridesForProduct(detailProduct, lamp.id, spotlightData)}
              isSelected={detailProduct.id === lamp.id ? lampQuantity > 0 : cartOrder.includes(detailProduct.id)}
              onToggleSelect={() => {
                const product = detailProductFull ?? detailProduct
                if (product.id === lamp.id) handleLampQuantityChange(lampQuantity > 0 ? 0 : 1)
                else { const wasInCart = cartOrder.includes(product.id); handleAddToCart(product); if (!wasInCart) setDetailProduct(null) }
              }}
              onClose={() => { setDetailProduct(null); setDetailProductFull(null) }}
              isLoadingDetails={detailProductLoading}
              isCollected={detailProduct.id !== lamp.id && (collectedProductIds.has(detailProduct.id) || collectedProductIds.has(detailProduct.id.replace(/^gid:\/\/shopify\/Product\//i, '') || detailProduct.id))}
              isNewDrop={!!spotlightData && (spotlightData.productIds.includes(detailProduct.id) || spotlightData.productIds.includes(detailProduct.id.replace(/^gid:\/\/shopify\/Product\//i, '') || detailProduct.id))}
              isEarlyAccess={!!spotlightData?.unlisted && !!spotlightData && (spotlightData.productIds.includes(detailProduct.id) || spotlightData.productIds.includes(detailProduct.id.replace(/^gid:\/\/shopify\/Product\//i, '') || detailProduct.id))}
              hideScarcityBar={detailProduct.id === lamp.id}
              addToOrderLabel={detailProduct.id === lamp.id ? 'Add Lamp to order' : 'Add artwork to order'}
              productIncludes={detailProduct.id === lamp.id ? [{ label: 'A Street Lamp', icon: 'lamp' as const }, { label: 'USB-C cable – 150mm length', icon: 'cable' as const }, { label: 'Internal magnet mount', icon: 'magnet' as const }, { label: 'EU/US wall adapter', icon: 'plug' as const }, { label: 'Care instruction booklet', icon: 'book' as const }, { label: 'Protective bag', icon: 'bag' as const }] : undefined}
              productSpecs={detailProduct.id === lamp.id ? [{ title: 'Dimensions', icon: 'ruler' as const, items: ['21 × 14 × 7 cm ~ 8.1 × 5.7 × 2.7 in'] }, { title: 'Weight', icon: 'scale' as const, items: ['1.1 kg ~ 2.4 lb'] }, { title: 'Materials', icon: 'box' as const, items: ['Silver anodized matte finish, Aluminum 6063', 'Polycarbonate transparent and double matte optical diffusion', 'Neodymium magnet built into the frame (N52)'] }, { title: 'Light', icon: 'sun' as const, items: ['Energy efficient, heat resistant high output LED / 500 lumen, lasts up to 50,000 hours', 'Light temperatures: 2700K (Warm White), 3000K (Soft White), 5000K (Daylight)', 'Touch dimmer with multiple light options'] }, { title: 'Battery', icon: 'battery' as const, items: ['2500 mAh 3.7V 18650 rechargeable lithium ion', 'Up to 8 hours battery life with constant use'] }, { title: 'Charging', icon: 'zap' as const, items: ['Type C charging port', '1.8 m 360° magnetic head charging cable', 'EU/US wall adapter'] }] : undefined}
            />
          </div>
        ) : (
        <>
        {/* Expanded content: filter pills + artwork strip — hidden when collapsed on mobile */}
        <div className={cn(
          'flex flex-col flex-1 min-h-0 overflow-hidden',
          selectorSheetState === 'collapsed' && isMobile ? 'hidden' : 'flex'
        )}>
        {/* Active filter pills */}
        {hasActiveFilters(filters) && (
          <div className="flex-shrink-0 px-5 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {filters.artists.map((a) => (
              <button
                key={a}
                onClick={() => setFilters({ ...filters, artists: filters.artists.filter((x) => x !== a) })}
                className={cn(
                  '!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg text-[10px] font-medium leading-none flex-shrink-0',
                  initialFilters?.artists?.includes(a)
                    ? 'bg-neutral-900 dark:bg-[#262222] text-white hover:bg-neutral-800 dark:hover:bg-[#2c2828]'
                    : 'bg-white dark:bg-[#201c1c] border border-neutral-900 dark:border-[#4a4444] text-neutral-900 dark:text-[#e8d4d4] hover:bg-neutral-50 dark:hover:bg-[#262222]'
                )}
              >
                {a} <X className="w-2 h-2" />
              </button>
            ))}
            {filters.tags.map((t) => (
              <button
                key={t}
                onClick={() => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white dark:bg-[#201c1c] border border-neutral-900 dark:border-[#4a4444] text-neutral-900 dark:text-[#e8d4d4] text-[10px] font-medium leading-none hover:bg-neutral-50 dark:hover:bg-[#262222] flex-shrink-0"
              >
                {t} <X className="w-2 h-2" />
              </button>
            ))}
            {filters.priceRange && (
              <button
                onClick={() => setFilters({ ...filters, priceRange: null })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white dark:bg-[#201c1c] border border-neutral-900 dark:border-[#4a4444] text-neutral-900 dark:text-[#e8d4d4] text-[10px] font-medium leading-none hover:bg-neutral-50 dark:hover:bg-[#262222] flex-shrink-0"
              >
                {filters.priceRange[1] === Infinity ? `$${filters.priceRange[0]}+` : `$${filters.priceRange[0]}–$${filters.priceRange[1]}`}
                <X className="w-2 h-2" />
              </button>
            )}
            {filters.inStockOnly && (
              <button
                onClick={() => setFilters({ ...filters, inStockOnly: false })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white dark:bg-[#201c1c] border border-neutral-900 dark:border-[#4a4444] text-neutral-900 dark:text-[#e8d4d4] text-[10px] font-medium leading-none hover:bg-neutral-50 dark:hover:bg-[#262222] flex-shrink-0"
              >
                In stock <X className="w-2 h-2" />
              </button>
            )}
            {filters.minStarRating !== null && (
              <button
                onClick={() => setFilters({ ...filters, minStarRating: null })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium leading-none hover:bg-amber-100 flex-shrink-0"
              >
                {filters.minStarRating}+ stars <X className="w-2 h-2" />
              </button>
            )}
            <button
              onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
              className="text-[10px] text-neutral-400 dark:text-[#b89090] hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0 px-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Artwork strip */}
        <div
          ref={artworkStripScrollRef}
          data-experience-artwork-scroll
          onScroll={() => showLampPaywall && gridBlurred && setGridBlurred(false)}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden px-5 pt-3 min-h-0',
            isMobile && selectorSheetState === 'half' ? 'pb-16' : 'pb-4'
          )}
        >
          {/* Lamp card — sharp, above the blurred grid */}
          {showLampPaywall && (
            <div className="flex flex-col gap-2 pb-3">
              <div className="grid grid-cols-2 gap-x-2 md:gap-x-3">
                <LampGridCard
                  lamp={lamp}
                  lampPrice={lampPrice}
                  trustChips={LAMP_TRUST_CHIPS}
                  onAddLamp={() => {
                    if (isGAEnabled()) trackEnhancedEvent('experience_lamp_paywall_add_to_cart', { source: 'configurator' })
                    handleLampQuantityChange(1)
                  }}
                  onViewDetail={() => setDetailProduct(lamp)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                {false && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                    <TicketPercent className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <p className="text-[11px] font-semibold bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent leading-none whitespace-nowrap">The more art you collect, the more you save on your lamp</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isGAEnabled()) trackEnhancedEvent('experience_lamp_paywall_skip', { source: 'configurator' })
                    setLampPaywallSkipped(true)
                    setSessionLampPaywallSkipped(true)
                  }}
                  style={{ touchAction: 'manipulation' }}
                  className="text-[11px] text-neutral-500 dark:text-[#c4a0a0] hover:text-neutral-700 dark:hover:text-[#e8d4d4] transition-colors underline underline-offset-2 whitespace-nowrap flex-shrink-0"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Discount chip — mobile only (hidden) */}
          {false && lampQuantity > 0 && (
            <div className="md:hidden flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full bg-emerald-950/60 border border-emerald-800/40 self-start">
              <TicketPercent className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <p className="text-[11px] font-semibold bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent leading-none whitespace-nowrap">The more art you collect, the more you save on your lamp</p>
            </div>
          )}

          {/* Artwork grid wrapper — blur + overlay contained here, lamp card above stays sharp */}
          <div className="relative">
            {/* Blurred artwork grid */}
            <div
              style={showLampPaywall && gridBlurred ? { filter: 'blur(3px)', transition: 'filter 0.35s ease-out', pointerEvents: 'none' } : { filter: 'none', transition: 'filter 0.35s ease-out' }}
            >
          {spotlightData && !showLampPaywall && (!adPreset || showAllArtworks) ? (
            <div className="w-full">
              <ArtistSpotlightBanner
                spotlight={{ ...spotlightData, gifUrl: undefined }}
                spotlightProducts={spotlightProducts}
                onSelect={handleSpotlightSelect}
                showBadge
                expanded={spotlightExpanded}
              />
            </div>
          ) : null}
          {/* Street lamp — hidden; now in top toolbar only */}
          <div className="hidden">
            <div className={cn(
                'flex flex-col gap-0 w-full overflow-hidden',
                lampQuantity > 0
                  ? 'bg-[#171515] rounded-t-none md:rounded-tr-lg md:rounded-br-lg md:rounded-tl-none md:rounded-bl-none'
                  : 'bg-neutral-100 rounded-lg'
              )}>
              <div className={cn(
                'flex items-center gap-2 min-h-0 min-w-0 px-3',
                lampQuantity > 0 ? 'py-2 md:py-1.5' : 'py-2.5'
              )}>
                <div className="flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 306 400" fill="currentColor" className={cn('w-5 h-6 shrink-0', lampQuantity > 0 ? 'text-neutral-300' : 'text-neutral-700')} xmlns="http://www.w3.org/2000/svg">
                    <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={cn('text-xs font-semibold truncate', lampQuantity > 0 ? 'text-white' : 'text-neutral-950')}>Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
                  <button
                    type="button"
                    onClick={() => setDetailProduct(lamp)}
                    className={cn(
                      'flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-colors',
                      lampQuantity > 0 ? 'text-neutral-400 hover:text-white hover:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                    )}
                    aria-label="View lamp details"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <span className={cn(
                  'text-xs tabular-nums shrink-0',
                  lampQuantity === 0 ? 'text-neutral-500' : 'text-neutral-300 font-medium'
                )}>
                  {lampQuantity === 0
                    ? `$${formatPriceCompact(lampPrice)}`
                    : lampTotal === 0
                      ? 'FREE'
                      : `$${formatPriceCompact(lampTotal)}`}
                </span>
                {lampQuantity === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleLampQuantityChange(1)}
                    className="w-6 h-5 text-center text-[10px] font-medium rounded bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex-shrink-0"
                    aria-label="Add lamp"
                  >
                    Add
                  </button>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={lampQuantity}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10)
                      if (!Number.isNaN(n)) handleLampQuantityChange(Math.max(0, Math.min(99, n)))
                    }}
                    className={cn(
                      'w-9 h-5 text-center text-[10px] font-medium rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-shrink-0',
                      lampQuantity > 0 ? 'bg-neutral-800 border border-neutral-500 text-white' : 'border border-neutral-200'
                    )}
                    aria-label="Lamp quantity"
                  />
                )}
              </div>
              {/* Discount progress — compact, only when lamp + artworks */}
              {lampQuantity > 0 && artworkCount > 0 && (
                <div className="px-3 pt-1.5 pb-2 border-t border-neutral-600 bg-neutral-800/50">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-300">
                      <TicketPercent className="w-3 h-3 shrink-0" aria-hidden />
                      {discountBarLabel}
                    </span>
                    {lampSavings > 0 && (
                      <span className="text-[11px] font-semibold text-neutral-300 tabular-nums">-${formatPriceCompact(lampSavings)}</span>
                    )}
                  </div>
                  <div className="relative h-1.5 rounded-full overflow-hidden flex bg-neutral-700">
                    {Array.from({ length: lampQuantity }).map((_, i) => (
                      <div key={i} className="flex-1 min-w-0 h-full overflow-hidden relative">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-neutral-400 to-neutral-300"
                          initial={false}
                          animate={{ width: `${lampProgress[i] ?? 0}%` }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <ArtworkStrip
            scrollRef={artworkStripScrollRef}
            products={
              adPreset && resolvedPreset && !showAllArtworks && presetProducts.length > 0
                ? presetProducts
                : filteredProducts
            }
            previewIndex={previewIndex}
            lampPreviewOrder={lampPreviewOrder}
            cartOrder={cartOrder}
            lastAddedProductId={lastAddedProductId}
            scrollToProductId={scrollToProductId}
            showWishlistHearts={false}
            crewCountMap={crewCountMap}
            collectedProductIds={collectedProductIds}
            newDropProductIds={spotlightData ? new Set(spotlightData.productIds) : undefined}
            spotlightUnlisted={spotlightData?.unlisted}
            onPreview={handlePreview}
            onLampSelect={handleLampSelect}
            onAddToCart={handleAddToCart}
            onViewDetail={setDetailProduct}
            highlightStep={highlightStep}
            showHighlightAnimation={showHighlightAnimation}
            onStepTried={(step: 0 | 1 | 2) => {
              setTriedSteps((prev) => {
                const next: [boolean, boolean, boolean, boolean, boolean, boolean] = [...prev]
                next[step] = true
                return next
              })
            }}
            onPrefetchProduct={(p) => prefetchProduct(p.handle)}
            hasMore={adPreset && !showAllArtworks ? false : pageInfo.hasNextPage}
            onLoadMore={() => loadMoreForSeason(activeSeason)}
            isLoadingMore={loadingMore}
            isMobile={isMobile}
          />
            </div>
            {/* Tap-to-deblur overlay — sibling of blur div, anchors to the outer relative wrapper */}
            <AnimatePresence>
              {showLampPaywall && gridBlurred && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 cursor-pointer"
                  onClick={() => setGridBlurred(false)}
                  onTouchStart={() => setGridBlurred(false)}
                  onTouchMove={() => setGridBlurred(false)}
                  onWheel={() => setGridBlurred(false)}
                >
                  {/* Dark tint */}
                  <div className="absolute inset-0 bg-[#0e0a0a]/70" />
                  {/* Hint chip */}
                  <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 select-none">
                    <p className="text-xs font-medium text-white/80 tracking-wide">Tap to browse artworks</p>
                  </div>
                  {/* Scroll bounce hint */}
                  <motion.div
                    className="relative flex flex-col items-center gap-0.5"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="text-white/40">
                      <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5"/>
                      <motion.rect
                        x="6.5" y="5" width="3" height="5" rx="1.5" fill="currentColor"
                        animate={{ y: [0, 5, 0], opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Show all artworks button — desktop only (mobile uses bottom bar) */}
          {!isMobile && adPreset && resolvedPreset && !showAllArtworks && presetProducts.length > 0 && (
            <div className="flex justify-center py-4 px-5">
              <button
                type="button"
                onClick={() => setShowAllArtworks(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-200 dark:border-[#342e2e] bg-white dark:bg-[#1e1a1a] text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#262222] hover:border-neutral-300 dark:hover:border-[#4a4444] transition-colors"
              >
                Show all artworks
              </button>
            </div>
          )}
        </div>
        </div>
        </>
        )}

        {/* Bottom bar (mobile only): Filter far left, Search expands into space; Season tabs + Chevron right — when selector expanded */}
        {/* When ad preset active and not yet expanded: replace bottom bar with Show all artworks button */}
        {isMobile && selectorSheetState === 'half' && adPreset && !showAllArtworks && (
          <div className="flex-shrink-0 w-full flex items-center justify-center px-4 py-2.5 border-t border-neutral-200 dark:border-[#2c2828] bg-white dark:bg-[#1a1616]">
            <button
              type="button"
              onClick={() => setShowAllArtworks(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-neutral-200 dark:border-[#342e2e] bg-white dark:bg-[#1e1a1a] text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#262222] hover:border-neutral-300 dark:hover:border-[#4a4444] transition-colors"
            >
              Show all artworks
            </button>
          </div>
        )}
        {isMobile && selectorSheetState === 'half' && (!adPreset || showAllArtworks) && (
          <div className="flex-shrink-0 w-full flex items-center gap-2 px-3 py-2.5 border-t border-neutral-200 dark:border-[#2c2828] bg-white dark:bg-[#1a1616]">
            {/* Left: Filter */}
            <div className="flex-shrink-0">
              <button
                ref={isMobile ? filterButtonRef : undefined}
                onClick={handleOpenFilter}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 relative',
                  hasActiveFilters(filters)
                    ? 'bg-neutral-900 dark:bg-[#262222] text-white border-neutral-900 dark:border-[#2c2828]'
                    : 'bg-white dark:bg-[#201c1c] text-neutral-700 dark:text-[#d4b8b8] border-neutral-200 dark:border-[#3e3838]',
                  showHighlightAnimation && highlightStep === 4 && wizardHighlightClass
                )}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-white dark:bg-[#2c2828] text-neutral-900 dark:text-[#f0e8e8] ring-1 ring-neutral-200 dark:ring-[#4a4444] text-[9px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Center: Season tabs */}
            <div className="flex-1 min-w-0 flex items-center justify-center">
              <div className="flex rounded-lg border border-neutral-200 dark:border-[#3e3838] p-0.5 bg-neutral-50 dark:bg-[#201c1c]/50 flex-shrink-0">
              {false && (
              <AnimatePresence initial={false} mode="wait">
                {searchExpanded ? (
                  <motion.div
                    key="search-bar-mobile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-center h-8 flex-1 min-w-0 bg-neutral-100 rounded-lg overflow-hidden"
                  >
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => !searchQuery && setSearchExpanded(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) trackSearch(searchQuery.trim())
                      }}
                      placeholder="Search…"
                      className="w-full h-full pl-8 pr-8 text-sm bg-transparent text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchExpanded(false) }}
                      className="absolute right-1.5 w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-icon-mobile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    type="button"
                    onClick={() => setSearchExpanded(true)}
                    className={cn(
                      'relative flex items-center justify-center w-9 h-9 rounded-lg border shrink-0',
                      searchQuery
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    )}
                    aria-label="Search artworks"
                  >
                    <Search className="w-4 h-4" />
                    {searchQuery && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
              )}
              <button
                type="button"
                onClick={() => setActiveSeasonAndReset('season1')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeSeason === 'season1'
                    ? 'bg-white dark:bg-[#262222] text-neutral-900 dark:text-[#f0e8e8] shadow-sm'
                    : 'text-neutral-500 dark:text-[#c4a0a0] hover:text-neutral-700 dark:hover:text-[#e8d4d4]'
                )}
              >
                Season 1
              </button>
              <button
                type="button"
                onClick={() => setActiveSeasonAndReset('season2')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeSeason === 'season2'
                    ? 'bg-white dark:bg-[#262222] text-neutral-900 dark:text-[#f0e8e8] shadow-sm'
                    : 'text-neutral-500 dark:text-[#c4a0a0] hover:text-neutral-700 dark:hover:text-[#e8d4d4]'
                )}
              >
                Season 2
              </button>
              </div>
            </div>

            {/* Right: Expand/collapse chevron */}
            <div className="flex-shrink-0">
              <button
                ref={chevronButtonRef}
                onClick={handleCycleSelectorState}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 transition-colors',
                  showHighlightAnimation && highlightStep === 5 && isMobile
                    ? `${wizardHighlightClass} border-blue-300/80 dark:border-blue-400/70 bg-blue-100/80 dark:bg-blue-900/40`
                    : 'border-neutral-200 dark:border-[#3e3838] bg-white dark:bg-[#201c1c] text-neutral-600 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#262222] hover:text-neutral-900 dark:hover:text-[#f0e8e8]'
                )}
                aria-label={selectorSheetState === 'half' ? 'Expand to full' : 'Collapse selector'}
              >
                {selectorSheetState === 'half' ? (
                  <ChevronUp className="w-4 h-4" aria-hidden />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden />
                )}
              </button>
            </div>

          </div>
        )}

        </div>
        </>
      </motion.div>

      {/* Order bar is rendered in ExperienceClient (always mounted so cart chip works) */}

      {/* Filter panel */}
      <FilterPanel
        products={products}
        filters={filters}
        onChange={handleFiltersChange}
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        cartOrder={cartOrder}
      />

      {/* Artwork / lamp detail drawer — overlay only on mobile; desktop uses inline panel in left area */}
      {detailProduct && isMobile && (
        <ArtworkDetail
          product={detailProductFull ?? detailProduct}
          {...spotlightOverridesForProduct(detailProduct, lamp.id, spotlightData)}
          isMobile={isMobile}
          isLoadingDetails={detailProductLoading}
          isCollected={detailProduct.id !== lamp.id && (collectedProductIds.has(detailProduct.id) || collectedProductIds.has(detailProduct.id.replace(/^gid:\/\/shopify\/Product\//i, '') || detailProduct.id))}
          isNewDrop={!!spotlightData && (spotlightData.productIds.includes(detailProduct.id) || spotlightData.productIds.includes(detailProduct.id.replace(/^gid:\/\/shopify\/Product\//i, '') || detailProduct.id))}
          isEarlyAccess={!!spotlightData?.unlisted && !!spotlightData && (spotlightData.productIds.includes(detailProduct.id) || spotlightData.productIds.includes(detailProduct.id.replace(/^gid:\/\/shopify\/Product\//i, '') || detailProduct.id))}
          productBadges={undefined}
          hideScarcityBar={detailProduct.id === lamp.id}
          addToOrderLabel={detailProduct.id === lamp.id ? 'Add Lamp to order' : 'Add artwork to order'}
          productIncludes={
            detailProduct.id === lamp.id
              ? [
                  { label: 'A Street Lamp', icon: 'lamp' as const },
                  { label: 'USB-C cable – 150mm length', icon: 'cable' as const },
                  { label: 'Internal magnet mount', icon: 'magnet' as const },
                  { label: 'EU/US wall adapter', icon: 'plug' as const },
                  { label: 'Care instruction booklet', icon: 'book' as const },
                  { label: 'Protective bag', icon: 'bag' as const },
                ]
              : undefined
          }
          productSpecs={
            detailProduct.id === lamp.id
              ? [
                  { title: 'Dimensions', icon: 'ruler' as const, items: ['21 × 14 × 7 cm ~ 8.1 × 5.7 × 2.7 in'] },
                  { title: 'Weight', icon: 'scale' as const, items: ['1.1 kg ~ 2.4 lb'] },
                  {
                    title: 'Materials',
                    icon: 'box' as const,
                    items: [
                      'Silver anodized matte finish, Aluminum 6063',
                      'Polycarbonate transparent and double matte optical diffusion',
                      'Neodymium magnet built into the frame (N52)',
                    ],
                  },
                  {
                    title: 'Light',
                    icon: 'sun' as const,
                    items: [
                      'Energy efficient, heat resistant high output LED / 500 lumen, lasts up to 50,000 hours',
                      'Light temperatures: 2700K (Warm White), 3000K (Soft White), 5000K (Daylight)',
                      'Touch dimmer with multiple light options',
                    ],
                  },
                  {
                    title: 'Battery',
                    icon: 'battery' as const,
                    items: [
                      '2500 mAh 3.7V 18650 rechargeable lithium ion',
                      'Up to 8 hours battery life with constant use',
                    ],
                  },
                  {
                    title: 'Charging',
                    icon: 'zap' as const,
                    items: [
                      'Type C charging port',
                      '1.8 m 360° magnetic head charging cable',
                      'EU/US wall adapter',
                    ],
                  },
                ]
              : undefined
          }
          isSelected={
            detailProduct.id === lamp.id
              ? lampQuantity > 0
              : cartOrder.includes(detailProduct.id)
          }
          onToggleSelect={() => {
            const product = detailProductFull ?? detailProduct
            if (product.id === lamp.id) {
              handleLampQuantityChange(lampQuantity > 0 ? 0 : 1)
            } else {
              const wasInCart = cartOrder.includes(product.id)
              handleAddToCart(product)
              if (!wasInCart) setDetailProduct(null)
            }
          }}
          onClose={() => { setDetailProduct(null); setDetailProductFull(null) }}
        />
      )}
    </div>
  )
}
