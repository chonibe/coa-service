'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, SlidersHorizontal, ChevronUp, ChevronDown, ChevronLeft, LayoutGrid, ArrowLeftRight, Sun, Moon, FlaskConical, Heart } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { QuizAnswers } from './IntroQuiz'

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
import { ArtworkStrip } from './ArtworkStrip'
import { ArtworkDetail } from './ArtworkDetail'
import { OrderBar, type OrderBarRef } from './OrderBar'
import { ExperienceWizard } from './ExperienceWizard'
import { FilterPanel, applyFilters, hasActiveFilters, DEFAULT_FILTERS, type FilterState } from './FilterPanel'
import { WishlistSwiperSheet } from './WishlistSwiperSheet'
import { useWishlist } from '@/lib/shop/WishlistContext'
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
  quizAnswers: QuizAnswers
  onRetakeQuiz: () => void
  /** Pre-filter by artist when arriving from artist link (e.g. Instagram) */
  initialFilters?: Pick<FilterState, 'artists'> | null
}

export function Configurator({
  lamp,
  productsSeason1,
  productsSeason2,
  quizAnswers,
  onRetakeQuiz,
  initialFilters,
}: ConfiguratorProps) {
  const [activeSeason, setActiveSeason] = useState<SeasonTab>('season2')
  const products = activeSeason === 'season1' ? productsSeason1 : productsSeason2

  const setActiveSeasonAndReset = useCallback((season: SeasonTab) => {
    setActiveSeason(season)
    setPreviewIndex(0)
  }, [])
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

  const [lampPreviewOrder, setLampPreviewOrder] = useState<string[]>(() => {
    if (products.length >= 2) return [products[0].id, products[1].id]
    if (products.length === 1) return [products[0].id]
    return []
  })
  const [cartOrder, setCartOrder] = useState<string[]>([])
  const [lampQuantity, setLampQuantity] = useState(!quizAnswers.ownsLamp ? 1 : 0)
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
  const orderBarRef = useRef<OrderBarRef>(null)
  const artworkStripScrollRef = useRef<HTMLDivElement>(null)

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

  // Populate lamp preview when products load (if initially empty)
  useEffect(() => {
    setLampPreviewOrder((prev) => {
      if (prev.length > 0) return prev
      if (products.length >= 2) return [products[0].id, products[1].id]
      if (products.length === 1) return [products[0].id]
      return prev
    })
  }, [products])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [scrollToProductId, setScrollToProductId] = useState<string | null>(null)
  const [wishlistSwiperOpen, setWishlistSwiperOpen] = useState(false)
  const [ratingsVersion, setRatingsVersion] = useState(0)
  const { itemCount: wishlistCount } = useWishlist()

  // Apply initial artist filter when arriving from artist link (e.g. Instagram)
  useEffect(() => {
    if (initialFilters?.artists?.length) {
      setFilters((prev) => ({ ...prev, artists: initialFilters!.artists }))
    }
  }, [initialFilters])

  const isGift = quizAnswers.purpose === 'gift'

  const filteredProducts = useMemo(() => {
    let result = applyFilters(products, filters, searchQuery)
    if (filters.inCartOnly) {
      const cartSet = new Set(cartOrder)
      result = result.filter((p) => cartSet.has(p.id))
    }
    return result
  }, [products, filters, searchQuery, cartOrder, ratingsVersion])

  const filteredAllProducts = useMemo(() => {
    let result = applyFilters(allProducts, filters, searchQuery)
    if (filters.inCartOnly) {
      const cartSet = new Set(cartOrder)
      result = result.filter((p) => cartSet.has(p.id))
    }
    return result
  }, [allProducts, filters, searchQuery, cartOrder, ratingsVersion])

  // Show artist's first artworks on the lamp when arriving from artist link.
  // Must run after filters are applied and filteredProducts has the filtered list.
  const hasSetInitialArtistLampRef = useRef(false)
  useEffect(() => {
    if (hasSetInitialArtistLampRef.current || !initialFilters?.artists?.length || filteredProducts.length === 0) return
    // Only apply when filters already include our artist (filteredProducts is actually filtered)
    if (!filters.artists.some((a) => initialFilters!.artists.includes(a))) return

    const ids = filteredProducts.slice(0, 2).map((p) => p.id)
    setLampPreviewOrder(ids.length >= 2 ? [ids[0], ids[1]] : [ids[0]])
    setPreviewIndex(0)
    hasSetInitialArtistLampRef.current = true
  }, [initialFilters, filters, filteredProducts])

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
  const selectedProducts = useMemo(
    () => cartOrder.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean) as ShopifyProduct[],
    [allProducts, cartOrder]
  )

  // Lamp preview = last 2 selected on lamp (tap on card; separate from cart)
  const sideA = lampPreviewOrder[0] ?? null
  const sideB = lampPreviewOrder[1] ?? null

  const headline = isGift
    ? 'Build a gift'
    : quizAnswers.ownsLamp
      ? 'Add to your collection'
      : 'Build your lamp'

  // Resolve side products for the 3D preview — lamp only shows selections, never preview
  const sideAProduct = sideA ? allProducts.find((p) => p.id === sideA) ?? null : null
  const sideBProduct = sideB ? allProducts.find((p) => p.id === sideB) ?? null : null
  // When 0 selected: only side A gets preview (so both sides don't change together when browsing)
  // When 1 selected: both sides show the same (stable until user picks second)
  // When 2 selected: each side shows its selection
  const image1 = getFirstImage(sideAProduct) ?? getFirstImage(previewed)
  const image2 = sideBProduct
    ? getFirstImage(sideBProduct)
    : sideAProduct
      ? getFirstImage(sideAProduct) // 1 selected: both show same
      : null // 0 selected: side B stays default, only side A gets preview

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

  const handleAddToCart = useCallback((product: ShopifyProduct) => {
    const isAdding = !cartOrder.includes(product.id)
    setCartOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) return prev.filter((id) => id !== product.id)
      return [...prev, product.id]
    })
    if (isAdding) setLastAddedProductId(product.id)
  }, [cartOrder])

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
    (filters.inCartOnly ? 1 : 0) +
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
    <div className="flex flex-col md:flex-row h-full pb-20 md:pb-0 bg-white md:bg-transparent">
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
        )}

        {/* Back to preferences */}
        {previewVisible && (
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="absolute top-4 left-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/65 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
            aria-label="Back to preferences"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </button>
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
        {/* Light/dark lamp toggle */}
        {previewVisible && (
          <button
            type="button"
            onClick={() => setLampVariant((v) => (v === 'light' ? 'dark' : 'light'))}
            className="absolute top-4 right-4 z-20 flex items-center justify-center gap-1.5 w-9 h-9 rounded-full bg-black/65 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
            aria-label={lampVariant === 'light' ? 'Switch to dark lamp' : 'Switch to light lamp'}
          >
            {lampVariant === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}

        {/* Test $0 order — small icon in corner (dev/testing) */}
        {previewVisible && (
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
          'relative flex flex-col bg-white overflow-hidden min-h-0 border-t border-neutral-100 md:border-t-0 transition-[height,flex] duration-200 ease-out',
          /* Desktop: always full */
          'md:flex-1 md:h-full',
          /* Mobile: 3 states — when collapsed, bar is fixed above OrderBar; panel takes no flow space */
          selectorSheetState === 'collapsed' && 'h-0 min-h-0 flex-shrink-0 md:h-auto md:min-h-0',
          selectorSheetState === 'half' && 'flex-[6] min-h-0 basis-0',
          selectorSheetState === 'full' && 'flex-1 min-h-0'
        )}
      >
        {/* Top bar: Season tabs, filter icon, chevron (mobile) — when collapsed on mobile: fixed above OrderBar so it stays visible */}
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
            /* Collapsed: Artworks bar with LayoutGrid, heart, ChevronUp */
            <>
              <LayoutGrid className="w-4 h-4 shrink-0 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-700">Artworks</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setWishlistSwiperOpen(true) }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors shrink-0"
                aria-label="Rate artworks and add to wishlist"
              >
                <Heart className="w-3.5 h-3.5" />
              </button>
              <ChevronUp className="w-3 h-3 shrink-0 text-neutral-500 md:hidden" />
            </>
          ) : (
            <>
          {/* Season tabs */}
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

          <div className="flex-1 min-w-0 flex justify-center items-center">
            <button
              type="button"
              onClick={() => setWishlistSwiperOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
              aria-label="Rate artworks and add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>

          {/* Search — magnifying glass icon expands to search bar */}
          <div className="flex items-center flex-shrink-0">
            <AnimatePresence initial={false} mode="wait">
              {searchExpanded ? (
                <motion.div
                  key="search-bar"
                  initial={{ opacity: 0, width: 36 }}
                  animate={{ opacity: 1, width: 160 }}
                  exit={{ opacity: 0, width: 36 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="relative flex items-center h-9 bg-neutral-100 rounded-full overflow-hidden"
                >
                  <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-400 pointer-events-none shrink-0" />
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
                    className="absolute right-1.5 w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => setSearchExpanded(true)}
                  className={cn(
                    'relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors flex-shrink-0',
                    searchQuery
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-900 border-neutral-900 hover:bg-neutral-50'
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
          </div>

          {/* Filter icon */}
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'relative flex items-center justify-center w-9 h-9 rounded-lg text-xs font-medium transition-colors border flex-shrink-0',
              hasActiveFilters(filters)
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-900 border-neutral-900 hover:bg-neutral-50'
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

          {/* Chevron: cycles half ↔ full (mobile only) */}
          <button
            onClick={cycleSelectorState}
            className="md:hidden flex items-center justify-center py-1.5 px-2 text-neutral-500 hover:text-neutral-800 transition-colors"
            aria-label={selectorSheetState === 'half' ? 'Expand to full' : 'Collapse to show preview'}
          >
            {selectorSheetState === 'half' ? (
              <ChevronUp className="w-4 h-4 shrink-0 text-neutral-400" aria-hidden />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400" aria-hidden />
            )}
          </button>
            </>
          )}
        </div>
        {/* Expanded content: shown when half or full on mobile, always on desktop */}
        <div className={cn(
          'flex flex-col flex-1 min-h-0 overflow-hidden',
          selectorSheetState === 'collapsed' ? 'hidden md:flex' : 'flex'
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
            {filters.inCartOnly && (
              <button
                onClick={() => setFilters({ ...filters, inCartOnly: false })}
                className="!min-h-6 h-6 m-0 flex items-center justify-center gap-1.5 px-2.5 py-0 rounded-lg bg-white border border-neutral-900 text-[10px] font-medium leading-none text-neutral-900 hover:bg-neutral-50 flex-shrink-0"
              >
                In cart <X className="w-2 h-2" />
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
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 flex-shrink-0 px-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Artwork strip */}
        <div ref={artworkStripScrollRef} className="flex-1 overflow-y-auto px-5 pb-32 md:pb-4 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400">{filteredProducts.length} artworks</span>
          </div>
          <ArtworkStrip
            scrollRef={artworkStripScrollRef}
            products={filteredProducts}
            previewIndex={previewIndex}
            lampPreviewOrder={lampPreviewOrder}
            cartOrder={cartOrder}
            lastAddedProductId={lastAddedProductId}
            scrollToProductId={scrollToProductId}
            showWishlistHearts={filters.minStarRating !== null}
            onPreview={handlePreview}
            onLampSelect={handleLampSelect}
            onAddToCart={handleAddToCart}
            onViewDetail={setDetailProduct}
          />
        </div>
        </div>

        {/* Order bar — always visible, outside collapsible content (fixed on mobile) */}
        <div className="flex-shrink-0 min-w-0">
          <OrderBar
            ref={orderBarRef}
            mobileTopSlot={selectorSheetState === 'collapsed' && isMobile ? (
              <button
                type="button"
                onClick={cycleSelectorState}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-b border-white/60 bg-white/90 backdrop-blur-xl backdrop-saturate-150 active:bg-white transition-colors"
                style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
                aria-label="Expand artworks"
              >
                <LayoutGrid className="w-4 h-4 shrink-0 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-600">Artworks</span>
                <ChevronUp className="w-3 h-3 shrink-0 text-neutral-400" />
              </button>
            ) : undefined}
            lamp={lamp}
            selectedArtworks={selectedProducts}
            lampQuantity={lampQuantity}
            onLampQuantityChange={setLampQuantity}
            onRemoveArtwork={(id) => {
              setCartOrder((prev) => prev.filter((oid) => oid !== id))
            }}
            onSelectArtwork={(product) => {
              const inSeason1 = productsSeason1.some((p) => p.id === product.id)
              if (inSeason1 && activeSeason !== 'season1') setActiveSeasonAndReset('season1')
              if (!inSeason1 && activeSeason !== 'season2') setActiveSeasonAndReset('season2')
              setScrollToProductId(product.id)
            }}
            onViewLampDetail={setDetailProduct}
            isGift={isGift}
          />
        </div>
      </motion.div>

      {/* Filter panel */}
      <FilterPanel
        products={products}
        filters={filters}
        onChange={setFilters}
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        wishlistCount={wishlistCount}
      />

      {/* First-session contextual wizard */}
      <ExperienceWizard />

      {/* Artwork / lamp detail drawer */}
      {detailProduct && (
        <ArtworkDetail
          product={detailProductFull ?? detailProduct}
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
              setLampQuantity((q) => (q > 0 ? 0 : 1))
            } else {
              const wasInCart = cartOrder.includes(product.id)
              handleAddToCart(product)
              if (!wasInCart) setDetailProduct(null)
            }
          }}
          onClose={() => { setDetailProduct(null); setDetailProductFull(null) }}
        />
      )}
      <WishlistSwiperSheet
        isOpen={wishlistSwiperOpen}
        onClose={() => setWishlistSwiperOpen(false)}
        products={filteredAllProducts}
        onRatingChange={() => setRatingsVersion((v) => v + 1)}
        onSelectProduct={(p) => {
          setWishlistSwiperOpen(false)
          setDetailProduct(p)
        }}
        onViewProductDetail={(p) => setDetailProduct(p)}
        onApplyStarFilter={(minStars: number) => {
          setFilters((f) => ({ ...f, minStarRating: minStars }))
          setWishlistSwiperOpen(false)
          setFilterOpen(true)
        }}
      />
    </div>
  )
}
