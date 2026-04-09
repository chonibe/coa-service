'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceOrder } from '../../experience-v2/ExperienceOrderContext'
import { trackAddToCart } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import {
  applyFilters,
  DEFAULT_FILTERS,
  type FeaturedBundleFilterOffer,
  type FilterPanelLampOffer,
  type FilterState,
} from '../../experience-v2/components/FilterPanel'
import type { SpotlightData } from '../../experience-v2/components/ArtistSpotlightBanner'
import { SplineFullScreen } from './SplineFullScreen'
import { ArtworkInfoBar } from './ArtworkInfoBar'
const ArtworkDetail = dynamic(
  () => import('../../experience-v2/components/ArtworkDetail').then((m) => ({ default: m.ArtworkDetail })),
  { ssr: false }
)

const ArtworkPickerSheet = dynamic(
  () => import('./ArtworkPickerSheet').then((m) => ({ default: m.ArtworkPickerSheet })),
  { ssr: false }
)
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'
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
import { normalizeExperienceProductKey } from '@/lib/shop/experience-artwork-unit-price'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { resolveArtworkDetailProduct } from '@/lib/shop/resolve-artwork-detail-product'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { fetchStreetEditionStatesMap } from '@/lib/shop/fetch-street-edition-states-client'
import {
  isReelGalleryStrictTailExtension,
  reelGalleryItemsSignature,
  type ExperienceReelGalleryItem,
} from '@/lib/shop/experience-reel-gallery'
import { Heart } from 'lucide-react'
import { EXPERIENCE_WATCHLIST_UPDATED } from '@/lib/shop/experience-watchlist-events'
import { loadExperienceCart, saveExperienceCart } from '@/lib/shop/experience-cart-persistence'
import { dispatchEarlyAccessCartRefresh } from '@/lib/shop/early-access-cart'
import { useExperienceArtistCatalog } from '@/lib/shop/use-experience-artist-catalog'
import { computeExperienceFeaturedBundlePricing } from '@/lib/shop/experience-bundle-order-pricing'
import {
  computeFeaturedBundleRegularSubtotalUsd,
  getSpotlightPairProducts,
  isFeaturedArtistBundleEligible,
  isFeaturedBundleSpotlightPrintsPurchasable,
} from '@/lib/shop/experience-featured-bundle'
import { computeFeaturedBundleEffectiveUsd } from '@/lib/shop/shop-discount-flags'
import {
  ARTWORKS_PER_FREE_LAMP,
  lampVolumeDiscountPercentForAllocated,
} from '@/lib/shop/lamp-artwork-volume-discount'
import { useShopDiscountSettings } from '../../experience-v2/components/ShopDiscountFlagsContext'

type WatchlistApiRow = {
  id: string
  shopify_product_id: string
  stage_at_save: string
  product_title: string | null
  product_handle: string | null
  artist_name: string | null
  created_at: string
}

function productGidFromWatchlistRow(row: WatchlistApiRow): string {
  const raw = row.shopify_product_id
  if (raw.includes('gid://')) return raw
  const n = normalizeShopifyProductId(raw)
  return n ? `gid://shopify/Product/${n}` : raw
}

function stubProductFromWatchlistRow(row: WatchlistApiRow): ShopifyProduct {
  const id = productGidFromWatchlistRow(row)
  const z = { amount: '0', currencyCode: 'USD' }
  return {
    id,
    handle: row.product_handle || 'artwork',
    title: row.product_title || 'Artwork',
    description: '',
    descriptionHtml: '',
    vendor: row.artist_name || '',
    productType: '',
    tags: [],
    availableForSale: true,
    priceRange: { minVariantPrice: z, maxVariantPrice: z },
    compareAtPriceRange: { minVariantPrice: z, maxVariantPrice: z },
    featuredImage: null,
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
    metafields: null,
  }
}

