'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { trackAddToCart, trackEnhancedEvent, trackViewItem, isGAEnabled } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import {
  applyFilters,
  DEFAULT_FILTERS,
  type FeaturedBundleFilterOffer,
  type FilterPanelLampOffer,
  type FilterState,
} from './FilterPanel'
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
import { motion } from 'framer-motion'
import { TicketPercent } from 'lucide-react'
import { cn, formatPriceCompact } from '@/lib/utils'
import {
  carouselSlotIndexForProductId,
  clampCarouselIndex,
  uniqueCartIdsInOrder,
} from '@/lib/shop/experience-carousel-cart'
import {
  experienceEarlyAccessForProduct,
  experienceVendorsLooselyEqual,
  productMatchesSpotlight,
  spotlightOverridesForProduct,
} from '@/lib/shop/experience-spotlight-match'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { resolveArtworkDetailProduct } from '@/lib/shop/resolve-artwork-detail-product'
import { resolveExperienceNextAction } from '@/lib/shop/experience-journey-next-action'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { fetchStreetEditionStatesMap } from '@/lib/shop/fetch-street-edition-states-client'
import { loadExperienceCart, saveExperienceCart } from '@/lib/shop/experience-cart-persistence'
import { useExperienceArtistCatalog } from '@/lib/shop/use-experience-artist-catalog'
import { computeExperienceFeaturedBundlePricing } from '@/lib/shop/experience-bundle-order-pricing'
import {
  computeFeaturedBundleRegularSubtotalUsd,
  getSpotlightPairProducts,
  isFeaturedArtistBundleEligible,
  isFeaturedBundleSpotlightPrintsPurchasable,
} from '@/lib/shop/experience-featured-bundle'
import { normalizeExperienceProductKey } from '@/lib/shop/experience-artwork-unit-price'
import { computeFeaturedBundleEffectiveUsd } from '@/lib/shop/shop-discount-flags'
import {
  ARTWORKS_PER_FREE_LAMP,
  lampVolumeDiscountPercentForAllocated,
  lampVolumeProgressPercentForAllocated,
} from '@/lib/shop/lamp-artwork-volume-discount'
import { useShopDiscountSettings } from './ShopDiscountFlagsContext'
import {
  captureFunnelEvent,
  FunnelEvents,
  getDeviceType,
  setUserProperty,
  trackExperienceV2ConfiguratorEntry,
} from '@/lib/posthog'
import {
  getExperienceABVariantFromCookie,
  setExperienceABVariantCookie,
  type ExperienceABVariant,
} from '@/lib/experience-v2-analytics'

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

