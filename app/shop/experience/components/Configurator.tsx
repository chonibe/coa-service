'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, SlidersHorizontal, ChevronUp, ChevronDown, ChevronLeft, Lamp, ArrowLeftRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { Spline3DPreview } from '@/app/template-preview/components/spline-3d-preview'
import type { QuizAnswers } from './IntroQuiz'
import { ArtworkStrip } from './ArtworkStrip'
import { ArtworkDetail } from './ArtworkDetail'
import { OrderBar } from './OrderBar'
import { ExperienceWizard } from './ExperienceWizard'
import { FilterPanel, applyFilters, hasActiveFilters, DEFAULT_FILTERS, type FilterState } from './FilterPanel'
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
}

export function Configurator({ lamp, productsSeason1, productsSeason2, quizAnswers, onRetakeQuiz }: ConfiguratorProps) {
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
  const [viewerCollapsed, setViewerCollapsed] = useState(false)
  const [panelStatus, setPanelStatus] = useState<{ sideA: boolean; sideB: boolean; sameObject: boolean } | null>(null)

  // Side assignments derived from selection order: last 2 selected = lamp preview (oldest→A, newest→B)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    setViewerCollapsed(isMobile)
  }, [])

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

  const isGift = quizAnswers.purpose === 'gift'

  const filteredProducts = useMemo(() => {
    let result = applyFilters(products, filters, searchQuery)
    if (filters.inCartOnly) {
      const cartSet = new Set(cartOrder)
      result = result.filter((p) => cartSet.has(p.id))
    }
    return result
  }, [products, filters, searchQuery, cartOrder])

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

  const handleAddToCart = useCallback((product: ShopifyProduct) => {
    setCartOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) return prev.filter((id) => id !== product.id)
      return [...prev, product.id]
    })
  }, [])

  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index)
    setViewerCollapsed(false)
  }, [])

  const activeFilterCount = (filters.artists.length > 0 ? 1 : 0) +
    (filters.tags.length > 0 ? 1 : 0) +
    (filters.priceRange ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.inCartOnly ? 1 : 0) +
    (filters.sortBy !== 'featured' ? 1 : 0)

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
    <div className="flex flex-col md:flex-row h-full">
      {/* 3D Lamp viewer -- collapsible */}
      <motion.div
        data-wizard-spline
        layout
        className={cn(
          'relative bg-neutral-950 flex-shrink-0 overflow-hidden transition-all',
          viewerCollapsed
            ? 'h-12 md:h-full md:w-16'
            : 'h-[35dvh] md:h-full md:w-[60%]'
        )}
      >
        {!viewerCollapsed && (
          <Spline3DPreview
            image1={image1}
            image2={image2}
            side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"
            side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"
            minimal
            className="relative w-full h-full"
            onPanelsFound={setPanelStatus}
            swapLampSides
            flipForSide="B"
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
        )}

        {/* Collapsed state */}
        {viewerCollapsed && (
          <button
            onClick={() => setViewerCollapsed(false)}
            className="w-full h-full md:w-full md:h-full flex items-center justify-center gap-2 text-white/60 hover:text-white/90 transition-colors"
          >
            <Lamp className="w-4 h-4" />
            <span className="text-xs font-medium md:hidden">Tap to preview on lamp</span>
            <span className="text-xs font-medium hidden md:inline md:[writing-mode:vertical-lr] md:rotate-180">3D Preview</span>
          </button>
        )}

        {/* Back to preferences */}
        {!viewerCollapsed && (
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="absolute top-4 left-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/65 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
            aria-label="Back to preferences"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </button>
        )}

        {/* Collapse toggle — mobile only */}
        {!viewerCollapsed && (
          <button
            onClick={() => setViewerCollapsed(true)}
            className="md:hidden absolute bottom-3 right-3 z-20 flex items-center justify-center gap-1.5 w-8 h-8 rounded-full bg-black/65 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
            aria-label="Collapse preview"
          >
            <ChevronDown className="w-4 h-4 shrink-0" />
          </button>
        )}

        {/* Side B unavailable notice */}
        {!viewerCollapsed && panelStatus && !panelStatus.sideB && (
          <div className="absolute top-14 left-3 right-3 z-20 px-2 py-1.5 rounded-lg bg-amber-500/90 text-white text-[10px] font-medium text-center">
            Side B not found in 3D scene — edit the lamp in Spline to add a second panel
          </div>
        )}
        {!viewerCollapsed && panelStatus?.sideB && panelStatus?.sameObject && (
          <div className="absolute top-14 left-3 right-3 z-20 px-2 py-1.5 rounded-lg bg-amber-500/90 text-white text-[10px] font-medium text-center">
            Both sides share one panel — A and B will show the same image
          </div>
        )}
        {/* Lamp side labels + swap + position — order = last 2 selected */}
        {!viewerCollapsed && (
          <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 z-20 space-y-2">
            {/* Image position controls (hidden) */}
            {false && (
            <div className="rounded-lg bg-black/50 backdrop-blur-sm p-2 space-y-1.5 max-h-[50vh] overflow-y-auto">
              <span className="text-[10px] text-white/90 font-medium block">Side A</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/80 w-10 shrink-0">Size</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.2"
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
                  max="1"
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
                  max="1.2"
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
                  max="1.2"
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
                  max="1"
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
                  max="1.2"
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

      {/* Right: Panel */}
      <div className="relative flex-1 flex flex-col bg-white overflow-hidden min-h-0">
        {/* Top bar: season tabs, search (icon → expands), filter — all inline */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
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

            {/* Search */}
            <div className="flex items-center flex-1 min-w-0 justify-end">
              <AnimatePresence initial={false} mode="wait">
                {searchExpanded ? (
                  <motion.div
                    key="search-bar"
                    initial={{ opacity: 0, width: 36 }}
                    animate={{ opacity: 1, width: 200 }}
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
                      'relative flex items-center justify-center w-9 h-9 rounded-full transition-colors flex-shrink-0',
                      searchQuery
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'
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

            {/* Filter */}
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex-shrink-0',
                hasActiveFilters(filters)
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters(filters) && (
          <div className="flex-shrink-0 px-5 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {filters.artists.map((a) => (
              <button
                key={a}
                onClick={() => setFilters({ ...filters, artists: filters.artists.filter((x) => x !== a) })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-xs text-neutral-600 hover:bg-neutral-200 flex-shrink-0"
              >
                {a} <X className="w-2.5 h-2.5" />
              </button>
            ))}
            {filters.tags.map((t) => (
              <button
                key={t}
                onClick={() => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-xs text-neutral-600 hover:bg-neutral-200 flex-shrink-0"
              >
                {t} <X className="w-2.5 h-2.5" />
              </button>
            ))}
            {filters.priceRange && (
              <button
                onClick={() => setFilters({ ...filters, priceRange: null })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-xs text-neutral-600 hover:bg-neutral-200 flex-shrink-0"
              >
                {filters.priceRange[1] === Infinity ? `$${filters.priceRange[0]}+` : `$${filters.priceRange[0]}–$${filters.priceRange[1]}`}
                <X className="w-2.5 h-2.5" />
              </button>
            )}
            {filters.inStockOnly && (
              <button
                onClick={() => setFilters({ ...filters, inStockOnly: false })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-xs text-neutral-600 hover:bg-neutral-200 flex-shrink-0"
              >
                In stock <X className="w-2.5 h-2.5" />
              </button>
            )}
            {filters.inCartOnly && (
              <button
                onClick={() => setFilters({ ...filters, inCartOnly: false })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-xs text-neutral-600 hover:bg-neutral-200 flex-shrink-0"
              >
                In cart <X className="w-2.5 h-2.5" />
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
        <div className="flex-1 overflow-y-auto px-5 pb-32 md:pb-4 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400">{filteredProducts.length} artworks</span>
          </div>
          <ArtworkStrip
            products={filteredProducts}
            previewIndex={previewIndex}
            lampPreviewOrder={lampPreviewOrder}
            cartOrder={cartOrder}
            scrollToProductId={scrollToProductId}
            onPreview={handlePreview}
            onLampSelect={handleLampSelect}
            onAddToCart={handleAddToCart}
            onViewDetail={setDetailProduct}
          />
        </div>

        {/* Order bar */}
        <div className="flex-shrink-0 min-w-0">
          <OrderBar
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
            isGift={isGift}
          />
        </div>
      </div>

      {/* Filter panel */}
      <FilterPanel
        products={products}
        filters={filters}
        onChange={setFilters}
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
      />

      {/* First-session contextual wizard */}
      <ExperienceWizard />

      {/* Artwork detail drawer */}
      {detailProduct && (
        <ArtworkDetail
          product={detailProduct}
          isSelected={cartOrder.includes(detailProduct.id)}
          onToggleSelect={() => handleAddToCart(detailProduct)}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  )
}