function resolveWatchlistProducts(rows: WatchlistApiRow[], catalog: ShopifyProduct[]): ShopifyProduct[] {
  return rows.map((row) => {
    const n = normalizeShopifyProductId(row.shopify_product_id)
    const hit = catalog.find((p) => normalizeShopifyProductId(p.id) === n)
    return hit ?? stubProductFromWatchlistRow(row)
  })
}

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

type SeasonTab = 'season1' | 'season2'

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

const OrderBar = dynamic(
  () => import('../../experience-v2/components/OrderBar').then((m) => m.OrderBar),
  { ssr: false }
)

const ExperienceCheckoutStickyBar = dynamic(
  () =>
    import('../../experience-v2/components/ExperienceCheckoutStickyBar').then((m) => ({
      default: m.ExperienceCheckoutStickyBar,
    })),
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
    setHeaderTrailingContent,
  } = useExperienceOrder()
  const { flags: discountFlags, featuredBundle: featuredBundleDiscount } = useShopDiscountSettings()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = discountFlags

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
  const [galleryImages, setGalleryImages] = useState<ExperienceReelGalleryItem[]>([])
  const [displayedProduct, setDisplayedProduct] = useState<ShopifyProduct | null>(null)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)
  /** Bumped only for explicit reel alignment (thumbnails, jump to spline). Not when the user scrolls the vertical gallery. */
  const [reelAlignNonce, setReelAlignNonce] = useState(0)
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
  const bumpReelAlign = useCallback(() => {
    setReelAlignNonce((n) => n + 1)
  }, [])
  /** Last gallery content signature from ArtworkInfoBar — avoid reel scrollIntoView on cache-only refreshes. */
  const lastGallerySigRef = useRef<string | null>(null)
  const previewSlideIndexRef = useRef(previewSlideIndex)
  previewSlideIndexRef.current = previewSlideIndex
  const onReelSlideFromScroll = useCallback((index: number) => {
    setPreviewSlideIndex(index)
  }, [])

  const artworkDetailProduct = useMemo(
    () => (detailProduct ? resolveArtworkDetailProduct(detailProduct, detailProductFull) : null),
    [detailProduct, detailProductFull]
  )

  const allProducts = useMemo(
    () => [...productsSeason1, ...productsSeason2],
    [productsSeason1, productsSeason2]
  )

  const findProductByCartId = useCallback(
    (cartId: string) => {
      const k = normalizeExperienceProductKey(cartId)
      return allProducts.find((p) => normalizeExperienceProductKey(p.id) === k)
    },
    [allProducts]
  )

  const { isAuthenticated, loading: shopAuthLoading } = useShopAuthContext()
  const artistCatalogForFilters = useExperienceArtistCatalog()
  const [watchlistRows, setWatchlistRows] = useState<WatchlistApiRow[]>([])
  const [carouselStripMode, setCarouselStripMode] = useState<'collection' | 'watchlist'>('collection')

  const refreshWatchlist = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const r = await fetch('/api/shop/watchlist', { credentials: 'include' })
      const j = (await r.json()) as { items?: WatchlistApiRow[] }
      if (r.ok && Array.isArray(j.items)) setWatchlistRows(j.items)
    } catch {
      // ignore
    }
  }, [isAuthenticated])

  const watchlistDisplayProducts = useMemo(
    () => resolveWatchlistProducts(watchlistRows, allProducts),
    [watchlistRows, allProducts]
  )

  useEffect(() => {
    if (!isAuthenticated) {
      setWatchlistRows([])
      setCarouselStripMode('collection')
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || shopAuthLoading) return
    void refreshWatchlist()
  }, [isAuthenticated, shopAuthLoading, refreshWatchlist])

  useEffect(() => {
    if (carouselStripMode !== 'watchlist' || !isAuthenticated) return
    void refreshWatchlist()
  }, [carouselStripMode, isAuthenticated, refreshWatchlist])

  useEffect(() => {
    const onUpdated = () => {
      if (isAuthenticated) void refreshWatchlist()
    }
    window.addEventListener(EXPERIENCE_WATCHLIST_UPDATED, onUpdated)
    return () => window.removeEventListener(EXPERIENCE_WATCHLIST_UPDATED, onUpdated)
  }, [isAuthenticated, refreshWatchlist])

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

  const productsForActiveSeason = useMemo(
    () => (activeSeason === 'season1' ? productsSeason1 : productsSeason2),
    [activeSeason, productsSeason1, productsSeason2]
  )

  /** Artist list in picker filters: both seasons (deduped) so tabs do not hide artists. */
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
  const selectedArtworks = useMemo(
    () => cartOrder.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[],
    [cartOrder, findProductByCartId]
  )

  const carouselArtworks = useMemo(() => {
    const ids = uniqueCartIdsInOrder(cartOrder)
    return ids.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[]
  }, [cartOrder, findProductByCartId])

  const activeStripProducts = useMemo(
    () => (carouselStripMode === 'watchlist' ? watchlistDisplayProducts : carouselArtworks),
    [carouselStripMode, watchlistDisplayProducts, carouselArtworks]
  )

  const resolveProductById = useCallback(
    (id: string | null | undefined): ShopifyProduct | null => {
      if (!id) return null
      const k = normalizeExperienceProductKey(id)
      const fromCatalog = allProducts.find((p) => normalizeExperienceProductKey(p.id) === k)
      if (fromCatalog) return fromCatalog
      return watchlistDisplayProducts.find((p) => normalizeExperienceProductKey(p.id) === k) ?? null
    },
    [allProducts, watchlistDisplayProducts]
  )

  useEffect(() => {
    setActiveCarouselIndex((idx) => {
      if (activeStripProducts.length === 0) return -1
      if (idx < 0) return idx
      return Math.min(idx, activeStripProducts.length - 1)
    })
  }, [activeStripProducts.length, carouselStripMode])

  useEffect(() => {
    setProductsSeason1(initialSeason1)
    setProductsSeason2((prev) => {
      const base = initialSeason2
      if (spotlightProductsFromApi.length === 0) return base
      const baseIds = new Set(base.map((p) => p.id))
      const toMerge = spotlightProductsFromApi.filter((p) => !baseIds.has(p.id))
      if (toMerge.length === 0) return base
      return [...base, ...toMerge]
    })
    setPageInfoSeason1(initialPageInfo1)
    setPageInfoSeason2(initialPageInfo2)
  }, [initialSeason1, initialSeason2, initialPageInfo1, initialPageInfo2, spotlightProductsFromApi])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fetch early access coupon when visiting via early access link (?artist=...&token=...)
  useEffect(() => {
    if (!initialArtistSlug) return
    const token = searchParams.get('token')?.trim()
    if (!token) return
    let cancelled = false
    fetch(`/api/shop/early-access-coupon?artist=${encodeURIComponent(initialArtistSlug)}&token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (cancelled) return
        if (!r.ok) console.warn('Early access token invalid or expired')
        else dispatchEarlyAccessCartRefresh()
      })
      .catch((err) => {
        if (!cancelled) console.error('Error fetching early access coupon:', err)
      })
    return () => { cancelled = true }
  }, [initialArtistSlug, searchParams])

  const forceUnlisted = ['1', 'true', 'yes'].includes((searchParams.get('unlisted') ?? '').toLowerCase())

  const fetchAndApplySpotlight = useCallback(() => {
    let cancelled = false
    let url = initialArtistSlug
      ? `/api/shop/artist-spotlight?artist=${encodeURIComponent(initialArtistSlug)}`
      : '/api/shop/artist-spotlight'
    if (forceUnlisted && initialArtistSlug) url += '&unlisted=1'
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
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
        if (!cancelled) {
          setSpotlightData(null)
          setSpotlightProductsFromApi([])
        }
      })
    return () => { cancelled = true }
  }, [initialArtistSlug, forceUnlisted])

  // Fetch on load (same as experience-v2) so artist bio / Spline overrides / carousel spotlight data exist
  // before the user opens the picker — deferred fetch left bio empty until selector mounted.
  useEffect(() => {
    return fetchAndApplySpotlight()
  }, [fetchAndApplySpotlight])

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
    if (fromCatalog) return fromCatalog
    const fromApi = spotlightProductsFromApi[0]?.vendor?.trim()
    if (fromApi) return fromApi
    return spotlightData.vendorName
  }, [spotlightData, spotlightProducts, spotlightProductsFromApi])

  const spotlightPairProducts = useMemo(
    () => getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts),
    [spotlightData, spotlightProductsFromApi, allProducts]
  )

  const bundlePreviewStripProducts = useMemo(() => {
    if (!spotlightPairProducts) return null
    const seen = new Set<string>()
    const out: ShopifyProduct[] = []
    const add = (p: ShopifyProduct) => {
      if (seen.has(p.id)) return
      seen.add(p.id)
      out.push(p)
    }
    add(lamp)
    add(spotlightPairProducts[0])
    add(spotlightPairProducts[1])
    for (const p of spotlightProducts) {
      add(p)
    }
    return out
  }, [lamp, spotlightPairProducts, spotlightProducts])

  /** Empty artwork cart: show the two spotlight prints on the lamp preview (no auto-add to cart). */
  useEffect(() => {
    if (cartOrder.length > 0) return
    const pair = getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts)
    if (!pair) return
    const [p1, p2] = pair
    if (!p1.availableForSale || !p2.availableForSale) return
    setLampPreviewOrder([p1.id, p2.id])
  }, [cartOrder.length, spotlightData, spotlightProductsFromApi, allProducts])

  const spotlightFallbackImageUrl = useMemo(() => {
    const first = spotlightProductsFromApi[0] ?? spotlightProducts[0] ?? productsSeason2[0]
    if (!first) return null
    return getShopifyImageUrl(getFirstImage(first), 1200) ?? getFirstImage(first)
  }, [spotlightProductsFromApi, spotlightProducts, productsSeason2])

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

  // lampPreviewOrder[0] → image1 (Spline / Side A panel), [1] → image2 (Side B)
  const sideAProduct = resolveProductById(lampPreviewOrder[0])
  const sideBProduct = resolveProductById(lampPreviewOrder[1])

  const image1 = sideAProduct ? (getShopifyImageUrl(getFirstImage(sideAProduct), 1200) ?? getFirstImage(sideAProduct)) : null
  const image2 = sideBProduct ? (getShopifyImageUrl(getFirstImage(sideBProduct), 1200) ?? getFirstImage(sideBProduct)) : null

  useEffect(() => {
    if (!sideAProduct || !image1) return
    const currentProductId = sideAProduct.id
    const url = image1
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 500 })
        : (setTimeout(cb, 500) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => {
      fetch(`/api/spline-artwork?productId=${encodeURIComponent(currentProductId)}&url=${encodeURIComponent(url)}`).catch(
        () => {}
      )
    })
    return () => cancel(id)
  }, [sideAProduct?.id, image1])

  useEffect(() => {
    if (!sideBProduct || !image2) return
    const currentProductId = sideBProduct.id
    const url = image2
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 500 })
        : (setTimeout(cb, 500) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => {
      fetch(`/api/spline-artwork?productId=${encodeURIComponent(currentProductId)}&url=${encodeURIComponent(url)}`).catch(
        () => {}
      )
    })
    return () => cancel(id)
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

  const handleLampSelect = useCallback(
    (product: ShopifyProduct, explicitStripIndex?: number) => {
      const resolveCarouselSlot = (productId: string, explicit?: number) => {
        if (explicit !== undefined) return explicit
        const stripIdx = activeStripProducts.findIndex((p) => p.id === productId)
        if (stripIdx >= 0) return stripIdx
        return carouselSlotIndexForProductId(cartOrder, productId)
      }

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
            setActiveCarouselIndex(resolveCarouselSlot(remainingId))
          }
          return newOrder
        }
        const newOrder =
          prev.length >= 2
            ? currentFrontSideRef.current === 'A'
              ? [product.id, prev[1]!]
              : [prev[0]!, product.id]
            : [...prev, product.id]
        const sideToShow = getSideToShowForProduct(newOrder, product.id)
        setRotateTrigger((t) => t + 1)
        setRotateToSide(sideToShow)
        setActiveCarouselIndex(resolveCarouselSlot(product.id, explicitStripIndex))
        return newOrder
      })
    },
    [getSideToShowForProduct, cartOrder, activeStripProducts]
  )

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
        bumpReelAlign()
        setPreviewSlideIndex(product.id === lamp.id ? 0 : 1)
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
    [getSideToShowForProduct, lamp.id, bumpReelAlign]
  )

  const handleFeaturedBundleThumbAddLamp = useCallback(() => {
    handleLampQuantityChange(Math.max(lampQuantity, 1))
    handleSpotlightSelect(true)
    setFilterOpen(false)
    triggerPriceBump()
  }, [handleLampQuantityChange, lampQuantity, handleSpotlightSelect, triggerPriceBump])

  const handleFeaturedBundleThumbAddArtwork = useCallback(
    (product: ShopifyProduct) => {
      if (product.availableForSale === false) return
      setCartOrder((prev) => {
        if (prev.includes(product.id)) return prev
        const nextCart = [...prev, product.id]
        setLastAddedProductId(product.id)
        bumpReelAlign()
        setPreviewSlideIndex(product.id === lamp.id ? 0 : 1)
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
      handleSpotlightSelect(true)
      setFilterOpen(false)
      triggerPriceBump()
    },
    [getSideToShowForProduct, handleSpotlightSelect, lamp.id, triggerPriceBump, bumpReelAlign]
  )

  const handleTapCarouselItem = useCallback(
    (index: number) => {
      const product = activeStripProducts[index]
      if (!product) return
      bumpReelAlign()
      setPreviewSlideIndex(product.id === lamp.id ? 0 : 1)
      setActiveCarouselIndex(index)
      if (product.id === lamp.id) {
        setDisplayedProduct(lamp)
        return
      }
      // Toggle lamp preview: off-lamp → assign to a side; on-lamp → remove so that side shows base Spline mesh
      handleLampSelect(product, carouselStripMode === 'watchlist' ? index : undefined)
    },
    [activeStripProducts, handleLampSelect, lamp.id, carouselStripMode, bumpReelAlign]
  )

  const handleBundleStripItemPress = useCallback(
    (index: number, product: ShopifyProduct) => {
      const isLampSlot = index === 0 || product.id === lamp.id
      if (isLampSlot) {
        if (lampQuantity === 0) {
          handleFeaturedBundleThumbAddLamp()
        } else {
          const idx = activeStripProducts.findIndex((p) => p.id === lamp.id)
          bumpReelAlign()
          setPreviewSlideIndex(0)
          if (idx >= 0) {
            setActiveCarouselIndex(idx)
            setDisplayedProduct(lamp)
          } else {
            setDisplayedProduct(lamp)
          }
        }
        return
      }
      if (product.availableForSale === false) return
      if (!cartOrder.includes(product.id)) {
        handleFeaturedBundleThumbAddArtwork(product)
        return
      }
      const idx = activeStripProducts.findIndex((p) => p.id === product.id)
      if (idx >= 0) handleTapCarouselItem(idx)
    },
    [
      lamp,
      lampQuantity,
      cartOrder,
      activeStripProducts,
      handleFeaturedBundleThumbAddLamp,
      handleFeaturedBundleThumbAddArtwork,
      handleTapCarouselItem,
      bumpReelAlign,
    ]
  )

  const handleStickyThumbnailSplineSelect = useCallback(
    (product: ShopifyProduct) => {
      const idx = activeStripProducts.findIndex((p) => p.id === product.id)
      if (idx >= 0) handleTapCarouselItem(idx)
    },
    [activeStripProducts, handleTapCarouselItem]
  )

  const handleFrontSideSettled = useCallback((side: 'A' | 'B') => {
    currentFrontSideRef.current = side
  }, [])

  const experienceReelRef = useRef<HTMLDivElement | null>(null)
  const handleSwitchToSide = useCallback((side: 'A' | 'B') => {
    bumpReelAlign()
    setRotateToSide(side)
    setRotateTrigger((t) => t + 1)
    setPreviewSlideIndex(0)
  }, [bumpReelAlign])

  const handleGalleryImagesChange = useCallback(
    (images: ExperienceReelGalleryItem[]) => {
      const nextSig = reelGalleryItemsSignature(images)
      const prevSig = lastGallerySigRef.current
      lastGallerySigRef.current = nextSig
      setGalleryImages(images)
      if (prevSig === null) return
      if (prevSig === nextSig) return
      if (isReelGalleryStrictTailExtension(prevSig, nextSig)) return

      bumpReelAlign()
      setPreviewSlideIndex(displayedProduct && displayedProduct.id !== lamp.id ? 1 : 0)
    },
    [displayedProduct, lamp.id, bumpReelAlign]
  )

  const handleGoToSlide = useCallback((index: number) => {
    bumpReelAlign()
    setPreviewSlideIndex(index)
  }, [bumpReelAlign])

  const handleOpenPicker = useCallback(() => {
    cartCountWhenPickerOpenedRef.current = cartOrder.length
    setPickerHasBeenOpened(true)
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
  }, [cartOrder.length, spotlightData?.vendorName, spotlightArtistVendorForFilter])

  const handleClosePicker = useCallback(() => {
    if (cartOrder.length > cartCountWhenPickerOpenedRef.current) {
      triggerPriceBump()
    }
    setIsPickerOpen(false)
    if (isAuthenticated) void refreshWatchlist()
  }, [cartOrder.length, triggerPriceBump, isAuthenticated, refreshWatchlist])

  const handleViewDetail = useCallback(
    (product: ShopifyProduct) => {
      setDetailProduct(product)
      // Match ArtworkInfoBar `detailSlide`: lamp = 1; artworks use edition-before-Spline reel → details at 2
      const detailSlideIndex = product.id === lamp.id ? 1 : 2
      bumpReelAlign()
      setPreviewSlideIndex(detailSlideIndex)
    },
    [lamp.id, bumpReelAlign]
  )

  const isInCart = useCallback((productId: string) => cartOrder.includes(productId), [cartOrder])
  const { theme } = useExperienceTheme()

  // Sync displayedIndex and displayedProduct when user taps carousel item (last selected = displayed).
  // When the lamp preview is empty (no artwork on the Spline), the reel must stay on Street Lamp details —
  // do not let the carousel strip selection (e.g. first cart artwork) override the lamp.
  const lastClickedProductId =
    activeCarouselIndex >= 0 ? activeStripProducts[activeCarouselIndex]?.id ?? null : null
  const lastClickedProduct =
    activeCarouselIndex >= 0 ? activeStripProducts[activeCarouselIndex] ?? null : null
  useEffect(() => {
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

  useEffect(() => {
    if (!isAuthenticated || shopAuthLoading) {
      setHeaderTrailingContent(null)
      return () => setHeaderTrailingContent(null)
    }
    setHeaderTrailingContent(
      <button
        type="button"
        onClick={() => {
          setCarouselStripMode((m) => {
            const next = m === 'collection' ? 'watchlist' : 'collection'
            if (next === 'watchlist') void refreshWatchlist()
            return next
          })
          setActiveCarouselIndex(-1)
        }}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors',
          theme === 'light'
            ? 'text-neutral-800 hover:bg-black/5'
            : 'text-white/90 hover:bg-white/10',
          carouselStripMode === 'watchlist' &&
            (theme === 'light' ? 'bg-black/10 ring-1 ring-black/10' : 'bg-white/15 ring-1 ring-white/20')
        )}
        aria-label={
          carouselStripMode === 'watchlist'
            ? 'Show collection in carousel strip'
            : 'Show edition watchlist in carousel strip'
        }
        aria-pressed={carouselStripMode === 'watchlist'}
      >
        <Heart
          className={cn('h-5 w-5', carouselStripMode === 'watchlist' && 'fill-current')}
          strokeWidth={2}
          aria-hidden
        />
      </button>
    )
    return () => setHeaderTrailingContent(null)
  }, [
    isAuthenticated,
    shopAuthLoading,
    carouselStripMode,
    theme,
    refreshWatchlist,
    setHeaderTrailingContent,
  ])

  // Reel: artworks with edition-above-Spline use slide 0=edition,1=Spline,2=details,3+=gallery; lamp uses 0=Spline,…
  const hasAccordion = !!displayedProduct
  const hasGallery = galleryImages.length > 1
  const editionLeadBeforeSpline = !!(displayedProduct && displayedProduct.id !== lamp.id)
  const gallerySlideOffsetReel = editionLeadBeforeSpline ? 3 : hasAccordion ? 2 : 1
  const sectionCount =
    (editionLeadBeforeSpline ? 3 : hasAccordion ? 2 : 1) +
    (hasGallery ? galleryImages.length - 1 : 0)
  useEffect(() => {
    const max = Math.max(0, sectionCount - 1)
    const idx = previewSlideIndexRef.current
    if (idx > max) {
      bumpReelAlign()
      setPreviewSlideIndex(max)
    }
  }, [displayedProduct?.id, galleryImages.length, sectionCount, bumpReelAlign])

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
      <div className="relative flex min-h-0 w-full flex-1 flex-col bg-transparent">
      <SplineFullScreen
        className={cn('min-h-0 w-full flex-1')}
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
            lampProduct={lampPreviewOrder.length === 0 ? lamp : null}
            displayedIndex={displayedIndex}
            lastClickedProductId={lastClickedProductId}
            onGalleryImagesChange={handleGalleryImagesChange}
            onGoToSlide={handleGoToSlide}
            currentSlide={previewSlideIndex}
            gallerySlideOffset={gallerySlideOffsetReel}
            editionLeadBeforeSpline={editionLeadBeforeSpline}
            onViewDetail={handleViewDetail}
            onDisplayedProductChange={setDisplayedProduct}
            thumbnailPlacement="right"
            onRotate={onRotate}
            hideTitle={isDesktop}
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
        reelAlignNonce={reelAlignNonce}
        onSlideChange={onReelSlideFromScroll}
        onSplineInView={setSplineInView}
        experienceReelRef={experienceReelRef}
        editionLeadBeforeSpline={editionLeadBeforeSpline}
        streetEditionRow={displayedStreetEditionRow}
        displayedProductEarlyAccess={displayedEarlyAccess}
        featuredBundleOffer={featuredBundleFilterOffer}
        bundlePreviewLamp={lamp}
        bundlePreviewArtworks={spotlightPairProducts ?? null}
        bundlePreviewStripProducts={bundlePreviewStripProducts}
        bundleStripSelectedProductId={displayedProduct?.id ?? null}
        bundleStripLampPreviewProductIds={lampPreviewOrder}
        onBundleStripItemPress={handleBundleStripItemPress}
      />

      </div>

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
        featuredBundleOffer={featuredBundleFilterOffer ?? undefined}
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
        />
      )}

      <ExperienceCheckoutStickyBar
        lamp={lamp}
        lampQuantity={lampQuantity}
        selectedArtworks={selectedArtworks}
        orderSubtotal={orderTotal}
        stripMode={carouselStripMode}
        onOpenPicker={handleOpenPicker}
        onViewLampDetail={() => setDetailProduct(lamp)}
        suppressCartThumbnails={false}
        onSelectThumbnailForSpline={handleStickyThumbnailSplineSelect}
        previewSelectedProductId={
          activeCarouselIndex >= 0
            ? (activeStripProducts[activeCarouselIndex]?.id ?? null)
            : null
        }
        lampPreviewProductIds={lampPreviewOrder}
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