const ExperienceCheckoutStickyBar = dynamic(
  () => import('./ExperienceCheckoutStickyBar').then((m) => ({ default: m.ExperienceCheckoutStickyBar })),
  { ssr: false }
)

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
  const searchParams = useSearchParams()
  const {
    setOrderSummary,
    setOrderBarProps,
    triggerPriceBump,
    setHeaderCenterContent,
    setPickerEngaged,
    pickerEngaged,
    orderDrawerOpen,
  } = useExperienceOrder()
  const { flags: discountFlags, featuredBundle: featuredBundleDiscount } = useShopDiscountSettings()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = discountFlags
  const { isAuthenticated } = useShopAuthContext()
  const artistCatalogForFilters = useExperienceArtistCatalog()

  const [productsSeason1, setProductsSeason1] = useState<ShopifyProduct[]>(() => initialSeason1)
  const [productsSeason2, setProductsSeason2] = useState<ShopifyProduct[]>(() => initialSeason2)
  const [pageInfoSeason1, setPageInfoSeason1] = useState<PageInfo>(() => initialPageInfo1)
  const [pageInfoSeason2, setPageInfoSeason2] = useState<PageInfo>(() => initialPageInfo2)
  const [activeSeason, setActiveSeason] = useState<SeasonTab>('season2')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [spotlightExpanded, setSpotlightExpanded] = useState(false)
  const [spotlightData, setSpotlightData] = useState<SpotlightData | null>(null)
  const [spotlightProductsFromApi, setSpotlightProductsFromApi] = useState<ShopifyProduct[]>([])
  const [loadingMore, setLoadingMore] = useState(false)

  const [initialCart] = useState(() => loadExperienceCart())
  const initialCartHadArtworksRef = useRef(initialCart.cartOrder.length > 0)
  const featuredBundleSeededRef = useRef(false)
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
  const [splineInView, setSplineInView] = useState(true)
  const cartCountWhenPickerOpenedRef = useRef<number>(0)
  const fullProductCacheRef = useRef<Map<string, ShopifyProduct>>(new Map())
  /** List `lamp` from SSR has no `media`; warm cache so detail carousel gets Video + sources. */
  useEffect(() => {
    const h = lamp.handle
    if (!h || fullProductCacheRef.current.has(h)) return
    let cancelled = false
    fetch(`/api/shop/products/${encodeURIComponent(h)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.product) return
        fullProductCacheRef.current.set(h, data.product as ShopifyProduct)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [lamp.handle])
  const abAssignedRef = useRef(false)
  const lastDetailPreviewIdRef = useRef<string | null>(null)
  const scrollToSplineRef = useRef(false)

  const artworkDetailProduct = useMemo(
    () => (detailProduct ? resolveArtworkDetailProduct(detailProduct, detailProductFull) : null),
    [detailProduct, detailProductFull]
  )

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

  // PostHog: shell entry, affiliate / direct params (once per mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const direct = params.get('direct') === '1'
    trackExperienceV2ConfiguratorEntry({ initialArtistSlug, directEntry: direct })
    if (initialArtistSlug) {
      trackEnhancedEvent('affiliate_landing', { affiliate_slug: initialArtistSlug, page: 'experience-v2' })
    }
    if (direct) {
      captureFunnelEvent('experience_direct_entry', {
        artist_slug: initialArtistSlug,
        device_type: getDeviceType(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: props from server for first paint only
  }, [])

  // A/B onboarding vs skip (cookie + PostHog; same cookie as legacy ExperienceClient)
  useEffect(() => {
    if (abAssignedRef.current) return
    abAssignedRef.current = true
    const existingVariant = getExperienceABVariantFromCookie()
    const isNewAssignment = !existingVariant
    const variant: ExperienceABVariant = existingVariant ?? (Math.random() < 0.5 ? 'skip' : 'onboarding')
    if (isNewAssignment) {
      setExperienceABVariantCookie(variant)
      if (isGAEnabled()) {
        trackEnhancedEvent('experience_ab_assigned', { variant, test: 'experience_onboarding' })
        try {
          window.gtag?.('set', 'user_properties', { experience_ab_variant: variant })
        } catch {
          // ignore
        }
      }
      fetch('/api/experience/ab-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant }),
        credentials: 'include',
      }).catch(() => {})
    }
    captureFunnelEvent('experience_ab_variant_known', {
      variant,
      is_new_assignment: isNewAssignment,
      device_type: getDeviceType(),
      surface: 'experience_v2_configurator',
    })
    setUserProperty('experience_ab_variant', variant)
  }, [])

  // Fetch artist spotlight: use ?artist= when present (e.g. /shop/experience-v2?artist=jack-jc-art), else default latest
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
  }, [initialArtistSlug, searchParams])

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

  const findProductByCartId = useCallback((cartId: string) => {
    const k = normalizeExperienceProductKey(cartId)
    return allProducts.find((p) => normalizeExperienceProductKey(p.id) === k)
  }, [allProducts])

  const [streetEditionByProductId, setStreetEditionByProductId] = useState<
    Record<string, StreetEditionStatesRow>
  >({})
  const [lockedArtworkPrices, setLockedArtworkPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    if (allProducts.length === 0) return
    const ids = allProducts
      .map((p) => normalizeShopifyProductId(p.id))
      .filter((x): x is string => !!x)
    if (ids.length === 0) return
    let cancelled = false
    const t = window.setTimeout(() => {
      void fetchStreetEditionStatesMap(ids)
        .then((map) => {
          if (!cancelled) setStreetEditionByProductId(map)
        })
        .catch(() => {})
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [allProducts])

  const streetLadderPrices = useMemo(() => {
    const m: Record<string, number> = {}
    for (const [id, row] of Object.entries(streetEditionByProductId)) {
      if (row.priceUsd != null && row.priceUsd > 0) m[id] = row.priceUsd
    }
    return m
  }, [streetEditionByProductId])

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

  const selectedArtworks = useMemo(
    () => cartOrder.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[],
    [cartOrder, findProductByCartId]
  )

  const experienceJourneyDetailNext = useMemo(() => {
    if (orderDrawerOpen) return null
    return resolveExperienceNextAction({
      lampQuantity,
      artworkCount: selectedArtworks.length,
      pickerEngaged,
      orderDrawerOpen,
      hasAddress: false,
      hasPaymentSelection: false,
      paymentSectionExpanded: false,
      paymentStripeUnlocked: false,
    })
  }, [orderDrawerOpen, pickerEngaged, lampQuantity, selectedArtworks.length])

  /** No prints in cart yet: show turntable + bundle on Spline only, not Street Lamp product chrome. */
  const isCollectionStart = cartOrder.length === 0

  const carouselArtworks = useMemo(() => {
    const ids = uniqueCartIdsInOrder(cartOrder)
    return ids.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[]
  }, [cartOrder, findProductByCartId])

  const productsForActiveSeason = useMemo(
    () => (activeSeason === 'season1' ? productsSeason1 : productsSeason2),
    [activeSeason, productsSeason1, productsSeason2]
  )

  /** Artist/tags list in the sheet: both seasons so filters are not split by season tab. */
  const productsForFilterPanel = useMemo(() => {
    const seen = new Set<string>()
    const out: ShopifyProduct[] = []
    for (const p of allProducts) {
      const k = normalizeShopifyProductId(p.id) ?? p.id
      if (seen.has(k)) continue
      seen.add(k)
      out.push(p)
    }
    return out
  }, [allProducts])

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

  /** Must match `product.vendor` for applyFilters — API vendorName can differ (punctuation, etc.). */
  const spotlightArtistVendorForFilter = useMemo(() => {
    if (!spotlightData) return ''
    const fromCatalog = spotlightProducts[0]?.vendor?.trim()
    if (fromCatalog) return fromCatalog
    const fromApi = spotlightProductsFromApi[0]?.vendor?.trim()
    if (fromApi) return fromApi
    return spotlightData.vendorName
  }, [spotlightData, spotlightProducts, spotlightProductsFromApi])

  const spotlightFallbackImageUrl = useMemo(() => {
    const first = spotlightProductsFromApi[0] ?? spotlightProducts[0] ?? productsSeason2[0]
    if (!first) return null
    return getShopifyImageUrl(getFirstImage(first), 1200) ?? getFirstImage(first)
  }, [spotlightProductsFromApi, spotlightProducts, productsSeason2])

  const spotlightPairProducts = useMemo(
    () => getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts),
    [spotlightData, spotlightProductsFromApi, allProducts]
  )

  /** Empty artwork cart: show the two spotlight prints on the lamp preview (no auto-add to cart). */
  useEffect(() => {
    if (cartOrder.length > 0) return
    const pair = getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts)
    if (!pair) return
    const [p1, p2] = pair
    if (!p1.availableForSale || !p2.availableForSale) return
    setLampPreviewOrder([p1.id, p2.id])
  }, [cartOrder.length, spotlightData, spotlightProductsFromApi, allProducts])

  const handleSpotlightSelect = useCallback(
    (isExpanding: boolean) => {
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
          if (prev.artists.some((a) => experienceVendorsLooselyEqual(a, vendorKey))) return prev
          return { ...prev, artists: [...prev.artists, vendorKey] }
        })
      } else {
        setFilters((prev) => ({
          ...prev,
          artists: prev.artists.filter(
            (a) =>
              !experienceVendorsLooselyEqual(a, spotlightData.vendorName) &&
              !experienceVendorsLooselyEqual(a, vendorKey)
          ),
        }))
      }
    },
    [spotlightData, spotlightArtistVendorForFilter, productsSeason1, productsSeason2, activeSeason]
  )

  const handleApplyFeaturedBundle = useCallback(() => {
    const pair = getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts)
    if (!pair) return
    const [p1, p2] = pair
    setLampQuantity(1)
    setCartOrder([p1.id, p2.id])
    setLampPreviewOrder([p1.id, p2.id])
    setActiveCarouselIndex(0)
    handleSpotlightSelect(true)
    setFilterOpen(false)
    triggerPriceBump()
  }, [spotlightData, spotlightProductsFromApi, allProducts, handleSpotlightSelect, triggerPriceBump])

  useEffect(() => {
    if (!spotlightData?.vendorName) return
    const vendorKey = spotlightArtistVendorForFilter || spotlightData.vendorName
    const inFilters = filters.artists.some(
      (a) =>
        experienceVendorsLooselyEqual(a, spotlightData.vendorName) ||
        (vendorKey ? experienceVendorsLooselyEqual(a, vendorKey) : false)
    )
    if (!inFilters) setSpotlightExpanded(false)
  }, [spotlightData?.vendorName, spotlightArtistVendorForFilter, filters.artists])

  const handleSeasonChange = useCallback((season: SeasonTab) => {
    setActiveSeason(season)
  }, [])

  const hasMoreSeason1 = pageInfoSeason1.hasNextPage
  const hasMoreSeason2 = pageInfoSeason2.hasNextPage
  const hasMore = activeSeason === 'season1' ? hasMoreSeason1 : hasMoreSeason2

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, lampPreviewOrder)
  }, [cartOrder, lampQuantity, lampPreviewOrder])

  useEffect(() => {
    if (isCollectionStart) setGalleryImages([])
  }, [isCollectionStart])

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

  // lampPreviewOrder[0] → image1 (Side A panel), [1] → image2 (Side B)
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
  const artworkCount = selectedArtworks.length

  const lampPrices = useMemo(() => {
    const prices: number[] = []
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCount, end) - start)
      const discountPct = lampVolumeDiscountPercentForAllocated(allocated, lampVolumeDiscountEnabled)
      prices.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    }
    return prices
  }, [lampQuantity, artworkCount, lampPrice, lampVolumeDiscountEnabled])

  const lampTotal = lampPrices.reduce((a, b) => a + b, 0)
  const lampSavings = lampQuantity > 0 ? lampQuantity * lampPrice - lampTotal : 0
  const lampProgress = useMemo(() => {
    const progress: number[] = []
    for (let k = 1; k <= lampQuantity; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(artworkCount, end) - start)
      progress.push(lampVolumeProgressPercentForAllocated(allocated, lampVolumeDiscountEnabled))
    }
    return progress
  }, [lampQuantity, artworkCount, lampVolumeDiscountEnabled])
  const volumeDiscountBarLabel = lampVolumeDiscountEnabled
    ? 'Volume discount: 7.5% off the Street Lamp for each artwork you add'
    : null
  const artworkPriceMaps = useMemo(
    () => ({
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: streetLadderPrices,
      seasonBandsFallback: activeSeason === 'season2' ? 2 : 1,
    }),
    [lockedArtworkPrices, streetLadderPrices, activeSeason]
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
  const orderTotal = bundlePricing.orderTotalUsd
  const featuredBundleCheckoutPayload = bundlePricing.featuredBundleCheckout

  const featuredBundleFilterOffer = useMemo((): FeaturedBundleFilterOffer | null => {
    if (!featuredBundleDiscount.enabled || !spotlightData || !spotlightPairProducts) return null
    const [p1, p2] = spotlightPairProducts
    const earlyAccessTokenInUrl = Boolean(searchParams.get('token')?.trim())
    const forceUnlistedUrl = ['1', 'true', 'yes'].includes((searchParams.get('unlisted') ?? '').toLowerCase())
    const bundlePrintsPurchasable = isFeaturedBundleSpotlightPrintsPurchasable(p1, p2, {
      spotlightUnlisted: Boolean(spotlightData.unlisted || forceUnlistedUrl),
      earlyAccessTokenInUrl,
    })
    const lampPricesNatural: number[] = []
    for (let k = 1; k <= 1; k++) {
      const start = (k - 1) * ARTWORKS_PER_FREE_LAMP
      const end = k * ARTWORKS_PER_FREE_LAMP
      const allocated = Math.max(0, Math.min(2, end) - start)
      const discountPct = lampVolumeDiscountPercentForAllocated(allocated, lampVolumeDiscountEnabled)
      lampPricesNatural.push(lampPrice * Math.max(0, 1 - discountPct / 100))
    }
    const compareAt = computeFeaturedBundleRegularSubtotalUsd({
      lampNaturalLines: lampPricesNatural,
      artProducts: spotlightPairProducts,
      priceMaps: artworkPriceMaps,
    })
    const bundleUsd = computeFeaturedBundleEffectiveUsd(compareAt, featuredBundleDiscount)
    const bundleInCart = isFeaturedArtistBundleEligible({
      lampQuantity,
      cartOrder,
      spotlightProductIds: spotlightData.productIds,
      resolveProduct: (gid) => allProducts.find((p) => p.id === gid),
    })
    return {
      vendorName: spotlightData.vendorName,
      bundleUsd,
      compareAtUsd: compareAt,
      onApply: handleApplyFeaturedBundle,
      disabled: bundleInCart || !bundlePrintsPurchasable,
    }
  }, [
    featuredBundleDiscount,
    spotlightData,
    spotlightPairProducts,
    lampPrice,
    artworkPriceMaps,
    lampQuantity,
    cartOrder,
    allProducts,
    handleApplyFeaturedBundle,
    lampVolumeDiscountEnabled,
    searchParams,
  ])
  const orderItemCount = selectedArtworks.length + lampQuantity

  useEffect(() => {
    setOrderSummary({ total: orderTotal, itemCount: orderItemCount })
  }, [orderTotal, orderItemCount, setOrderSummary, artworkPriceMaps])

  useEffect(() => {
    if (!lastAddedProductId) return
    const t = setTimeout(() => setLastAddedProductId(null), 1200)
    return () => clearTimeout(t)
  }, [lastAddedProductId])

  const handleLampQuantityChange = useCallback((n: number) => {
    setLampQuantity(Math.max(0, n))
  }, [])

  const filterPanelLampOffer = useMemo((): FilterPanelLampOffer => ({
    product: lamp,
    quantity: lampQuantity,
    onAdd: () => handleLampQuantityChange(1),
  }), [lamp, lampQuantity, handleLampQuantityChange])

  const getSideToShowForProduct = useCallback((order: string[], productId: string): 'A' | 'B' => {
    const productIndex = order.indexOf(productId)
    if (productIndex === 0) return 'B'
    if (productIndex === 1) return 'A'
    return 'A'
  }, [])

  /** Remove one cart line (OrderBar quantity −1). Indices are `cartOrder` positions. */
  const handleRemoveCartOrderItemAtIndex = useCallback((cartIndex: number) => {
    setCartOrder((prev) => {
      if (cartIndex < 0 || cartIndex >= prev.length) return prev
      const removedId = prev[cartIndex]!
      const filtered = prev.filter((_, i) => i !== cartIndex)

      if (filtered.length === 0) {
        setResetTrigger((t) => t + 1)
        setRotateToSide(null)
        setActiveCarouselIndex(-1)
        setLampPreviewOrder([])
        return filtered
      }

      setLampPreviewOrder((prevLamp) => {
        const next = prevLamp.filter((id) => id !== removedId)
        if (next.length === 0) {
          setRotateToSide(null)
          setActiveCarouselIndex((c) => clampCarouselIndex(c, filtered))
          return []
        }
        if (next.length < prevLamp.length) {
          const remainingId = next[0]
          const sideToShow = getSideToShowForProduct(next, remainingId)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          setActiveCarouselIndex(carouselSlotIndexForProductId(filtered, remainingId))
        } else {
          setActiveCarouselIndex((c) => clampCarouselIndex(c, filtered))
        }
        return next
      })

      return filtered
    })
  }, [getSideToShowForProduct])

  /** Carousel trash: remove every line for that product (deduped tile). */
  const handleRemoveCarouselSlot = useCallback(
    (carouselIndex: number) => {
      const product = carouselArtworks[carouselIndex]
      if (!product) return
      const removedId = product.id
      setCartOrder((prev) => {
        const filtered = prev.filter((id) => id !== removedId)
        if (filtered.length === 0) {
          setResetTrigger((t) => t + 1)
          setRotateToSide(null)
          setActiveCarouselIndex(-1)
          setLampPreviewOrder([])
          return filtered
        }
        setLampPreviewOrder((prevLamp) => {
          const next = prevLamp.filter((id) => id !== removedId)
          if (next.length === 0) {
            setRotateToSide(null)
            setActiveCarouselIndex((c) => clampCarouselIndex(c, filtered))
            return []
          }
          if (next.length < prevLamp.length) {
            const remainingId = next[0]
            const sideToShow = getSideToShowForProduct(next, remainingId)
            setRotateTrigger((t) => t + 1)
            setRotateToSide(sideToShow)
            setActiveCarouselIndex(carouselSlotIndexForProductId(filtered, remainingId))
          } else {
            setActiveCarouselIndex((c) => clampCarouselIndex(c, filtered))
          }
          return next
        })
        return filtered
      })
    },
    [carouselArtworks, getSideToShowForProduct]
  )

  const handleAdjustArtworkQuantity = useCallback(
    (runStartIndex: number, delta: 1 | -1) => {
      if (delta === -1) {
        const prev = cartOrder
        const id = prev[runStartIndex]
        if (!id) return
        let end = runStartIndex
        while (end < prev.length && prev[end] === id) end++
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
      lockedArtworkPrices,
      streetLadderPrices,
      streetPricingSeasonFallback: activeSeason === 'season2' ? 2 : 1,
      featuredBundleCheckout: featuredArtistBundlePricingActive ? featuredBundleCheckoutPayload : null,
      bundlePricedArtworkIndices: featuredArtistBundlePricingActive
        ? bundlePricing.bundlePricedArtworkIndices
        : undefined,
    })
  }, [
    lamp,
    selectedArtworks,
    lampQuantity,
    lampPrice,
    lampTotal,
    artworkCount,
    lampSavings,
    lockedArtworkPrices,
    streetLadderPrices,
    activeSeason,
    featuredArtistBundlePricingActive,
    featuredBundleCheckoutPayload,
    bundlePricing.bundlePricedArtworkIndices,
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
  }, [detailProduct])

  // PostHog: artwork detail sheet — view_item + preview (once per opened product)
  useEffect(() => {
    if (!detailProduct) {
      lastDetailPreviewIdRef.current = null
      return
    }
    if (detailProductLoading) return
    if (lastDetailPreviewIdRef.current === detailProduct.id) return
    lastDetailPreviewIdRef.current = detailProduct.id
    const p = resolveArtworkDetailProduct(detailProduct, detailProductFull) ?? detailProduct
    const variant = p.variants?.edges?.[0]?.node
    trackViewItem({ ...storefrontProductToItem(p, variant, 1), item_list_name: 'experience-v2' })
    captureFunnelEvent(FunnelEvents.experience_artwork_previewed, {
      product_id: p.id,
      handle: p.handle,
      device_type: getDeviceType(),
    })
  }, [detailProduct, detailProductFull, detailProductLoading])

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
          setActiveCarouselIndex(carouselSlotIndexForProductId(cartOrder, remainingId))
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
      setActiveCarouselIndex(carouselSlotIndexForProductId(cartOrder, product.id))
      return newOrder
    })
  }, [getSideToShowForProduct, cartOrder])

  const handleToggleSelect = useCallback(
    (product: ShopifyProduct) => {
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
                  setActiveCarouselIndex(carouselSlotIndexForProductId(filtered, next[0]))
                }
              } else {
                setActiveCarouselIndex((c) => clampCarouselIndex(c, filtered))
              }
              return next
            })
          }
          return filtered
        }

        const nextCart = [...prev, product.id]
        setLastAddedProductId(product.id)
        scrollToSplineRef.current = true
        setPreviewSlideIndex(0)
        setDisplayedProduct(product)
        const variant = product.variants?.edges?.[0]?.node
        trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v2' })
        setLampPreviewOrder((prevLamp) => {
          const idx = prevLamp.indexOf(product.id)
          if (idx >= 0) {
            const sideToShow = getSideToShowForProduct(prevLamp, product.id)
            setRotateTrigger((t) => t + 1)
            setRotateToSide(sideToShow)
            setActiveCarouselIndex(carouselSlotIndexForProductId(nextCart, product.id))
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
          setActiveCarouselIndex(carouselSlotIndexForProductId(nextCart, product.id))
          return newOrder
        })
        return nextCart
      })
    },
    [getSideToShowForProduct]
  )

  const handleTapCarouselItem = useCallback((index: number) => {
    const product = carouselArtworks[index]
    if (!product) return
    captureFunnelEvent(FunnelEvents.experience_carousel_navigated, {
      index,
      product_id: product.id,
      is_lamp_slot: product.id === lamp.id,
      device_type: getDeviceType(),
    })
    scrollToSplineRef.current = true
    setPreviewSlideIndex(0)
    setActiveCarouselIndex(index)
    if (product.id === lamp.id) {
      setDisplayedProduct(lamp)
      return
    }
    // Toggle lamp preview: off-lamp → assign to a side; on-lamp → remove so that side shows base Spline mesh
    handleLampSelect(product)
  }, [carouselArtworks, handleLampSelect, lamp])

  const handleFrontSideSettled = useCallback((side: 'A' | 'B') => {
    currentFrontSideRef.current = side
  }, [])

  const experienceReelRef = useRef<HTMLDivElement | null>(null)
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
    setPickerEngaged(true)
    cartCountWhenPickerOpenedRef.current = cartOrder.length
    setPickerHasBeenOpened(true)
    captureFunnelEvent(FunnelEvents.experience_picker_opened, {
      cart_count: cartOrder.length,
      device_type: getDeviceType(),
    })
    // Full grid on open: spotlight artist filter applies only while the spotlight accordion is expanded
    setSpotlightExpanded(false)
    if (spotlightData?.vendorName) {
      const vendorKey = spotlightArtistVendorForFilter || spotlightData.vendorName
      setFilters((prev) => ({
        ...prev,
        artists: prev.artists.filter(
          (a) =>
            !experienceVendorsLooselyEqual(a, spotlightData.vendorName) &&
            !experienceVendorsLooselyEqual(a, vendorKey)
        ),
      }))
    }
    setIsPickerOpen(true)
  }, [cartOrder.length, setPickerEngaged, spotlightData?.vendorName, spotlightArtistVendorForFilter])

  const handleClosePicker = useCallback(() => {
    captureFunnelEvent(FunnelEvents.experience_picker_closed, {
      cart_count: cartOrder.length,
      added_since_open: cartOrder.length > cartCountWhenPickerOpenedRef.current,
      device_type: getDeviceType(),
    })
    if (cartOrder.length > cartCountWhenPickerOpenedRef.current) {
      triggerPriceBump()
    }
    setIsPickerOpen(false)
  }, [cartOrder.length, triggerPriceBump])

  const handleViewDetail = useCallback((product: ShopifyProduct) => {
    setDetailProduct(product)
    // Reel: 0 = Spline, 1 = details accordion (ArtworkInfoBar detailSlide when editionLeadBeforeSpline is false)
    setPreviewSlideIndex(1)
  }, [])

  const isInCart = useCallback((productId: string) => cartOrder.includes(productId), [cartOrder])
  const { theme } = useExperienceTheme()

  // Sync displayedIndex and displayedProduct when user taps carousel item (last selected = displayed).
  // Collection start: no reel accordion / lamp product — turntable + featured bundle only.
  const lastClickedProductId = activeCarouselIndex >= 0 ? carouselArtworks[activeCarouselIndex]?.id ?? null : null
  const lastClickedProduct = activeCarouselIndex >= 0 ? carouselArtworks[activeCarouselIndex] ?? null : null
  useEffect(() => {
    if (isCollectionStart) {
      setDisplayedProduct(null)
      return
    }
    if (lampPreviewOrder.length === 0) {
      setDisplayedProduct(lamp)
      return
    }
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
  }, [
    isCollectionStart,
    lampPreviewOrder.length,
    lamp,
    lastClickedProductId,
    lastClickedProduct,
    sideAProduct,
    sideBProduct,
    lamp.id,
  ])

  const isDesktop = !isMobile
  useEffect(() => {
    if (!isDesktop) {
      setHeaderCenterContent(null)
      return () => setHeaderCenterContent(null)
    }
    if (isCollectionStart) {
      setHeaderCenterContent(
        <div
          className={cn(
            'text-center min-w-0 max-w-[200px] md:max-w-[320px] mx-auto pointer-events-none',
            theme === 'light' ? 'text-neutral-900' : 'text-white'
          )}
        >
          <p className={cn('text-sm font-semibold truncate', theme === 'light' ? 'text-neutral-900' : 'text-white')}>
            Start your Collection
          </p>
        </div>
      )
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
  }, [isDesktop, isCollectionStart, displayedProduct, lamp.id, theme, handleViewDetail, setHeaderCenterContent])

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

  const displayedStreetEditionRow = useMemo(() => {
    if (!displayedProduct || displayedProduct.id === lamp.id) return null
    const k = normalizeShopifyProductId(displayedProduct.id)
    if (!k) return null
    return streetEditionByProductId[k] ?? null
  }, [displayedProduct, lamp.id, streetEditionByProductId])

  const displayedEarlyAccess = useMemo(
    () => experienceEarlyAccessForProduct(displayedProduct, lamp.id, spotlightData),
    [displayedProduct, lamp.id, spotlightData]
  )

  const detailStreetEditionRow = useMemo(() => {
    if (!detailProduct || detailProduct.id === lamp.id) return null
    const k = normalizeShopifyProductId(detailProduct.id)
    if (!k) return null
    return streetEditionByProductId[k] ?? null
  }, [detailProduct, lamp.id, streetEditionByProductId])

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
        collectionArtworkCount={selectedArtworks.length}
        pickerOpen={isPickerOpen}
        topBarContent={({ onRotate, isDesktop }) => (
          <ArtworkInfoBar
            sideAProduct={sideAProduct}
            sideBProduct={sideBProduct}
            lampProduct={isCollectionStart ? null : lampPreviewOrder.length === 0 ? lamp : null}
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
            suppressReelSync={isCollectionStart}
            heroTitleOverride={isCollectionStart ? 'Start your Collection' : null}
          />
        )}
        galleryImages={galleryImages}
        displayedProduct={displayedProduct}
        {...spotlightOverridesForProduct(displayedProduct ?? null, lamp.id, spotlightData)}
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
        experienceReelRef={experienceReelRef}
        streetEditionRow={displayedStreetEditionRow}
        displayedProductEarlyAccess={displayedEarlyAccess}
        featuredBundleOffer={featuredBundleFilterOffer}
        bundlePreviewLamp={lamp}
        bundlePreviewArtworks={spotlightPairProducts ?? null}
      />

      {lampVolumeDiscountEnabled && lampQuantity > 0 && artworkCount > 0 && volumeDiscountBarLabel && (
        <div
          className={cn(
            'w-full shrink-0 px-4 py-2.5 border-b',
            theme === 'light'
              ? 'border-emerald-200/80 bg-emerald-50/95'
              : 'border-emerald-500/30 bg-emerald-950/45'
          )}
        >
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-medium min-w-0',
                  theme === 'light' ? 'text-emerald-900' : 'text-emerald-100/95'
                )}
              >
                <TicketPercent
                  className={cn('w-3.5 h-3.5 shrink-0', theme === 'light' ? 'text-emerald-700' : 'text-emerald-400')}
                  aria-hidden
                />
                <span className="leading-snug">{volumeDiscountBarLabel}</span>
              </span>
              {lampSavings > 0 && (
                <span
                  className={cn(
                    'text-[11px] font-semibold tabular-nums shrink-0',
                    theme === 'light' ? 'text-emerald-800' : 'text-emerald-200'
                  )}
                >
                  -${formatPriceCompact(lampSavings)}
                </span>
              )}
            </div>
            <div
              className={cn(
                'relative h-1.5 rounded-full overflow-hidden flex',
                theme === 'light' ? 'bg-emerald-200/80' : 'bg-neutral-800/90'
              )}
            >
              {Array.from({ length: lampQuantity }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 min-w-0 h-full overflow-hidden relative border-l first:border-l-0',
                    theme === 'light' ? 'border-emerald-300/60' : 'border-neutral-700/80'
                  )}
                >
                  <motion.div
                    className={cn(
                      'absolute inset-y-0 left-0 bg-gradient-to-r',
                      theme === 'light' ? 'from-emerald-600 to-teal-500' : 'from-emerald-500 to-teal-400'
                    )}
                    initial={false}
                    animate={{ width: `${lampProgress[i] ?? 0}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ArtworkCarouselBar
        splineInView={splineInView}
        experienceReelRef={experienceReelRef}
        selectedArtworks={carouselArtworks}
        reserveCheckoutBar
        activeIndex={activeCarouselIndex}
        lampPreviewOrder={lampPreviewOrder}
        onTapItem={handleTapCarouselItem}
        onRemoveItem={handleRemoveCarouselSlot}
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
        productsForFilterPanel={productsForFilterPanel}
        cartOrder={cartOrder}
        spotlightBannerExpanded={spotlightExpanded}
        streetEditionByProductId={streetEditionByProductId}
        featuredBundleOffer={featuredBundleFilterOffer}
        filterPanelLamp={filterPanelLampOffer}
        artistCatalogForFilters={artistCatalogForFilters}
        pickerLamp={lamp}
        lampQuantity={lampQuantity}
        lampPriceUsd={lampPrice}
        onPickerAddLamp={() => handleLampQuantityChange(1)}
        lampPickerDetailOpen={detailProduct?.id === lamp.id}
        onOpenLampPickerDetail={() => setDetailProduct(lamp)}
        onCloseLampPickerDetail={() => {
          setDetailProduct((p) => (p?.id === lamp.id ? null : p))
        }}
      />
      )}

      {detailProduct && artworkDetailProduct && (
        <ArtworkDetail
          product={artworkDetailProduct}
          {...spotlightOverridesForProduct(detailProduct, lamp.id, spotlightData)}
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
          hideScarcityBar={detailProduct.id === lamp.id}
          addToOrderLabel={detailProduct.id === lamp.id ? 'Add lamp to cart' : 'Add to cart'}
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
          streetEdition={detailStreetEditionRow}
          isEarlyAccess={experienceEarlyAccessForProduct(detailProduct, lamp.id, spotlightData)}
          isNewDrop={
            detailProduct.id !== lamp.id &&
            !!spotlightData &&
            productMatchesSpotlight(detailProduct, spotlightData) &&
            !spotlightData.unlisted
          }
          journeyCtaPulse={
            detailProduct.id === lamp.id &&
            lampQuantity === 0 &&
            experienceJourneyDetailNext === 'add_lamp'
          }
        />
      )}

      <ExperienceCheckoutStickyBar
        lamp={lamp}
        lampQuantity={lampQuantity}
        selectedArtworks={selectedArtworks}
        orderSubtotal={orderTotal}
        stripMode="collection"
        onOpenPicker={handleOpenPicker}
      />

      <OrderBar
        lamp={lamp}
        selectedArtworks={selectedArtworks}
        lampQuantity={lampQuantity}
        onLampQuantityChange={handleLampQuantityChange}
        onAdjustArtworkQuantity={handleAdjustArtworkQuantity}
        isGift={false}
        lockedArtworkPrices={lockedArtworkPrices}
        streetLadderPrices={streetLadderPrices}
        streetPricingSeasonFallback={activeSeason === 'season2' ? 2 : 1}
        featuredBundleCheckout={featuredArtistBundlePricingActive ? featuredBundleCheckoutPayload : null}
        bundlePricedArtworkIndices={
          featuredArtistBundlePricingActive ? bundlePricing.bundlePricedArtworkIndices : undefined
        }
      />
    </div>
  )
}
