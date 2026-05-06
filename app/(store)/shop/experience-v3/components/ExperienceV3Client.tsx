'use client'

/**
 * `/shop/experience-v3`: desktop-first layout — hero media (Spline or gallery toggle), centered copy panel,
 * and a collection slideout. Selecting a card previews on the hero; "+" only adjusts checkout without moving preview.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import type { SpotlightData } from '@/app/(store)/shop/experience-v2/components/ArtistSpotlightBanner'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { formatPriceCompact } from '@/lib/utils'
import { useExperienceOrder } from '@/app/(store)/shop/experience-v2/ExperienceOrderContext'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { resolveArtworkDetailProduct } from '@/lib/shop/resolve-artwork-detail-product'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { fetchStreetEditionStatesMap } from '@/lib/shop/fetch-street-edition-states-client'
import { normalizeExperienceProductKey } from '@/lib/shop/experience-artwork-unit-price'
import {
  computeExperienceFeaturedBundlePricing,
} from '@/lib/shop/experience-bundle-order-pricing'
import { getSpotlightPairProducts } from '@/lib/shop/experience-featured-bundle'
import {
  ARTWORKS_PER_FREE_LAMP,
  lampVolumeDiscountPercentForAllocated,
} from '@/lib/shop/lamp-artwork-volume-discount'
import { trackAddToCart } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { loadExperienceCart, saveExperienceCart } from '@/lib/shop/experience-cart-persistence'
import {
  applyFilters,
  DEFAULT_FILTERS,
  type FilterState,
} from '@/app/(store)/shop/experience-v2/components/FilterPanel'
import { useShopDiscountSettings } from '@/app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext'
import {
  experienceEarlyAccessForProduct,
  productMatchesSpotlight,
  spotlightOverridesForProduct,
} from '@/lib/shop/experience-spotlight-match'
import { captureFunnelEvent, getDeviceType } from '@/lib/posthog'

import {
  ExperienceV3CollectionSlideout,
  type SlideoutSeason,
} from './ExperienceV3CollectionSlideout'
import { ExperienceV3HeroMedia } from './ExperienceV3HeroMedia'
import { ExperienceV3CenterPanel } from './ExperienceV3CenterPanel'

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

const OrderBar = dynamic(() => import('@/app/(store)/shop/experience-v2/components/OrderBar').then((m) => m.OrderBar), {
  ssr: false,
})

const ArtworkDetail = dynamic(
  () =>
    import('@/app/(store)/shop/experience-v2/components/ArtworkDetail').then((m) => ({ default: m.ArtworkDetail })),
  { ssr: false }
)

function getFirstImage(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

type PageInfo = { hasNextPage: boolean; endCursor: string | null }

interface ExperienceV3ClientProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: PageInfo
  pageInfoSeason2: PageInfo
  initialArtistSlug?: string
}

export function ExperienceV3Client({
  lamp,
  productsSeason1: initialSeason1,
  productsSeason2: initialSeason2,
  pageInfoSeason1: initialPageInfo1,
  pageInfoSeason2: initialPageInfo2,
  initialArtistSlug,
}: ExperienceV3ClientProps) {
  const searchParams = useSearchParams()
  const { setOrderSummary, setOrderBarProps, triggerPriceBump } = useExperienceOrder()
  const { flags: discountFlags, featuredBundle: featuredBundleDiscount } = useShopDiscountSettings()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = discountFlags
  const { isAuthenticated } = useShopAuthContext()

  const initialCartRef = useRef(loadExperienceCart())
  const initialCart = initialCartRef.current

  const [productsSeason1, setProductsSeason1] = useState(() => initialSeason1)
  const [productsSeason2, setProductsSeason2] = useState(() => initialSeason2)
  const [pageInfoSeason1, setPageInfoSeason1] = useState(() => initialPageInfo1)
  const [pageInfoSeason2, setPageInfoSeason2] = useState(() => initialPageInfo2)

  const [activeSeason, setActiveSeason] = useState<SlideoutSeason>('season2')
  const [filters] = useState<FilterState>(DEFAULT_FILTERS)
  const [loadingMore, setLoadingMore] = useState(false)

  const [cartOrder, setCartOrder] = useState<string[]>(() => initialCart.cartOrder)
  const [lampPreviewOrder, setLampPreviewOrder] = useState<string[]>(() => initialCart.lampPreviewOrder)
  const [heroPreviewOrder, setHeroPreviewOrder] = useState<string[]>(() => {
    if (initialCart.lampPreviewOrder.length > 0) return initialCart.lampPreviewOrder.slice(0, 2)
    return []
  })

  const [lampQuantity, setLampQuantity] = useState(() => initialCart.lampQuantity)
  const [slideoutCollapsed, setSlideoutCollapsed] = useState(false)

  const [rotateTrigger, setRotateTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [rotateToSide, setRotateToSide] = useState<'A' | 'B' | null>(null)
  const currentFrontSideRef = useRef<'A' | 'B'>('A')

  const [spotlightData, setSpotlightData] = useState<SpotlightData | null>(null)
  const [spotlightProductsFromApi, setSpotlightProductsFromApi] = useState<ShopifyProduct[]>([])
  const [streetEditionByProductId, setStreetEditionByProductId] = useState<Record<string, StreetEditionStatesRow>>({})
  const [lockedArtworkPrices, setLockedArtworkPrices] = useState<Record<string, number>>({})

  const [detailProduct, setDetailProduct] = useState<ShopifyProduct | null>(null)
  const [detailProductFull, setDetailProductFull] = useState<ShopifyProduct | null>(null)
  const [detailProductLoading, setDetailProductLoading] = useState(false)
  const fullProductCacheRef = useRef<Map<string, ShopifyProduct>>(new Map())

  /** Full product payloads for hero gallery + accordion */
  const [heroHydratedProduct, setHeroHydratedProduct] = useState<ShopifyProduct | null>(null)

  const getSideToShowForProduct = useCallback((order: string[], productId: string): 'A' | 'B' => {
    const idx = order.indexOf(productId)
    if (idx === 0) return 'B'
    if (idx === 1) return 'A'
    return 'A'
  }, [])

  useEffect(() => {
    setProductsSeason1(initialSeason1)
    setProductsSeason2(initialSeason2)
    setPageInfoSeason1(initialPageInfo1)
    setPageInfoSeason2(initialPageInfo2)
  }, [initialSeason1, initialSeason2, initialPageInfo1, initialPageInfo2])

  useEffect(() => {
    const forceUnlisted = ['1', 'true', 'yes'].includes((searchParams.get('unlisted') ?? '').toLowerCase())
    const base = initialArtistSlug
      ? `/api/shop/artist-spotlight?artist=${encodeURIComponent(initialArtistSlug)}`
      : '/api/shop/artist-spotlight'
    const url = forceUnlisted && initialArtistSlug ? `${base}&unlisted=1` : base
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.vendorName && Array.isArray(data?.productIds)) {
          setSpotlightData(data as SpotlightData)
          const products = (data.products as ShopifyProduct[] | undefined) ?? []
          setSpotlightProductsFromApi(products)
          if (products.length) {
            setProductsSeason2((prev) => {
              const seen = new Set(prev.map((p) => p.id))
              const merge = products.filter((p) => !seen.has(p.id))
              return merge.length ? [...prev, ...merge] : prev
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
  }, [initialArtistSlug, searchParams])

  const loadMoreForSeason = useCallback(
    async (season: SlideoutSeason) => {
      const info = season === 'season1' ? pageInfoSeason1 : pageInfoSeason2
      if (!info.hasNextPage || !info.endCursor || loadingMore) return
      const handle = season === 'season1' ? SEASON_1_HANDLE : SEASON_2_HANDLE
      setLoadingMore(true)
      try {
        const res = await fetch(
          `/api/shop/experience/collection-products?handle=${encodeURIComponent(handle)}&after=${encodeURIComponent(info.endCursor)}&first=${LOAD_MORE_PAGE_SIZE}`
        )
        const data = await res.json().catch(() => ({}))
        const rows: ShopifyProduct[] = data.products ?? []
        if (season === 'season1') {
          setProductsSeason1((prev) => [...prev, ...rows])
          setPageInfoSeason1({ hasNextPage: data.hasNextPage ?? false, endCursor: data.endCursor ?? null })
        } else {
          setProductsSeason2((prev) => [...prev, ...rows])
          setPageInfoSeason2({ hasNextPage: data.hasNextPage ?? false, endCursor: data.endCursor ?? null })
        }
      } finally {
        setLoadingMore(false)
      }
    },
    [pageInfoSeason1, pageInfoSeason2, loadingMore]
  )

  const allProducts = useMemo(() => [...productsSeason1, ...productsSeason2], [productsSeason1, productsSeason2])

  const findProductById = useCallback(
    (id: string) => {
      const k = normalizeExperienceProductKey(id)
      return allProducts.find((p) => normalizeExperienceProductKey(p.id) === k) ?? null
    },
    [allProducts]
  )

  /** Default hero visuals when shelf is empty — mirror spotlight pair only for preview IDs (never cart mutation). */
  useEffect(() => {
    if (heroPreviewOrder.length > 0) return
    const pair = getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts)
    if (!pair) return
    const [p1, p2] = pair
    if (!p1?.availableForSale && !p2?.availableForSale) return
    const next: string[] = []
    if (p1.availableForSale) next.push(p1.id)
    if (p2 && p2.availableForSale && p2.id !== p1.id) next.push(p2.id)
    if (next.length) setHeroPreviewOrder(next.slice(0, 2))
  }, [heroPreviewOrder.length, spotlightData, spotlightProductsFromApi, allProducts])

  useEffect(() => {
    if (allProducts.length === 0) return
    const ids = allProducts.map((p) => normalizeShopifyProductId(p.id)).filter((x): x is string => !!x)
    if (ids.length === 0) return
    let cancelled = false
    const t = window.setTimeout(() => {
      void fetchStreetEditionStatesMap(ids)
        .then((m) => {
          if (!cancelled) setStreetEditionByProductId(m)
        })
        .catch(() => {})
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [allProducts])

  useEffect(() => {
    if (!isAuthenticated) {
      setLockedArtworkPrices({})
      return
    }
    fetch('/api/shop/reserve/locks', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { locks: [] }))
      .then((j: { locks?: Array<{ shopify_product_id: string; locked_price_usd: number }> }) => {
        const m: Record<string, number> = {}
        for (const row of j.locks || []) {
          if (row.shopify_product_id && row.locked_price_usd > 0) {
            m[row.shopify_product_id] = row.locked_price_usd
          }
        }
        setLockedArtworkPrices(m)
      })
      .catch(() => setLockedArtworkPrices({}))
  }, [isAuthenticated])

  const selectedArtworks = useMemo(() => cartOrder.map((id) => findProductById(id)).filter(Boolean) as ShopifyProduct[], [cartOrder, findProductById])

  /** Hydrate hero when preview IDs change — left column gallery + accordion */
  const primaryHeroProductId = heroPreviewOrder[0] ?? null
  useEffect(() => {
    if (!primaryHeroProductId) {
      setHeroHydratedProduct(null)
      return
    }
    const lite = findProductById(primaryHeroProductId)
    if (!lite) return
    const handle = lite.handle
    const cached = fullProductCacheRef.current.get(handle)
    if (cached) {
      setHeroHydratedProduct(cached)
      return
    }
    let cancelled = false
    fetch(`/api/shop/products/${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.product) return
        const full = data.product as ShopifyProduct
        fullProductCacheRef.current.set(handle, full)
        setHeroHydratedProduct(full)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [primaryHeroProductId, findProductById])

  const sideAProduct = heroPreviewOrder[0] ? findProductById(heroPreviewOrder[0]) : null
  const sideBProduct = heroPreviewOrder[1] ? findProductById(heroPreviewOrder[1]) : null

  const image1 = sideAProduct ? (getShopifyImageUrl(getFirstImage(sideAProduct), 1200) ?? getFirstImage(sideAProduct)) : null
  const image2 = sideBProduct ? (getShopifyImageUrl(getFirstImage(sideBProduct), 1200) ?? getFirstImage(sideBProduct)) : null

  useEffect(() => {
    if (!sideAProduct || !image1) return
    void fetch(`/api/spline-artwork?productId=${encodeURIComponent(sideAProduct.id)}&url=${encodeURIComponent(image1)}`).catch(
      () => {}
    )
  }, [sideAProduct?.id, image1])

  useEffect(() => {
    if (!sideBProduct || !image2) return
    void fetch(`/api/spline-artwork?productId=${encodeURIComponent(sideBProduct.id)}&url=${encodeURIComponent(image2)}`).catch(
      () => {}
    )
  }, [sideBProduct?.id, image2])

  const heroProductForPanels = heroHydratedProduct ?? sideAProduct
  const streetRowForHero = useMemo(() => {
    const p = heroProductForPanels
    if (!p || p.id === lamp.id) return null
    const k = normalizeShopifyProductId(p.id)
    if (!k) return null
    return streetEditionByProductId[k] ?? null
  }, [heroProductForPanels, lamp.id, streetEditionByProductId])

  useEffect(() => {
    captureFunnelEvent('experience_shell_entry', {
      surface: 'experience_v3',
      device_type: getDeviceType(),
      artist_slug: initialArtistSlug ?? null,
    })
  }, [initialArtistSlug])

  const productsForSeason = activeSeason === 'season1' ? productsSeason1 : productsSeason2
  const filteredProducts = useMemo(
    () => applyFilters(productsForSeason, filters, '', cartOrder),
    [productsForSeason, filters, cartOrder]
  )

  const spotlightPairProducts = useMemo(
    () => getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts),
    [spotlightData, spotlightProductsFromApi, allProducts]
  )

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, lampPreviewOrder)
  }, [cartOrder, lampQuantity, lampPreviewOrder])

  /** Cart-only handler — previews stay on `heroPreviewOrder`. */
  const handleQuickAddToCart = useCallback(
    (product: ShopifyProduct) => {
      if (product.availableForSale === false) return
      if (product.id === lamp.id) {
        setLampQuantity((q) => (q <= 0 ? 1 : q))
        triggerPriceBump()
        return
      }
      setCartOrder((prev) => {
        const nextCart = [...prev, product.id]
        triggerPriceBump()
        const variant = product.variants?.edges?.[0]?.node
        trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v3' })

        setLampPreviewOrder((prevLamp) => {
          const idx = prevLamp.indexOf(product.id)
          if (idx >= 0) {
            const sideToShow = getSideToShowForProduct(prevLamp, product.id)
            setRotateTrigger((t) => t + 1)
            setRotateToSide(sideToShow)
            return prevLamp
          }
          const newOrder =
            prevLamp.length >= 2
              ? currentFrontSideRef.current === 'A'
                ? [product.id, prevLamp[1]!]
                : [prevLamp[0]!, product.id]
              : [...prevLamp, product.id]
          const sideToShow = getSideToShowForProduct(newOrder, product.id)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          return newOrder
        })
        return nextCart
      })
    },
    [getSideToShowForProduct, triggerPriceBump, lamp.id]
  )

  const handleSelectArtworkPreview = useCallback(
    (product: ShopifyProduct) => {
      if (product.id === lamp.id) {
        setHeroPreviewOrder([])
        setRotateToSide(null)
        setResetTrigger((t) => t + 1)
        return
      }
      setHeroPreviewOrder([product.id])
      const sideToShow = getSideToShowForProduct([product.id], product.id)
      setRotateTrigger((t) => t + 1)
      setRotateToSide(sideToShow)
      captureFunnelEvent('experience_artwork_previewed', {
        product_id: product.id,
        handle: product.handle,
        device_type: getDeviceType(),
        surface: 'experience_v3_card',
      })
    },
    [getSideToShowForProduct]
  )

  /** Center CTA duplicates quick add semantics — still does not mutate hero selections. */
  const handlePrimaryAddFocused = useCallback(() => {
    if (!heroProductForPanels || heroProductForPanels.id === lamp.id) {
      setLampQuantity((q) => (q <= 0 ? 1 : q))
      triggerPriceBump()
      return
    }
    handleQuickAddToCart(heroProductForPanels)
  }, [handleQuickAddToCart, heroProductForPanels, lamp.id, triggerPriceBump])

  const handleRemoveCartOrderItemAtIndex = useCallback(
    (cartIndex: number) => {
      setCartOrder((prev) => {
        if (cartIndex < 0 || cartIndex >= prev.length) return prev
        const removedId = prev[cartIndex]!
        const filtered = prev.filter((_, i) => i !== cartIndex)

        if (filtered.length === 0) {
          setResetTrigger((t) => t + 1)
          setRotateToSide(null)
          setLampPreviewOrder([])
          return filtered
        }

        setLampPreviewOrder((prevLamp) => {
          const next = prevLamp.filter((id) => id !== removedId)
          if (next.length === 0) {
            setRotateToSide(null)
            return []
          }
          if (next.length < prevLamp.length) {
            const remainingId = next[0]
            const sideToShow = getSideToShowForProduct(next, remainingId)
            setRotateTrigger((t) => t + 1)
            setRotateToSide(sideToShow)
          }
          return next
        })

        return filtered
      })
    },
    [getSideToShowForProduct]
  )

  const handleAdjustArtworkQuantity = useCallback(
    (runStartIndex: number, delta: 1 | -1) => {
      if (delta === -1) {
        const id = cartOrder[runStartIndex]
        if (!id) return
        let end = runStartIndex
        while (end < cartOrder.length && cartOrder[end] === id) end++
        if (end <= runStartIndex) return
        handleRemoveCartOrderItemAtIndex(end - 1)
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
    [cartOrder, handleRemoveCartOrderItemAtIndex]
  )

  const handleLampQuantityChange = useCallback((n: number) => {
    setLampQuantity(Math.max(0, n))
  }, [])

  const lampPrice = parseFloat(lamp.priceRange?.minVariantPrice?.amount ?? '0')
  const artworkCountLocal = selectedArtworks.length

  const lampPrices = useMemo(() => {
    const prices: number[] = []
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCountLocal, end) - start)
      const discountPct = lampVolumeDiscountPercentForAllocated(allocated, lampVolumeDiscountEnabled)
      prices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    }
    return prices
  }, [lampQuantity, artworkCountLocal, lampPrice, lampVolumeDiscountEnabled])

  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const lampSavings = lampQuantity > 0 ? lampQuantity * lampPrice - lampTotal : 0

  const artworkPriceMaps = useMemo(
    () => ({
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: Object.fromEntries(
        Object.entries(streetEditionByProductId)
          .filter(([, row]) => row.priceUsd != null && row.priceUsd > 0)
          .map(([id, row]) => [id, row.priceUsd!])
      ),
      seasonBandsFallback: activeSeason === 'season2' ? (2 as const) : (1 as const),
    }),
    [lockedArtworkPrices, streetEditionByProductId, activeSeason]
  )

  const bundlePricing = useMemo(
    () =>
      computeExperienceFeaturedBundlePricing({
        lampQuantity,
        lampPrices,
        cartOrder,
        spotlightProductIds: spotlightData?.productIds ?? [],
        spotlightPairProducts,
        resolveProduct: (gid) => allProducts.find((p) => p.id === gid),
        priceMaps: artworkPriceMaps,
        selectedProducts: selectedArtworks,
        featuredBundle: featuredBundleDiscount,
      }),
    [
      lampQuantity,
      lampPrices,
      cartOrder,
      spotlightData?.productIds,
      spotlightPairProducts,
      allProducts,
      artworkPriceMaps,
      selectedArtworks,
      featuredBundleDiscount,
    ]
  )

  const featuredArtistBundlePricingActive = bundlePricing.pricingActive
  const orderTotalUsd = bundlePricing.orderTotalUsd

  useEffect(() => {
    setOrderSummary({
      total: orderTotalUsd,
      itemCount: artworkCountLocal + lampQuantity,
    })
  }, [orderTotalUsd, artworkCountLocal, lampQuantity, setOrderSummary])

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
      artworkCount: artworkCountLocal,
      lampSavings,
      pastLampPaywall: true,
      lockedArtworkPrices,
      streetLadderPrices: artworkPriceMaps.streetLadderUsdByProductId,
      streetPricingSeasonFallback: activeSeason === 'season2' ? 2 : 1,
      featuredBundleCheckout: featuredArtistBundlePricingActive ? bundlePricing.featuredBundleCheckout : null,
      bundlePricedArtworkIndices: featuredArtistBundlePricingActive
        ? bundlePricing.bundlePricedArtworkIndices
        : undefined,
    })
  }, [
    lamp,
    selectedArtworks,
    lampQuantity,
    handleLampQuantityChange,
    handleAdjustArtworkQuantity,
    lampPrice,
    lampTotal,
    artworkCountLocal,
    lampSavings,
    lockedArtworkPrices,
    artworkPriceMaps.streetLadderUsdByProductId,
    activeSeason,
    featuredArtistBundlePricingActive,
    bundlePricing.featuredBundleCheckout,
    bundlePricing.bundlePricedArtworkIndices,
    setOrderBarProps,
  ])

  useEffect(() => {
    if (!detailProduct) {
      setDetailProductFull(null)
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
    return () => {
      cancelled = true
    }
  }, [detailProduct])

  const detailResolved = useMemo(
    () => (detailProduct ? resolveArtworkDetailProduct(detailProduct, detailProductFull) : null),
    [detailProduct, detailProductFull]
  )

  const cartIdSet = useMemo(() => new Set(cartOrder), [cartOrder])
  const hasMoreActiveSeason = activeSeason === 'season1' ? pageInfoSeason1.hasNextPage : pageInfoSeason2.hasNextPage

  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!hasMoreActiveSeason || slideoutCollapsed) return
    const el = loadMoreSentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) void loadMoreForSeason(activeSeason)
      },
      { rootMargin: '240px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMoreActiveSeason, activeSeason, loadMoreForSeason, slideoutCollapsed])

  const detailStreetEditionRow = useMemo(() => {
    if (!detailProduct || detailProduct.id === lamp.id) return null
    const k = normalizeShopifyProductId(detailProduct.id)
    if (!k) return null
    return streetEditionByProductId[k] ?? null
  }, [detailProduct, lamp.id, streetEditionByProductId])

  const handleFrontSideSettled = useCallback((side: 'A' | 'B') => {
    currentFrontSideRef.current = side
  }, [])

  const handleDetailToggleFromSheet = useCallback(() => {
    if (!detailProduct) return
    if (detailProduct.id === lamp.id) {
      handleLampQuantityChange(lampQuantity > 0 ? 0 : 1)
      return
    }
    if (cartOrder.includes(detailProduct.id)) {
      const idx = cartOrder.lastIndexOf(detailProduct.id)
      if (idx >= 0) handleRemoveCartOrderItemAtIndex(idx)
      return
    }
    handleQuickAddToCart(detailProduct)
  }, [
    cartOrder,
    detailProduct,
    handleLampQuantityChange,
    handleQuickAddToCart,
    handleRemoveCartOrderItemAtIndex,
    lamp.id,
    lampQuantity,
  ])

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-[#171515] lg:flex-row lg:bg-transparent">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-[48vh] flex-1 flex-col p-4 pb-6 lg:min-h-0 lg:max-w-[min(52vw,640px)] lg:p-6">
          <ExperienceV3HeroMedia
            image1={image1}
            image2={image2}
            galleryProduct={heroProductForPanels}
            rotateToSide={rotateToSide}
            rotateTrigger={rotateTrigger}
            resetTrigger={resetTrigger}
            onFrontSideSettled={handleFrontSideSettled}
          />
        </div>

        <ExperienceV3CenterPanel
          lamp={lamp}
          heroProduct={heroProductForPanels}
          streetEdition={streetRowForHero}
          lampQuantity={lampQuantity}
          onPrimaryAdd={heroProductForPanels ? handlePrimaryAddFocused : undefined}
          onOpenSpecs={
            heroProductForPanels ? () => setDetailProduct(heroHydratedProduct ?? heroProductForPanels) : undefined
          }
          primaryDisabled={
            !heroProductForPanels ||
            (heroProductForPanels.id !== lamp.id && heroProductForPanels.availableForSale === false)
          }
          primaryLabel={
            heroProductForPanels?.id === lamp.id
              ? lampQuantity > 0
                ? 'Lamp in cart'
                : `Add Lamp — $${formatPriceCompact(lampPrice)}`
              : undefined
          }
        />
      </div>

      <ExperienceV3CollectionSlideout
        collapsed={slideoutCollapsed}
        onCollapsedChange={setSlideoutCollapsed}
        products={filteredProducts}
        cartProductIds={cartIdSet}
        activeSeason={activeSeason}
        onSeasonChange={setActiveSeason}
        onSelectArtwork={handleSelectArtworkPreview}
        onQuickAddToCart={handleQuickAddToCart}
        streetEditionByProductId={streetEditionByProductId}
        seasonBandsFallback={activeSeason === 'season2' ? 2 : 1}
        scrollSentinel={<div ref={loadMoreSentinelRef} className="h-1 w-full shrink-0" aria-hidden />}
      />

      <OrderBar
        lamp={lamp}
        selectedArtworks={selectedArtworks}
        lampQuantity={lampQuantity}
        onLampQuantityChange={handleLampQuantityChange}
        onAdjustArtworkQuantity={handleAdjustArtworkQuantity}
        onViewLampDetail={setDetailProduct}
        isGift={false}
        lockedArtworkPrices={lockedArtworkPrices}
        streetLadderPrices={artworkPriceMaps.streetLadderUsdByProductId}
        streetPricingSeasonFallback={activeSeason === 'season2' ? 2 : 1}
        featuredBundleCheckout={
          featuredArtistBundlePricingActive ? bundlePricing.featuredBundleCheckout : null
        }
        bundlePricedArtworkIndices={
          featuredArtistBundlePricingActive ? bundlePricing.bundlePricedArtworkIndices : undefined
        }
      />

      {detailResolved && detailProduct ? (
        <ArtworkDetail
          product={detailResolved}
          {...spotlightOverridesForProduct(detailResolved, lamp.id, spotlightData)}
          isSelected={
            detailProduct.id === lamp.id ? lampQuantity > 0 : cartOrder.includes(detailProduct.id)
          }
          onToggleSelect={handleDetailToggleFromSheet}
          onClose={() => setDetailProduct(null)}
          isLoadingDetails={detailProductLoading}
          isMobile={false}
          inline={false}
          streetEdition={detailStreetEditionRow ?? null}
          isEarlyAccess={experienceEarlyAccessForProduct(detailProduct, lamp.id, spotlightData)}
          isNewDrop={
            detailProduct.id !== lamp.id &&
            !!spotlightData &&
            productMatchesSpotlight(detailProduct, spotlightData) &&
            !spotlightData.unlisted
          }
        />
      ) : null}
    </div>
  )
}
