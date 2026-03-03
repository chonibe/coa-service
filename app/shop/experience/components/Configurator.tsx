'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, SlidersHorizontal, ChevronUp, ChevronDown, LayoutGrid, ArrowLeftRight, Sun, Moon, FlaskConical, Eye, RotateCw, Info, Check, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { QuizAnswers } from './IntroQuiz'
import type { SeasonPageInfo } from './ExperienceClient'

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

const Spline3DPreview = dynamic(
  () =>
    import('@/app/template-preview/components/spline-3d-preview').then((m) => ({
      default: m.Spline3DPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full flex items-center justify-center bg-neutral-900/80">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    ),
  }
)
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import { SplineWhenVisible } from './SplineWhenVisible'
import { ArtworkStrip } from './ArtworkStrip'
import { ArtworkDetail } from './ArtworkDetail'
import { DiscountCelebration } from './DiscountCelebration'
import { ExperienceWizard } from './ExperienceWizard'
import { FilterPanel, applyFilters, hasActiveFilters, DEFAULT_FILTERS, type FilterState } from './FilterPanel'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { CheckoutButton } from '@/components/shop/checkout/CheckoutButton'
import { useShopAuth } from '@/lib/shop/useShopAuth'
import { useRatingSync } from '@/lib/experience/useRatingSync'
import { cn } from '@/lib/utils'
import {
  loadImagePosition,
  saveImagePosition as persistImagePosition,
  DEFAULT_SIDE_POSITION,
  DEFAULT_SIDE_B_POSITION,
} from '@/lib/experience-image-position'

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
}

export function Configurator({
  lamp,
  productsSeason1: initialSeason1,
  productsSeason2: initialSeason2,
  pageInfoSeason1: initialPage1,
  pageInfoSeason2: initialPage2,
  quizAnswers,
  onRetakeQuiz,
  initialFilters,
}: ConfiguratorProps) {
  useRatingSync()
  const { isAuthenticated } = useShopAuth()
  const [activeSeason, setActiveSeason] = useState<SeasonTab>('season2')
  const [crewCountMap, setCrewCountMap] = useState<Record<string, number>>({})
  const [productsSeason1, setProductsSeason1] = useState<ShopifyProduct[]>(() => initialSeason1)
  const [productsSeason2, setProductsSeason2] = useState<ShopifyProduct[]>(() => initialSeason2)
  const [pageInfoSeason1, setPageInfoSeason1] = useState<SeasonPageInfo>(() => initialPage1)
  const [pageInfoSeason2, setPageInfoSeason2] = useState<SeasonPageInfo>(() => initialPage2)
  const [loadingMore, setLoadingMore] = useState(false)
  const products = activeSeason === 'season1' ? productsSeason1 : productsSeason2
  const pageInfo = activeSeason === 'season1' ? pageInfoSeason1 : pageInfoSeason2

  const artworkStripScrollRef = useRef<HTMLDivElement>(null)

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
  const [cartOrder, setCartOrder] = useState<string[]>([])
  /** Non-lamp owners start at 0; they must add lamp via paywall first, then choose artwork */
  const [lampQuantity, setLampQuantity] = useState(quizAnswers.ownsLamp ? 0 : 0)
  const [detailProduct, setDetailProduct] = useState<ShopifyProduct | null>(null)
  const [detailProductFull, setDetailProductFull] = useState<ShopifyProduct | null>(null)
  const [detailProductLoading, setDetailProductLoading] = useState(false)
  const fullProductCacheRef = useRef<Map<string, ShopifyProduct>>(new Map())
  /** Mobile only: 'collapsed' = show preview, selector bar only; 'half' = 50/50; 'full' = selector covers preview */
  const [selectorSheetState, setSelectorSheetState] = useState<'collapsed' | 'half' | 'full'>('half')
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

  // Cycle selector state: collapsed -> half -> full -> collapsed (mobile only)
  const cycleSelectorState = useCallback(() => {
    setSelectorSheetState((s) => (s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'collapsed'))
  }, [])

  const previewVisible = !isMobile || selectorSheetState !== 'full'

  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    if (newFilters === DEFAULT_FILTERS) scrollArtworkStripToTop()
  }, [scrollArtworkStripToTop])
  const [filterOpen, setFilterOpen] = useState(false)
  const [scrollToProductId, setScrollToProductId] = useState<string | null>(null)
  const [ratingsVersion, setRatingsVersion] = useState(0)
  const [rotateHintDismissed, setRotateHintDismissed] = useState(false)
  const [previewEngaged, setPreviewEngaged] = useState(false)

  // Lift dark overlay when user selects artworks
  useEffect(() => {
    if (lampPreviewOrder.length > 0) setPreviewEngaged(true)
  }, [lampPreviewOrder.length])

  // Auto-dismiss rotate hint after 5 seconds
  useEffect(() => {
    if (rotateHintDismissed) return
    const t = setTimeout(() => setRotateHintDismissed(true), 5000)
    return () => clearTimeout(t)
  }, [rotateHintDismissed])

  // Apply initial artist filter when arriving from artist link (e.g. Instagram)
  useEffect(() => {
    if (initialFilters?.artists?.length) {
      setFilters((prev) => ({ ...prev, artists: initialFilters!.artists }))
    }
  }, [initialFilters])

  const isGift = quizAnswers.purpose === 'gift'

  const filteredProducts = useMemo(() => {
    return applyFilters(products, filters, searchQuery, cartOrder)
  }, [products, filters, searchQuery, cartOrder, ratingsVersion])

  const filteredAllProducts = useMemo(() => {
    return applyFilters(allProducts, filters, searchQuery, cartOrder)
  }, [allProducts, filters, searchQuery, cartOrder, ratingsVersion])

  useEffect(() => {
    if (!scrollToProductId) return
    const idx = filteredProducts.findIndex((p) => p.id === scrollToProductId)
    if (idx >= 0) setPreviewIndex(idx)
    const t = setTimeout(() => setScrollToProductId(null), 800)
    return () => clearTimeout(t)
  }, [scrollToProductId, filteredProducts])

  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus()
  }, [searchExpanded])

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
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!cancelled && typeof data === 'object') setCrewCountMap(data)
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

  /** When true, user skipped paywall or deselected lamp — show artworks without requiring lamp */
  const [lampPaywallSkipped, setLampPaywallSkipped] = useState(false)
  /** When user deselects lamp (quantity → 0), keep them on artworks */
  const handleLampQuantityChange = useCallback((n: number) => {
    setLampQuantity(n)
    if (n === 0 && !quizAnswers.ownsLamp) setLampPaywallSkipped(true)
  }, [quizAnswers.ownsLamp])

  /** Paywall: non-lamp owners must add lamp first — unless they skip or deselect */
  const showLampPaywall = !quizAnswers.ownsLamp && lampQuantity === 0 && !lampPaywallSkipped

  const { setOrderSummary, setOrderBarProps, orderBarRef, openOrderBar } = useExperienceOrder()
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
      onRemoveArtwork: (id) => setCartOrder((prev) => prev.filter((oid) => oid !== id)),
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
    })
  }, [
    lamp,
    selectedProducts,
    lampQuantity,
    handleLampQuantityChange,
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
  // When 1 selected: both sides show the same (stable until user picks second)
  // When 2 selected: each side shows its selection
  const image1 = sideAProduct ? getFirstImage(sideAProduct) : null
  const image2 = sideBProduct
    ? getFirstImage(sideBProduct)
    : sideAProduct
      ? getFirstImage(sideAProduct) // 1 selected: both show same
      : null

  const handleSwapSides = useCallback(() => {
    setLampPreviewOrder((prev) =>
      prev.length >= 2 ? [prev[1], prev[0]] : prev
    )
  }, [])

  const handleLampSelect = useCallback((product: ShopifyProduct) => {
    setLampPreviewOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) return prev.filter((id) => id !== product.id)
      if (prev.length >= 2) return [product.id, prev[0]]
      return [...prev, product.id]
    })
  }, [])

  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)
  const [discountCelebrationAmount, setDiscountCelebrationAmount] = useState<number | null>(null)

  const handleAddToCart = useCallback((product: ShopifyProduct) => {
    const isAdding = !cartOrder.includes(product.id)
    setCartOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) return prev.filter((id) => id !== product.id)
      return [...prev, product.id]
    })
    if (isAdding) {
      setLastAddedProductId(product.id)
      setLampPreviewOrder((prev) => {
        const idx = prev.indexOf(product.id)
        if (idx >= 0) return prev
        if (prev.length >= 2) return [product.id, prev[0]]
        return [product.id, ...prev]
      })
      if (lampQuantity > 0) {
        const savingsFromOneArtwork = lampPrice * (DISCOUNT_PER_ARTWORK / 100)
        if (savingsFromOneArtwork >= 0.01) setDiscountCelebrationAmount(savingsFromOneArtwork)
      }
    }
  }, [cartOrder, lampQuantity, lampPrice])

  useEffect(() => {
    if (!lastAddedProductId) return
    const t = setTimeout(() => setLastAddedProductId(null), 1200)
    return () => clearTimeout(t)
  }, [lastAddedProductId])

  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index)
    setSelectorSheetState((s) => (s === 'full' ? 'half' : s))
  }, [])

  const activeFilterCount = (filters.artists.length > 0 ? 1 : 0) +
    (filters.tags.length > 0 ? 1 : 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0) +
    (filters.minStarRating !== null ? 1 : 0)

  if (products.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3">No artworks available</h1>
          <p className="text-neutral-400 mb-6">Check back soon for new releases.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2.5 bg-white text-neutral-950 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-white md:bg-transparent">
      {/* 3D Lamp viewer — on mobile: size depends on selectorSheetState */}
      <motion.div
        data-wizard-spline
        layout={false}
        className={cn(
          'relative overflow-hidden flex-shrink-0 transition-[height,min-height,flex-basis] duration-200 ease-out',
          lampVariant === 'light' ? 'bg-[#F5F5F5]' : 'bg-[#1A1A1A]',
          /* Desktop: side-by-side, preview 60% — bigger (75%) when selector collapsed */
          'md:flex-none md:h-full md:min-h-0',
          selectorSheetState === 'collapsed' ? 'md:w-[75%]' : 'md:w-[60%]',
          /* Mobile: 3 states — larger preview when selector collapsed */
          selectorSheetState === 'collapsed' && 'min-h-[55dvh] flex-1',
          selectorSheetState === 'half' && 'flex-[4] min-h-0 basis-0',
          selectorSheetState === 'full' && 'h-0 min-h-0 overflow-hidden md:!h-full md:!min-h-0 md:!basis-auto'
        )}
      >
        {((!isMobile) || selectorSheetState !== 'full') && (
          <SplineWhenVisible className="relative w-full h-full">
            <ComponentErrorBoundary
              componentName="Spline3DPreview"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-neutral-900/80">
                  <div className="text-center px-4">
                    <p className="text-sm text-white/70">3D preview unavailable</p>
                    <p className="text-xs text-white/50 mt-1">You can still browse and add artworks below.</p>
                  </div>
                </div>
              }
            >
              <Spline3DPreview
              image1={image1}
              image2={image2}
              lampVariant={lampVariant}
            side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"
            side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"
            minimal
            animate
            interactive
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
          />
            </ComponentErrorBoundary>
          </SplineWhenVisible>
        )}


        {/* Rotate gesture hint — shows after user selects artwork, auto-dismisses */}
        <AnimatePresence>
        {previewVisible && lampPreviewOrder.length > 0 && !rotateHintDismissed && (
          <motion.div
            key="rotate-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-2 rounded-full pointer-events-none"
            style={{
              background: lampVariant === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: 2, repeatDelay: 0.3, ease: 'easeInOut' }}
            >
              <RotateCw
                className={cn('w-4 h-4', lampVariant === 'light' ? 'text-white' : 'text-white/90')}
                strokeWidth={2}
              />
            </motion.div>
            <span className={cn('text-xs font-medium', lampVariant === 'light' ? 'text-white' : 'text-white/90')}>
              {isMobile ? 'Touch & swipe to rotate' : 'Drag to rotate'}
            </span>
          </motion.div>
        )}
        </AnimatePresence>

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

        {/* File-tab chevron at bottom of Spline preview — mobile only when selector expanded */}
        {isMobile && (selectorSheetState === 'half' || selectorSheetState === 'full') && (
          <button
            onClick={cycleSelectorState}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full z-20 px-4 py-1.5 rounded-b-lg bg-white border border-t-0 border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 shadow-sm transition-colors"
            aria-label={selectorSheetState === 'half' ? 'Expand to full' : 'Collapse selector'}
          >
            {selectorSheetState === 'half' ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden />
            )}
          </button>
        )}
      </motion.div>

      {/* Right: Selector Panel — 3 states on mobile: collapsed | half | full */}
      <motion.div
        layout={false}
        className={cn(
          'relative flex flex-col bg-white overflow-hidden min-h-0 border-t border-neutral-100 md:border-t-0 transition-[height,flex] duration-200 ease-out',
            lampQuantity > 0 && 'border-t-0',
          /* Desktop: always full */
          'md:flex-1 md:h-full',
          /* Mobile: 3 states — when collapsed, keep expand tab visible (min 56px) */
          selectorSheetState === 'collapsed' && 'min-h-[56px] flex-shrink-0 md:h-auto md:min-h-0',
          selectorSheetState === 'half' && 'flex-[6] min-h-0 basis-0',
          selectorSheetState === 'full' && 'flex-1 min-h-0'
        )}
      >
        {/* Lamp paywall — non-lamp owners must add lamp first before choosing artwork */}
        {showLampPaywall ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center gap-6 max-w-sm"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100">
                <svg viewBox="0 0 306 400" fill="currentColor" className="w-8 h-10 text-neutral-700 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                </svg>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-semibold text-neutral-950">
                    Add your Street Lamp
                  </h2>
                  <button
                    type="button"
                    onClick={() => setDetailProduct(lamp)}
                    className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    aria-label="View lamp details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-neutral-500">
                  Choose your lamp first, then personalize it with artwork.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLampQuantityChange(1)}
                className="inline-flex items-center gap-2 w-full justify-center px-6 py-4 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Street Lamp  ${lampPrice.toFixed(2)}
              </button>
              <p className="text-xs text-neutral-600">
                Volume discount : 7.5% Off the Street lamp - for each artwork you add
              </p>
              <button
                type="button"
                onClick={() => setLampPaywallSkipped(true)}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors underline underline-offset-2"
              >
                Skip — browse artworks without lamp
              </button>
            </motion.div>
          </div>
        ) : (
        <>
        {/* Add + Eye to Preview overlay — covers whole selector like paywall */}
        <AnimatePresence>
          {previewVisible && !previewEngaged && !showLampPaywall && (
            <motion.button
              type="button"
              key="preview-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setPreviewEngaged(true)}
              className="absolute inset-0 z-30 flex flex-1 flex-col items-center justify-center px-6 py-8 text-center bg-neutral-900/85 backdrop-blur-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Tap to start selecting artworks"
            >
              <span className="flex items-center gap-2 flex-wrap justify-center px-4 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-white/40 bg-white/20 text-white text-xs font-bold shrink-0">
                  Add
                </span>
                <span className="text-white/90 text-sm">to choose what goes on your lamp,</span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-white/40 bg-white/20 shrink-0">
                  <Eye className="w-3.5 h-3.5 text-white" aria-hidden />
                </span>
                <span className="text-white/90 text-sm">to Preview</span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Discount celebration — slide up at top of selector, next to Artworks icon */}
        <AnimatePresence>
          {discountCelebrationAmount !== null && (
            <DiscountCelebration
              key="discount-celebration"
              amount={discountCelebrationAmount}
              onComplete={() => setDiscountCelebrationAmount(null)}
            />
          )}
        </AnimatePresence>

        {/* Top bar: Season tabs, filter, search (desktop); Artworks bar (mobile collapsed). Hidden on mobile when expanded — controls are in bottom bar. */}
        {(!isMobile || selectorSheetState === 'collapsed') && (
        <div
          role={selectorSheetState === 'collapsed' && isMobile ? 'button' : undefined}
          tabIndex={selectorSheetState === 'collapsed' && isMobile ? 0 : undefined}
          onClick={selectorSheetState === 'collapsed' && isMobile ? cycleSelectorState : undefined}
          onKeyDown={selectorSheetState === 'collapsed' && isMobile ? (e) => e.key === 'Enter' && cycleSelectorState() : undefined}
          className={cn(
            'flex-shrink-0 w-full flex items-center gap-2 px-4 py-2.5',
            selectorSheetState === 'collapsed' ? 'border-b-0 md:border-b' : 'border-b border-neutral-100',
            selectorSheetState === 'collapsed' && 'bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-white/50',
            selectorSheetState === 'collapsed' && isMobile && 'cursor-pointer active:bg-white/85 justify-center',
          )}
          style={selectorSheetState === 'collapsed' ? { backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' } : undefined}
          aria-label={selectorSheetState === 'collapsed' && isMobile ? 'Expand artworks' : undefined}
        >
          {selectorSheetState === 'collapsed' ? (
            /* Collapsed: Artworks bar with LayoutGrid, ChevronUp */
            <>
              <LayoutGrid className="w-4 h-4 shrink-0 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-700">Artworks</span>
              <ChevronUp className="w-3 h-3 shrink-0 text-neutral-500 md:hidden" />
            </>
          ) : (
            <>
          {/* Top bar: on desktop = full; on mobile = just chevron (season/filter/search in bottom bar) */}
          {!isMobile && (
            <>
              {/* Season tabs — desktop only */}
              <div className="flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSeasonAndReset('season1')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    activeSeason === 'season1'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
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
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  Season 2
                </button>
              </div>

              <div className="flex-1 min-w-0" />

              {/* Filter — desktop only, right of selector bar */}
              <button
                onClick={() => setFilterOpen(true)}
                className={cn(
                  'relative flex items-center justify-center w-9 h-9 rounded-lg text-xs font-medium transition-colors border flex-shrink-0 ml-auto',
                  hasActiveFilters(filters)
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                )}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-neutral-900 ring-1 ring-neutral-200 text-[10px] flex items-center justify-center font-bold leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </>
          )}
            </>
          )}
        </div>
        )}

        {/* Selector body: expanded content + OrderBar — keep visible when collapsed so OrderBar (fixed on mobile) still renders */}
        <div ref={selectorBodyRef} className="flex flex-col flex-1 min-h-0 overflow-hidden min-w-0">
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
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'bg-white border border-neutral-900 text-neutral-900 hover:bg-neutral-50'
                )}
              >
                {a} <X className="w-2 h-2" />
              </button>
            ))}
            {filters.tags.map((t) => (
              <button
                key={t}
                onClick={() => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white border border-neutral-900 text-[10px] font-medium leading-none text-neutral-900 hover:bg-neutral-50 flex-shrink-0"
              >
                {t} <X className="w-2 h-2" />
              </button>
            ))}
            {filters.priceRange && (
              <button
                onClick={() => setFilters({ ...filters, priceRange: null })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white border border-neutral-900 text-[10px] font-medium leading-none text-neutral-900 hover:bg-neutral-50 flex-shrink-0"
              >
                {filters.priceRange[1] === Infinity ? `$${filters.priceRange[0]}+` : `$${filters.priceRange[0]}–$${filters.priceRange[1]}`}
                <X className="w-2 h-2" />
              </button>
            )}
            {filters.inStockOnly && (
              <button
                onClick={() => setFilters({ ...filters, inStockOnly: false })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white border border-neutral-900 text-[10px] font-medium leading-none text-neutral-900 hover:bg-neutral-50 flex-shrink-0"
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
              className="text-[10px] text-neutral-400 hover:text-neutral-600 flex-shrink-0 px-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Artwork strip — street lamp first item, then artworks */}
        <div
          ref={artworkStripScrollRef}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden px-5 min-h-0',
            isMobile && (selectorSheetState === 'half' || selectorSheetState === 'full') ? 'pb-16' : 'pb-4'
          )}
        >
          {/* Street lamp — hidden; now in top toolbar only */}
          <div className="hidden">
            <div className={cn(
                'flex flex-col gap-0 w-full overflow-hidden',
                lampQuantity > 0
                  ? 'bg-[#1A1A1A] rounded-t-none md:rounded-tr-lg md:rounded-br-lg md:rounded-tl-none md:rounded-bl-none'
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
                    ? `$${lampPrice.toFixed(2)}`
                    : lampTotal === 0
                      ? 'FREE'
                      : `$${lampTotal.toFixed(2)}`}
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
                    <span className="text-[11px] font-medium text-neutral-300">{discountBarLabel}</span>
                    {lampSavings > 0 && (
                      <span className="text-[11px] font-semibold text-neutral-300 tabular-nums">-${lampSavings.toFixed(2)}</span>
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
            products={filteredProducts}
            previewIndex={previewIndex}
            lampPreviewOrder={lampPreviewOrder}
            cartOrder={cartOrder}
            lastAddedProductId={lastAddedProductId}
            scrollToProductId={scrollToProductId}
            showWishlistHearts={false}
            crewCountMap={crewCountMap}
            onPreview={handlePreview}
            onLampSelect={handleLampSelect}
            onAddToCart={handleAddToCart}
            onViewDetail={setDetailProduct}
            hasMore={pageInfo.hasNextPage}
            onLoadMore={() => loadMoreForSeason(activeSeason)}
            isLoadingMore={loadingMore}
          />
        </div>
        </div>

        {/* Bottom bar (mobile only): Filter far left, Search expands into space; Season tabs + Chevron right — when selector expanded */}
        {isMobile && (selectorSheetState === 'half' || selectorSheetState === 'full') && (
          <div className="flex-shrink-0 w-full flex items-center gap-2 px-3 py-2.5 border-t border-neutral-200 bg-white">
            {/* Left: Filter */}
            <div className="flex-1 min-w-0 flex items-center justify-start">
              <button
                onClick={() => setFilterOpen(true)}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 relative',
                  hasActiveFilters(filters)
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200'
                )}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-white text-neutral-900 ring-1 ring-neutral-200 text-[9px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Season tabs + Expand/collapse chevron (far right) — search hidden for now */}
            <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
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
              <div className="flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveSeasonAndReset('season1')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeSeason === 'season1'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                S1
              </button>
              <button
                type="button"
                onClick={() => setActiveSeasonAndReset('season2')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                  activeSeason === 'season2'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                S2
              </button>
              </div>
              <button
                onClick={cycleSelectorState}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 shrink-0 transition-colors"
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
        )}
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

      {/* First-session contextual wizard */}
      <ExperienceWizard />

      {/* Artwork / lamp detail drawer */}
      {detailProduct && (
        <ArtworkDetail
          product={detailProductFull ?? detailProduct}
          isMobile={isMobile}
          isLoadingDetails={detailProductLoading}
          productBadges={
            detailProduct.id === lamp.id
              ? [
                  { label: 'Free Worldwide Shipping', icon: 'globe' as const },
                  { label: '12 months guarantee', icon: 'shield' as const },
                  { label: 'Easy 30 days returns', icon: 'rotate' as const },
                ]
              : undefined
          }
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
