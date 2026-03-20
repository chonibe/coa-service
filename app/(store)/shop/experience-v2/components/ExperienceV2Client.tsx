'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { trackAddToCart } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { applyFilters, DEFAULT_FILTERS, type FilterState } from './FilterPanel'
import type { SpotlightData } from './ArtistSpotlightBanner'
import { ArtworkDetail } from './ArtworkDetail'
import { useExperienceTheme } from '../ExperienceThemeContext'

const SplineFullScreen = dynamic(
  () => import('../../experience/components/SplineFullScreen').then((m) => ({ default: m.SplineFullScreen })),
  { ssr: false }
)

const ArtworkCarouselBar = dynamic(
  () => import('../../experience/components/ArtworkCarouselBar').then((m) => ({ default: m.ArtworkCarouselBar })),
  { ssr: false }
)

const ArtworkInfoBar = dynamic(
  () => import('../../experience/components/ArtworkInfoBar').then((m) => ({ default: m.ArtworkInfoBar })),
  { ssr: false }
)

const ArtworkPickerSheet = dynamic(
  () => import('../../experience/components/ArtworkPickerSheet').then((m) => ({ default: m.ArtworkPickerSheet })),
  { ssr: false }
)
import { cn } from '@/lib/utils'

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

type SeasonTab = 'season1' | 'season2'

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

const OrderBar = dynamic(
  () => import('./OrderBar').then((m) => m.OrderBar),
  { ssr: false }
)

const EXPERIENCE_CART_KEY = 'sc-experience-cart-v2'

function loadExperienceCart(): { cartOrder: string[]; lampQuantity: number; lampPreviewOrder: string[] } {
  if (typeof window === 'undefined') {
    return { cartOrder: [], lampQuantity: 1, lampPreviewOrder: [] }
  }
  try {
    const raw = localStorage.getItem(EXPERIENCE_CART_KEY)
    if (!raw) return { cartOrder: [], lampQuantity: 1, lampPreviewOrder: [] }
    const p = JSON.parse(raw) as Record<string, unknown>
    const cart = Array.isArray(p.cartOrder) ? p.cartOrder : []
    const lampPreview = Array.isArray(p.lampPreviewOrder) ? p.lampPreviewOrder : []
    const validPreview = lampPreview.filter((id: string) => cart.includes(id)).slice(0, 2)
    return {
      cartOrder: cart,
      lampQuantity: typeof p.lampQuantity === 'number' && p.lampQuantity >= 0 ? p.lampQuantity : 1,
      lampPreviewOrder: validPreview.length > 0 ? validPreview : cart.slice(0, 2),
    }
  } catch {
    return { cartOrder: [], lampQuantity: 1, lampPreviewOrder: [] }
  }
}

function saveExperienceCart(cartOrder: string[], lampQuantity: number, lampPreviewOrder: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EXPERIENCE_CART_KEY, JSON.stringify({ cartOrder, lampQuantity, lampPreviewOrder }))
  } catch {
    // ignore
  }
}

function getFirstImage(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

interface ExperienceV2ClientProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: PageInfo
  pageInfoSeason2: PageInfo
  /** When set (e.g. from ?artist= URL), fetch spotlight for this artist */
  initialArtistSlug?: string
}

export function ExperienceV2Client({
  lamp,
  productsSeason1: initialSeason1,
  productsSeason2: initialSeason2,
  pageInfoSeason1: initialPageInfo1,
  pageInfoSeason2: initialPageInfo2,
  initialArtistSlug,
}: ExperienceV2ClientProps) {
  const { setOrderSummary, setOrderBarProps, triggerPriceBump, setHeaderCenterContent } = useExperienceOrder()

  const [productsSeason1, setProductsSeason1] = useState<ShopifyProduct[]>(() => initialSeason1)
  const [productsSeason2, setProductsSeason2] = useState<ShopifyProduct[]>(() => initialSeason2)
  const [pageInfoSeason1, setPageInfoSeason1] = useState<PageInfo>(() => initialPageInfo1)
  const [pageInfoSeason2, setPageInfoSeason2] = useState<PageInfo>(() => initialPageInfo2)
  const [activeSeason, setActiveSeason] = useState<SeasonTab>('season2')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [spotlightData, setSpotlightData] = useState<SpotlightData | null>(null)
  const [spotlightProductsFromApi, setSpotlightProductsFromApi] = useState<ShopifyProduct[]>([])
  const [loadingMore, setLoadingMore] = useState(false)

  const [initialCart] = useState(() => loadExperienceCart())
  const [cartOrder, setCartOrder] = useState<string[]>(() => initialCart.cartOrder)
  const [lampPreviewOrder, setLampPreviewOrder] = useState<string[]>(() => initialCart.lampPreviewOrder)
  const [lampQuantity, setLampQuantity] = useState(() => initialCart.lampQuantity)
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(-1)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerHasBeenOpened, setPickerHasBeenOpened] = useState(false)
  const [rotateTrigger, setRotateTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [rotateToSide, setRotateToSide] = useState<'A' | 'B' | null>(null)
  const [detailProduct, setDetailProduct] = useState<ShopifyProduct | null>(null)
  const [detailProductFull, setDetailProductFull] = useState<ShopifyProduct | null>(null)
  const [detailProductLoading, setDetailProductLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<{ url: string; altText?: string | null }[]>([])
  const [displayedProduct, setDisplayedProduct] = useState<ShopifyProduct | null>(null)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)
  const cartCountWhenPickerOpenedRef = useRef<number>(0)
  const fullProductCacheRef = useRef<Map<string, ShopifyProduct>>(new Map())

  useEffect(() => {
    setProductsSeason1(initialSeason1)
    setProductsSeason2(initialSeason2)
    setPageInfoSeason1(initialPageInfo1)
    setPageInfoSeason2(initialPageInfo2)
  }, [initialSeason1, initialSeason2, initialPageInfo1, initialPageInfo2])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fetch artist spotlight: use ?artist= when present (e.g. /shop/experience-v2?artist=jack-jc-art), else default latest
  useEffect(() => {
    const url = initialArtistSlug
      ? `/api/shop/artist-spotlight?artist=${encodeURIComponent(initialArtistSlug)}`
      : '/api/shop/artist-spotlight'
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.vendorName && Array.isArray(data?.productIds)) {
          setSpotlightData(data as SpotlightData)
          const products = (data.products as ShopifyProduct[] | undefined) ?? []
          setSpotlightProductsFromApi(products)
          // Merge spotlight products so they appear in selector (Jack J.C. Art, ?artist= links, etc.)
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
          setSpotlightProductsFromApi([])
        }
      })
      .catch(() => {
        setSpotlightData(null)
        setSpotlightProductsFromApi([])
      })
  }, [initialArtistSlug])

  const loadMoreForSeason = useCallback(
    async (season: SeasonTab) => {
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
    },
    [pageInfoSeason1, pageInfoSeason2, loadingMore]
  )

  const currentFrontSideRef = useRef<'A' | 'B'>('A')

  const allProducts = useMemo(
    () => [...productsSeason1, ...productsSeason2],
    [productsSeason1, productsSeason2]
  )

  const selectedArtworks = useMemo(
    () => cartOrder.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean) as ShopifyProduct[],
    [allProducts, cartOrder]
  )

  const productsForActiveSeason = useMemo(
    () => (activeSeason === 'season1' ? productsSeason1 : productsSeason2),
    [activeSeason, productsSeason1, productsSeason2]
  )

  const filteredProducts = useMemo(
    () => applyFilters(productsForActiveSeason, filters, '', cartOrder),
    [productsForActiveSeason, filters, cartOrder]
  )

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

  const spotlightFallbackImageUrl = useMemo(() => {
    const first = spotlightProductsFromApi[0] ?? spotlightProducts[0] ?? productsSeason2[0]
    if (!first) return null
    return getShopifyImageUrl(getFirstImage(first), 1200) ?? getFirstImage(first)
  }, [spotlightProductsFromApi, spotlightProducts, productsSeason2])

  const handleSpotlightSelect = useCallback(
    (isExpanding: boolean) => {
      if (!spotlightData) return
      if (isExpanding) {
        const idSet = new Set(spotlightData.productIds.map((id) => id.replace(/^gid:\/\/shopify\/Product\//i, '') || id))
        const inSeason1 = productsSeason1.some((p) => idSet.has(p.id) || idSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, '')))
        const inSeason2 = productsSeason2.some((p) => idSet.has(p.id) || idSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, '')))
        if (inSeason2 && activeSeason !== 'season2') setActiveSeason('season2')
        else if (inSeason1 && !inSeason2 && activeSeason !== 'season1') setActiveSeason('season1')
        setFilters((prev) => {
          if (prev.artists.includes(spotlightData.vendorName)) return prev
          return { ...prev, artists: [...prev.artists, spotlightData.vendorName] }
        })
      } else {
        setFilters((prev) => ({
          ...prev,
          artists: prev.artists.filter((a) => a !== spotlightData.vendorName),
        }))
      }
    },
    [spotlightData, productsSeason1, productsSeason2, activeSeason]
  )

  const handleSeasonChange = useCallback((season: SeasonTab) => {
    setActiveSeason(season)
  }, [])

  const hasMoreSeason1 = pageInfoSeason1.hasNextPage
  const hasMoreSeason2 = pageInfoSeason2.hasNextPage
  const hasMore = activeSeason === 'season1' ? hasMoreSeason1 : hasMoreSeason2

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, lampPreviewOrder)
  }, [cartOrder, lampQuantity, lampPreviewOrder])

  // Preload first few product images when carousel is visible so selector opens with cached images
  useEffect(() => {
    if (!splineInView || filteredProducts.length === 0) return
    const links: HTMLLinkElement[] = []
    const id = setTimeout(() => {
      const toPreload = filteredProducts.slice(0, 4)
      toPreload.forEach((p) => {
        const url = p.featuredImage?.url ?? p.images?.edges?.[0]?.node?.url
        if (!url || !url.includes('cdn.shopify.com')) return
        const resized = getShopifyImageUrl(url, 400) ?? url
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = resized
        document.head.appendChild(link)
        links.push(link)
      })
    }, 1500)
    return () => {
      clearTimeout(id)
      links.forEach((l) => { try { document.head.removeChild(l) } catch { /* already removed */ } })
    }
  }, [splineInView, filteredProducts])

  // V1 logic: lampPreviewOrder[0] -> image1 (Side B), lampPreviewOrder[1] -> image2 (Side A)
  const sideAProduct = lampPreviewOrder[0] ? allProducts.find((p) => p.id === lampPreviewOrder[0]) ?? null : null
  const sideBProduct = lampPreviewOrder[1] ? allProducts.find((p) => p.id === lampPreviewOrder[1]) ?? null : null

  const image1 = sideAProduct ? (getShopifyImageUrl(getFirstImage(sideAProduct), 1200) ?? getFirstImage(sideAProduct)) : null
  const image2 = sideBProduct ? (getShopifyImageUrl(getFirstImage(sideBProduct), 1200) ?? getFirstImage(sideBProduct)) : null

  useEffect(() => {
    if (!sideAProduct || !image1) return
    const currentProductId = sideAProduct.id
    fetch(`/api/spline-artwork?productId=${encodeURIComponent(currentProductId)}&url=${encodeURIComponent(image1)}`)
      .catch(() => {})
  }, [sideAProduct?.id, image1])

  useEffect(() => {
    if (!sideBProduct || !image2) return
    const currentProductId = sideBProduct.id
    fetch(`/api/spline-artwork?productId=${encodeURIComponent(currentProductId)}&url=${encodeURIComponent(image2)}`)
      .catch(() => {})
  }, [sideBProduct?.id, image2])

  const lampPrice = parseFloat(lamp.priceRange?.minVariantPrice?.amount ?? '0')
  const ARTWORKS_PER_FREE_LAMP = 14
  const DISCOUNT_PER_ARTWORK = 7.5
  const artworkCount = selectedArtworks.length
  const lampPrices: number[] = []
  for (let k = 1; k <= lampQuantity; k++) {
    const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
    const end = k * ARTWORKS_PER_FREE_LAMP
    const allocated = Math.max(0, Math.min(artworkCount, end) - start)
    const discountPct = Math.min(allocated * DISCOUNT_PER_ARTWORK, 100)
    lampPrices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
  }
  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const lampSavings = lampQuantity > 0 ? lampQuantity * lampPrice - lampTotal : 0
  const artworksTotal = selectedArtworks.reduce((sum, p) => sum + parseFloat(p.priceRange?.minVariantPrice?.amount ?? '0'), 0)
  const orderTotal = lampTotal + artworksTotal
  const orderItemCount = selectedArtworks.length + lampQuantity

  useEffect(() => {
    setOrderSummary({ total: orderTotal, itemCount: orderItemCount })
  }, [orderTotal, orderItemCount, setOrderSummary])

  useEffect(() => {
    if (!lastAddedProductId) return
    const t = setTimeout(() => setLastAddedProductId(null), 1200)
    return () => clearTimeout(t)
  }, [lastAddedProductId])

  const handleLampQuantityChange = useCallback((n: number) => {
    setLampQuantity(Math.max(0, n))
  }, [])

  const getSideToShowForProduct = useCallback((order: string[], productId: string): 'A' | 'B' => {
    const productIndex = order.indexOf(productId)
    if (productIndex === 0) return 'B'
    if (productIndex === 1) return 'A'
    return 'A'
  }, [])

  const handleRemoveFromCarousel = useCallback((index: number) => {
    const removedId = cartOrder[index]
    setCartOrder((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      if (filtered.length === 0) {
        setResetTrigger((t) => t + 1)
        setRotateToSide(null)
        setActiveCarouselIndex(-1)
        setLampPreviewOrder([])
      } else {
        setLampPreviewOrder((prev) => {
          const next = prev.filter((id) => id !== removedId)
          if (next.length === 0) {
            setRotateToSide(null)
            setActiveCarouselIndex(-1)
            return []
          }
          if (next.length < prev.length) {
            const remainingId = next[0]
            const sideToShow = getSideToShowForProduct(next, remainingId)
            setRotateTrigger((t) => t + 1)
            setRotateToSide(sideToShow)
            setActiveCarouselIndex(filtered.indexOf(remainingId))
          } else {
            setActiveCarouselIndex((current) => {
              if (current === index) return Math.max(0, index - 1)
              if (current > index) return current - 1
              return current
            })
          }
          return next
        })
      }
      return filtered
    })
  }, [cartOrder, getSideToShowForProduct])

  const handleAdjustArtworkQuantity = useCallback(
    (runStartIndex: number, delta: 1 | -1) => {
      if (delta === -1) {
        const prev = cartOrder
        const id = prev[runStartIndex]
        if (!id) return
        let end = runStartIndex
        while (end < prev.length && prev[end] === id) end++
        if (end <= runStartIndex) return
        handleRemoveFromCarousel(end - 1)
        return
      }
      setCartOrder((prev) => {
        const id = prev[runStartIndex]
        if (!id) return prev
        let end = runStartIndex
        while (end < prev.length && prev[end] === id) end++
        const next = [...prev]
        next.splice(end, 0, id)
        return next
      })
    },
    [cartOrder, handleRemoveFromCarousel]
  )

  useEffect(() => {
    setOrderBarProps({
      lamp,
      selectedArtworks,
      lampQuantity,
      onLampQuantityChange: handleLampQuantityChange,
      onAdjustArtworkQuantity: handleAdjustArtworkQuantity,
      onViewLampDetail: setDetailProduct,
      isGift: false,
      lampPrice,
      lampTotal,
      artworkCount,
      lampSavings,
      pastLampPaywall: true,
    })
  }, [
    lamp,
    selectedArtworks,
    lampQuantity,
    lampPrice,
    lampTotal,
    artworkCount,
    lampSavings,
    handleLampQuantityChange,
    handleAdjustArtworkQuantity,
    setOrderBarProps,
  ])

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

  const handleLampSelect = useCallback((product: ShopifyProduct) => {
    setLampPreviewOrder((prev) => {
      const idx = prev.indexOf(product.id)
      if (idx >= 0) {
        const newOrder = prev.filter((id) => id !== product.id)
        if (newOrder.length === 0) {
          setRotateToSide(null)
          setActiveCarouselIndex(-1)
        } else {
          const remainingId = newOrder[0]
          const sideToShow = getSideToShowForProduct(newOrder, remainingId)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          setActiveCarouselIndex(cartOrder.indexOf(remainingId))
        }
        return newOrder
      }
      const newOrder = prev.length >= 2
        ? (currentFrontSideRef.current === 'A'
          ? [product.id, prev[1]]
          : [prev[0], product.id])
        : [...prev, product.id]
      const sideToShow = getSideToShowForProduct(newOrder, product.id)
      setRotateTrigger((t) => t + 1)
      setRotateToSide(sideToShow)
      setActiveCarouselIndex(cartOrder.indexOf(product.id))
      return newOrder
    })
  }, [getSideToShowForProduct, cartOrder])

  const handleToggleSelect = useCallback((product: ShopifyProduct) => {
    const isAdding = !cartOrder.includes(product.id)
    if (isAdding) setLastAddedProductId(product.id)
    setCartOrder((prev) => {
      const exists = prev.includes(product.id)
      if (exists) {
        const filtered = prev.filter((id) => id !== product.id)
        if (filtered.length === 0) {
          setResetTrigger((t) => t + 1)
          setRotateToSide(null)
          setActiveCarouselIndex(-1)
          setLampPreviewOrder([])
        } else {
          setLampPreviewOrder((prevLamp) => {
            const next = prevLamp.filter((id) => id !== product.id)
            if (next.length < prevLamp.length) {
              if (next.length === 0) {
                setRotateToSide(null)
                setActiveCarouselIndex(-1)
              } else {
                const sideToShow = getSideToShowForProduct(next, next[0])
                setRotateTrigger((t) => t + 1)
                setRotateToSide(sideToShow)
                setActiveCarouselIndex(filtered.indexOf(next[0]))
              }
            } else {
              setActiveCarouselIndex((current) => {
                const removedIdx = prev.indexOf(product.id)
                if (current === removedIdx) return Math.max(0, removedIdx - 1)
                if (current > removedIdx) return current - 1
                return current
              })
            }
            return next
          })
        }
        return filtered
      }
      return [...prev, product.id]
    })
    if (isAdding) {
      scrollToSplineRef.current = true
      setPreviewSlideIndex(0)
      setDisplayedProduct(product)
      const variant = product.variants?.edges?.[0]?.node
      trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v2' })
      setLampPreviewOrder((prev) => {
        const idx = prev.indexOf(product.id)
        if (idx >= 0) {
          const sideToShow = getSideToShowForProduct(prev, product.id)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          setActiveCarouselIndex(cartOrder.length)
          return prev
        }
        const newOrder = prev.length >= 2
          ? (currentFrontSideRef.current === 'A'
            ? [product.id, prev[1]]
            : [prev[0], product.id])
          : [...prev, product.id]
        const sideToShow = getSideToShowForProduct(newOrder, product.id)
        setRotateTrigger((t) => t + 1)
        setRotateToSide(sideToShow)
        setActiveCarouselIndex(cartOrder.length)
        return newOrder
      })
    }
  }, [activeCarouselIndex, cartOrder, getSideToShowForProduct])

  const handleTapCarouselItem = useCallback((index: number) => {
    const product = selectedArtworks[index]
    if (!product) return
    scrollToSplineRef.current = true
    setPreviewSlideIndex(0)
    setActiveCarouselIndex(index)
    if (product.id === lamp.id) {
      setDisplayedProduct(lamp)
      return
    }
    if (lampPreviewOrder.includes(product.id)) {
      setRotateToSide(getSideToShowForProduct(lampPreviewOrder, product.id))
      setRotateTrigger((t) => t + 1)
      return
    }
    handleLampSelect(product)
  }, [selectedArtworks, handleLampSelect, lampPreviewOrder, lamp.id, getSideToShowForProduct])

  const handleFrontSideSettled = useCallback((side: 'A' | 'B') => {
    currentFrontSideRef.current = side
  }, [])

  const scrollToSplineRef = useRef(false)
  const handleSwitchToSide = useCallback((side: 'A' | 'B') => {
    scrollToSplineRef.current = true
    setRotateToSide(side)
    setRotateTrigger((t) => t + 1)
    setPreviewSlideIndex(0)
  }, [])

  const handleGalleryImagesChange = useCallback((images: { url: string; altText?: string | null }[]) => {
    setGalleryImages(images)
    setPreviewSlideIndex(0)
  }, [])

  const handleGoToSlide = useCallback((index: number) => {
    setPreviewSlideIndex(index)
  }, [])

  const handleOpenPicker = useCallback(() => {
    cartCountWhenPickerOpenedRef.current = cartOrder.length
    setPickerHasBeenOpened(true)
    setIsPickerOpen(true)
  }, [cartOrder.length])

  const handleClosePicker = useCallback(() => {
    if (cartOrder.length > cartCountWhenPickerOpenedRef.current) {
      triggerPriceBump()
    }
    setIsPickerOpen(false)
  }, [cartOrder.length, triggerPriceBump])

  const handleViewDetail = useCallback((product: ShopifyProduct) => {
    setDetailProduct(product)
  }, [])

  const isInCart = useCallback((productId: string) => cartOrder.includes(productId), [cartOrder])
  const { theme } = useExperienceTheme()
  const [splineInView, setSplineInView] = useState(true)

  useEffect(() => {
    if (lampPreviewOrder.length === 0) setDisplayedProduct(lamp)
  }, [lampPreviewOrder.length, lamp])

  // Sync displayedIndex and displayedProduct when user taps carousel item (last selected = displayed)
  const lastClickedProductId = activeCarouselIndex >= 0 ? selectedArtworks[activeCarouselIndex]?.id ?? null : null
  const lastClickedProduct = activeCarouselIndex >= 0 ? selectedArtworks[activeCarouselIndex] ?? null : null
  useEffect(() => {
    if (!lastClickedProductId || !lastClickedProduct) return
    if (lastClickedProduct.id === lamp.id) {
      setDisplayedProduct(lamp)
      return
    }
    if (sideAProduct && sideBProduct) {
      if (sideAProduct.id === lastClickedProductId) {
        setDisplayedIndex(0)
        setDisplayedProduct(sideAProduct)
      } else if (sideBProduct.id === lastClickedProductId) {
        setDisplayedIndex(1)
        setDisplayedProduct(sideBProduct)
      }
    } else {
      setDisplayedProduct(lastClickedProduct)
    }
  }, [lastClickedProductId, lastClickedProduct, sideAProduct, sideBProduct, lamp.id])

  const isDesktop = !isMobile
  useEffect(() => {
    if (!isDesktop) {
      setHeaderCenterContent(null)
      return () => setHeaderCenterContent(null)
    }
    if (!displayedProduct) {
      setHeaderCenterContent(null)
      return
    }
    const title = displayedProduct.title ?? 'Untitled'
    const artist = displayedProduct.id === lamp.id ? '' : (displayedProduct.vendor ?? '')
    setHeaderCenterContent(
      <button
        type="button"
        onClick={() => handleViewDetail(displayedProduct)}
        className={cn(
          'text-center min-w-0 max-w-[200px] md:max-w-[280px] truncate block mx-auto',
          theme === 'light' ? 'text-neutral-900' : 'text-white'
        )}
      >
        <p className={cn('text-sm font-semibold truncate', theme === 'light' ? 'text-neutral-900' : 'text-white')}>
          {title}
        </p>
        {artist && (
          <p className={cn('text-xs truncate', theme === 'light' ? 'text-neutral-500' : 'text-white/70')}>
            by {artist}
          </p>
        )}
      </button>
    )
    return () => setHeaderCenterContent(null)
  }, [isDesktop, displayedProduct, lamp.id, theme, handleViewDetail, setHeaderCenterContent])

  // 3-section layout: 0=Spline, 1=Accordion (if product shown), 2=Gallery (if 2+ images, first shown in details)
  const hasAccordion = !!displayedProduct
  const hasGallery = galleryImages.length > 1 // First image shown in artwork details, need 2+ for gallery section
  const sectionCount =
    1 + (hasAccordion ? 1 : 0) + (hasGallery ? galleryImages.length - 1 : 0)
  const gallerySectionIndex = hasAccordion ? 2 : 1
  const prevDisplayedIdRef = useRef<string | null>(null)
  useEffect(() => {
    const currentId = displayedProduct?.id ?? null
    const prevId = prevDisplayedIdRef.current
    prevDisplayedIdRef.current = currentId

    const scrollToSpline = scrollToSplineRef.current
    scrollToSplineRef.current = false

    setPreviewSlideIndex((prev) => {
      const max = Math.max(0, sectionCount - 1)
      if (prev > max) return max
      // When user taps 1|2 or carousel item, scroll to Spline
      if (scrollToSpline) return 0
      return prev
    })
  }, [displayedProduct?.id, galleryImages.length, sectionCount])

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col">
      <SplineFullScreen
        image1={image1}
        image2={image2}
        spotlightFallbackImageUrl={spotlightFallbackImageUrl}
        rotateToSide={rotateToSide}
        rotateTrigger={rotateTrigger}
        resetTrigger={resetTrigger}
        onFrontSideSettled={handleFrontSideSettled}
        lampPreviewCount={lampPreviewOrder.length}
        pickerOpen={isPickerOpen}
        topBarContent={({ onRotate, isDesktop }) => (
          <ArtworkInfoBar
            sideAProduct={sideAProduct}
            sideBProduct={sideBProduct}
            lampProduct={lampPreviewOrder.length === 0 ? lamp : null}
            displayedIndex={displayedIndex}
            lastClickedProductId={lastClickedProductId}
            onGalleryImagesChange={handleGalleryImagesChange}
            onGoToSlide={handleGoToSlide}
            currentSlide={previewSlideIndex}
            gallerySlideOffset={gallerySectionIndex}
            onViewDetail={handleViewDetail}
            onDisplayedProductChange={setDisplayedProduct}
            thumbnailPlacement="right"
            onRotate={onRotate}
            hideTitle={isDesktop}
          />
        )}
        galleryImages={galleryImages}
        displayedProduct={displayedProduct}
        productIncludes={
          displayedProduct?.id === lamp.id
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
          displayedProduct?.id === lamp.id
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
        currentSlide={previewSlideIndex}
        onSlideChange={setPreviewSlideIndex}
        onSplineInView={setSplineInView}
      />

      <ArtworkCarouselBar
        splineInView={splineInView}
          selectedArtworks={selectedArtworks}
          activeIndex={activeCarouselIndex}
          lampPreviewOrder={lampPreviewOrder}
          onTapItem={handleTapCarouselItem}
          onRemoveItem={handleRemoveFromCarousel}
          onOpenPicker={handleOpenPicker}
        />

      {pickerHasBeenOpened && (
      <ArtworkPickerSheet
        isOpen={isPickerOpen}
        onClose={handleClosePicker}
        products={filteredProducts}
        selectedArtworks={selectedArtworks}
        lampPreviewOrder={lampPreviewOrder}
        onToggleSelect={handleToggleSelect}
        lastAddedProductId={lastAddedProductId}
        hasMore={hasMore}
        onLoadMore={() => loadMoreForSeason(activeSeason)}
        activeSeason={activeSeason}
        onSeasonChange={handleSeasonChange}
        filters={filters}
        onFiltersChange={setFilters}
        filterOpen={filterOpen}
        onFilterOpen={() => setFilterOpen(true)}
        onFilterClose={() => setFilterOpen(false)}
        spotlightData={spotlightData}
        spotlightProducts={spotlightProducts.length > 0 ? spotlightProducts : spotlightProductsFromApi}
        onSpotlightSelect={handleSpotlightSelect}
        productsForFilterPanel={productsForActiveSeason}
        cartOrder={cartOrder}
      />
      )}

      {detailProduct && (
        <ArtworkDetail
          product={detailProductFull ?? detailProduct}
          artistSlugOverride={detailProduct.id !== lamp.id && spotlightData && spotlightData.vendorName === detailProduct.vendor ? spotlightData.vendorSlug : undefined}
          spotlightDataOverride={detailProduct.id !== lamp.id && spotlightData && spotlightData.vendorName === detailProduct.vendor ? spotlightData : null}
          isSelected={
            detailProduct.id === lamp.id
              ? lampQuantity > 0
              : isInCart(detailProduct.id)
          }
          onToggleSelect={() => {
            if (!detailProduct) return
            if (detailProduct.id === lamp.id) {
              handleLampQuantityChange(lampQuantity > 0 ? 0 : 1)
            } else {
              handleToggleSelect(detailProduct)
            }
          }}
          onClose={() => setDetailProduct(null)}
          isLoadingDetails={detailProductLoading}
          isMobile={isMobile}
          hideCta
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
        />
      )}

      <OrderBar
        lamp={lamp}
        selectedArtworks={selectedArtworks}
        lampQuantity={lampQuantity}
        onLampQuantityChange={handleLampQuantityChange}
        onAdjustArtworkQuantity={handleAdjustArtworkQuantity}
        isGift={false}
      />
    </div>
  )
}
