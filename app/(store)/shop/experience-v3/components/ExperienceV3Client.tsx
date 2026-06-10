'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import type { ShopifyImage, ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import { useExperienceOpenArtPicker, useExperienceOrder } from '../../experience-v2/ExperienceOrderContext'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { trackAddToCart, trackViewItem } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import { applyFilters, DEFAULT_FILTERS, type FilterState } from '../../experience-v2/components/FilterPanel'
import type { SpotlightData } from '../../experience-v2/components/ArtistSpotlightBanner'
import { cn, formatPriceCompact } from '@/lib/utils'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { resolveArtworkDetailProduct } from '@/lib/shop/resolve-artwork-detail-product'
import {
  experienceEarlyAccessForProduct,
  experienceVendorsLooselyEqual,
  productMatchesSpotlight,
} from '@/lib/shop/experience-spotlight-match'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { fetchStreetEditionStatesMap } from '@/lib/shop/fetch-street-edition-states-client'
import type { StreetEditionStatesRow } from '@/lib/shop/street-edition-states'
import { loadExperienceCart, saveExperienceCart } from '@/lib/shop/experience-cart-persistence'
import { useExperienceArtistCatalog } from '@/lib/shop/use-experience-artist-catalog'
import { computeExperienceFeaturedBundlePricing } from '@/lib/shop/experience-bundle-order-pricing'
import {
  computeFeaturedBundleRegularSubtotalUsd,
  getSpotlightPairProducts,
  isFeaturedArtistBundleEligible,
  isFeaturedBundleSpotlightPrintsPurchasable,
} from '@/lib/shop/experience-featured-bundle'
import { computeFeaturedBundleEffectiveUsd } from '@/lib/shop/shop-discount-flags'
import { ARTWORKS_PER_FREE_LAMP, lampVolumeDiscountPercentForAllocated } from '@/lib/shop/lamp-artwork-volume-discount'
import { useShopDiscountSettings } from '../../experience-v2/components/ShopDiscountFlagsContext'
import type { FeaturedBundleFilterOffer } from '../../experience-v2/components/FilterPanel'
import { captureFunnelEvent, FunnelEvents, getDeviceType } from '@/lib/posthog'
import { streetEditionRowFromStorefrontProduct } from '@/lib/shop/street-edition-from-storefront'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import { ScarcityBadge, ScarcityWatchRegion } from '../../experience-v2/components/ScarcityBadge'
import { EditionWatchWithNarrative } from '../../experience-v2/components/EditionWatchWithNarrative'
import { buildStreetLadderForScarcity } from '@/lib/shop/experience-street-ladder-display'
import {
  buildEditionMetrics,
  getProductEditionMetrics,
  getProductEditionSize,
} from '@/lib/shop/edition-stages'
import {
  loadImagePosition,
  DEFAULT_SIDE_POSITION,
  DEFAULT_SIDE_B_POSITION,
} from '@/lib/experience-image-position'
import { ChevronLeft, ChevronRight, Package, ZoomIn, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { getVendorCollectionHandle } from '@/lib/shopify/vendor-collection-handle'
import type { ExperienceV3ArtistProfileTarget } from './ExperienceV3ArtistProfileSection'

const Spline3DPreview = dynamic(
  () =>
    import('@/app/template-preview/components/spline-3d-preview').then((m) => ({
      default: m.Spline3DPreview,
    })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-[#0f0d0d]" /> }
)

const OrderBar = dynamic(() => import('../../experience-v2/components/OrderBar').then((m) => m.OrderBar), {
  ssr: false,
})

const ExperienceCheckoutStickyBar = dynamic(
  () =>
    import('../../experience-v2/components/ExperienceCheckoutStickyBar').then((m) => ({
      default: m.ExperienceCheckoutStickyBar,
    })),
  { ssr: false }
)

const ArtworkPickerSheet = dynamic(
  () =>
    import('../../experience/components/ArtworkPickerSheet').then((m) => ({ default: m.ArtworkPickerSheet })),
  { ssr: false }
)

const ExperienceV3ArtistProfileSection = dynamic(
  () =>
    import('./ExperienceV3ArtistProfileSection').then((m) => ({
      default: m.ExperienceV3ArtistProfileSection,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse rounded-xl border border-white/[0.06] bg-[#171515]/60 p-8" />
    ),
  }
)

const MEDIA_MODE_KEY = 'sc-experience-v3-media-mode'
const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

type SeasonTab = 'season1' | 'season2'

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

function getFirstImage(product: ShopifyProduct | null | undefined): string | null {
  if (!product) return null
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null
}

/** Featured image first (primary artwork), then remaining photos in order. */
function collectProductImages(product: ShopifyProduct | null): ShopifyImage[] {
  if (!product) return []
  const edges = product.images?.edges?.map((e) => e.node) ?? []
  const feat = product.featuredImage
  if (feat?.url) {
    const featUrl = feat.url
    const rest = edges.filter((n) => n.url && n.url !== featUrl)
    return [{ ...feat }, ...rest]
  }
  if (edges.length > 0) return edges
  const u = getFirstImage(product)
  if (!u) return []
  return [{ url: u, altText: product.title, width: null, height: null } as ShopifyImage]
}

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
  const { setOrderSummary, setOrderBarProps, setPickerEngaged, setHeaderTrailingContent } = useExperienceOrder()
  const { flags: discountFlags, featuredBundle: featuredBundleDiscount } = useShopDiscountSettings()
  const { lampArtworkVolume: lampVolumeDiscountEnabled } = discountFlags
  const { isAuthenticated } = useShopAuthContext()
  const { theme } = useExperienceTheme()
  const lampVariant = theme === 'light' ? 'light' : 'dark'

  const [productsSeason1, setProductsSeason1] = useState(initialSeason1)
  const [productsSeason2, setProductsSeason2] = useState(initialSeason2)
  const [pageInfoSeason1, setPageInfoSeason1] = useState(initialPageInfo1)
  const [pageInfoSeason2, setPageInfoSeason2] = useState(initialPageInfo2)
  const [activeSeason, setActiveSeason] = useState<SeasonTab>('season2')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [spotlightData, setSpotlightData] = useState<SpotlightData | null>(null)
  const [spotlightProductsFromApi, setSpotlightProductsFromApi] = useState<ShopifyProduct[]>([])
  const [spotlightExpanded, setSpotlightExpanded] = useState(false)
  const [streetEditionByProductId, setStreetEditionByProductId] = useState<
    Record<string, StreetEditionStatesRow>
  >({})
  const [lockedArtworkPrices, setLockedArtworkPrices] = useState<Record<string, number>>({})

  const [initialCart] = useState(() => loadExperienceCart())
  const [cartOrder, setCartOrder] = useState<string[]>(() => initialCart.cartOrder)
  const [lampQuantity, setLampQuantity] = useState(() => initialCart.lampQuantity)
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)

  const [previewProduct, setPreviewProduct] = useState<ShopifyProduct | null>(null)
  const [previewFull, setPreviewFull] = useState<ShopifyProduct | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryZoomOpen, setGalleryZoomOpen] = useState(false)
  const [splineReady, setSplineReady] = useState(false)
  const [splineThumbReady, setSplineThumbReady] = useState(false)

  const [mediaMode, setMediaMode] = useState<'gallery' | 'spline'>('gallery')
  const mediaModeLoaded = useRef(false)

  const artworkScrollRef = useRef<HTMLDivElement | null>(null)
  const experienceScrollRootRef = useRef<HTMLDivElement | null>(null)
  const artistBioSectionRef = useRef<HTMLElement | null>(null)
  const currentFrontSideRef = useRef<'A' | 'B'>('A')
  const handleFrontSideSettled = useCallback((side: 'A' | 'B') => {
    currentFrontSideRef.current = side
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

  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerHasBeenOpened, setPickerHasBeenOpened] = useState(false)
  const [pickerLayoutDesktop, setPickerLayoutDesktop] = useState(false)
  const cartCountWhenPickerOpenedRef = useRef(0)
  const fullProductCacheRef = useRef<Map<string, ShopifyProduct>>(new Map())

  useEffect(() => {
    const saved = loadImagePosition()
    if (!saved) return
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
  }, [])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const q = window.matchMedia('(min-width: 1024px)')
    const sync = () => setPickerLayoutDesktop(q.matches)
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (mediaModeLoaded.current) return
    mediaModeLoaded.current = true
    try {
      const v = sessionStorage.getItem(MEDIA_MODE_KEY)
      if (v === 'gallery' || v === 'spline') setMediaMode(v)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(MEDIA_MODE_KEY, mediaMode)
    } catch {
      // ignore
    }
  }, [mediaMode])

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, [])
  }, [cartOrder, lampQuantity])

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
              const existingIds = new Set(prev.map((p) => p.id))
              const toAdd = products.filter((p) => !existingIds.has(p.id))
              return toAdd.length ? [...prev, ...toAdd] : prev
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

  const allProducts = useMemo(
    () => [...productsSeason1, ...productsSeason2],
    [productsSeason1, productsSeason2]
  )

  const findProductByCartId = useCallback(
    (cartId: string) => {
      const k = normalizeShopifyProductId(cartId)
      return allProducts.find((p) => normalizeShopifyProductId(p.id) === k)
    },
    [allProducts]
  )

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

  const streetLadderPrices = useMemo(() => {
    const m: Record<string, number> = {}
    for (const [id, row] of Object.entries(streetEditionByProductId)) {
      if (row.priceUsd != null && row.priceUsd > 0) m[id] = row.priceUsd
    }
    return m
  }, [streetEditionByProductId])

  const productsForActiveSeason = useMemo(
    () => (activeSeason === 'season1' ? productsSeason1 : productsSeason2),
    [activeSeason, productsSeason1, productsSeason2]
  )

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

  useEffect(() => {
    if (previewProduct) return
    const first = filteredProducts[0]
    if (first) {
      setPreviewProduct(first)
    }
  }, [filteredProducts, previewProduct])

  useEffect(() => {
    if (!previewProduct) {
      setPreviewFull(null)
      setPreviewLoading(false)
      return
    }
    const handle = previewProduct.handle
    const cached = fullProductCacheRef.current.get(handle)
    if (cached) {
      setPreviewFull(cached)
      setPreviewLoading(false)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    setPreviewFull(null)
    fetch(`/api/shop/products/${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.product) return
        const full = data.product as ShopifyProduct
        fullProductCacheRef.current.set(handle, full)
        setPreviewFull(full)
        setPreviewLoading(false)
      })
      .catch(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [previewProduct])

  const artworkDetailProduct = useMemo(
    () => (previewProduct ? resolveArtworkDetailProduct(previewProduct, previewFull) : null),
    [previewProduct, previewFull]
  )

  useEffect(() => {
    if (!artworkDetailProduct || previewLoading) return
    const variant = artworkDetailProduct.variants?.edges?.[0]?.node
    trackViewItem({ ...storefrontProductToItem(artworkDetailProduct, variant, 1), item_list_name: 'experience-v3' })
  }, [artworkDetailProduct, previewLoading, previewProduct?.id])

  const galleryImages = useMemo(() => collectProductImages(artworkDetailProduct), [artworkDetailProduct])

  useLayoutEffect(() => {
    setGalleryIndex(galleryImages.length >= 2 ? 1 : 0)
  }, [previewProduct?.id, galleryImages.length])

  const activeGalleryImage = galleryImages[galleryIndex] ?? galleryImages[0]

  const heroImageUrl = useMemo(() => {
    const imgs = galleryImages
    const node = imgs[galleryIndex] ?? imgs[0]
    if (!node?.url) return null
    return getShopifyImageUrl(node.url, 1600) ?? node.url
  }, [galleryImages, galleryIndex])

  const heroImageUrlLightbox = useMemo(() => {
    const imgs = galleryImages
    const node = imgs[galleryIndex] ?? imgs[0]
    if (!node?.url) return null
    return getShopifyImageUrl(node.url, 2400) ?? node.url
  }, [galleryImages, galleryIndex])

  const heroLayoutWidth =
    activeGalleryImage?.width && activeGalleryImage.width > 0 ? activeGalleryImage.width : 4
  const heroLayoutHeight =
    activeGalleryImage?.height && activeGalleryImage.height > 0 ? activeGalleryImage.height : 5

  const splineImage1 = useMemo(() => {
    const u = getFirstImage(artworkDetailProduct ?? previewProduct)
    return u ? (getShopifyImageUrl(u, 1600) ?? u) : null
  }, [artworkDetailProduct, previewProduct])

  const splineImage2 = useMemo(() => {
    const imgs = galleryImages
    const second = imgs[1]?.url ?? imgs[0]?.url
    if (!second) return splineImage1
    return getShopifyImageUrl(second, 1600) ?? second
  }, [galleryImages, splineImage1])

  /** After `splineImage1` exists, schedule idle (`requestIdleCallback` / `setTimeout(0)`) so Spline can mount off-thread without blocking LCP. */
  const splineIdleScheduledRef = useRef(false)
  useEffect(() => {
    if (!splineImage1 || splineIdleScheduledRef.current) return
    splineIdleScheduledRef.current = true
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 3000 })
        : (setTimeout(cb, 0) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    const id = schedule(() => setSplineReady(true))
    return () => cancel(id)
  }, [splineImage1])

  useEffect(() => {
    if (!splineReady) {
      setSplineThumbReady(false)
      return
    }
    const schedule = (cb: () => void) =>
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(cb, { timeout: 4000 })
        : (setTimeout(cb, 80) as unknown as number)
    const cancel = (id: number) =>
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id)
    /* Stagger after main viewer so first canvas/scene load stays on critical path; if double-WebGL proves unstable on low-end devices, fall back to a static poster (`splineImage1`) here instead. */
    const id = schedule(() => setSplineThumbReady(true))
    return () => {
      cancel(id)
      setSplineThumbReady(false)
    }
  }, [splineReady])

  const experienceSplineBindings = useMemo(
    () => ({
      lampVariant,
      previewTheme: theme,
      side1ObjectId: '2de1e7d2-4b53-4738-a749-be197641fa9a',
      side2ObjectId: '2e33392b-21d8-441d-87b0-11527f3a8b70',
      minimal: true as const,
      animate: true as const,
      interactive: false as const,
      idleSpinEnabled: true as const,
      swapLampSides: true as const,
      flipForSide: 'B' as const,
      flipForSideB: 'horizontal' as const,
      imageScale,
      imageOffsetX,
      imageOffsetY,
      imageScaleX,
      imageScaleY,
      imageScaleB,
      imageOffsetXB,
      imageOffsetYB,
      imageScaleXB,
      imageScaleYB,
      resetTrigger: 0,
      rotateToSide: null as const,
      rotateTrigger: 0,
      previewQuarterTurns: 0,
    }),
    [
      lampVariant,
      theme,
      imageScale,
      imageOffsetX,
      imageOffsetY,
      imageScaleX,
      imageScaleY,
      imageScaleB,
      imageOffsetXB,
      imageOffsetYB,
      imageScaleXB,
      imageScaleYB,
    ]
  )

  const selectedArtworks = useMemo(
    () => cartOrder.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[],
    [cartOrder, findProductByCartId]
  )

  const artworkPriceMaps = useMemo(
    () => ({
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: streetLadderPrices,
      seasonBandsFallback: activeSeason === 'season2' ? 2 : 1,
    }),
    [lockedArtworkPrices, streetLadderPrices, activeSeason]
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

  const spotlightPairProducts = useMemo(
    () => getSpotlightPairProducts(spotlightData, spotlightProductsFromApi, allProducts),
    [spotlightData, spotlightProductsFromApi, allProducts]
  )

  const spotlightArtistVendorForFilter = useMemo(() => {
    if (!spotlightData) return ''
    const fromCatalog = spotlightProducts[0]?.vendor?.trim()
    if (fromCatalog) return fromCatalog
    const fromApi = spotlightProductsFromApi[0]?.vendor?.trim()
    if (fromApi) return fromApi
    return spotlightData.vendorName
  }, [spotlightData, spotlightProducts, spotlightProductsFromApi])

  const handleSpotlightSelect = useCallback(
    (isExpanding: boolean) => {
      if (!spotlightData) return
      setSpotlightExpanded(isExpanding)
      const vendorKey = spotlightArtistVendorForFilter || spotlightData.vendorName
      if (isExpanding) {
        const idSet = new Set(spotlightData.productIds.map((id) => id.replace(/^gid:\/\/shopify\/Product\//i, '') || id))
        const inSeason1 = productsSeason1.some(
          (p) => idSet.has(p.id) || idSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, ''))
        )
        const inSeason2 = productsSeason2.some(
          (p) => idSet.has(p.id) || idSet.has(p.id.replace(/^gid:\/\/shopify\/Product\//i, ''))
        )
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
      onApply: () => {
        const pair = spotlightPairProducts
        if (!pair) return
        const [a, b] = pair
        setLampQuantity(1)
        setCartOrder([a.id, b.id])
        setSpotlightExpanded(true)
        setFilterOpen(false)
      },
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
    lampVolumeDiscountEnabled,
    searchParams,
  ])

  const handleLampQuantityChange = useCallback((n: number) => {
    setLampQuantity(Math.max(0, n))
  }, [])

  const handleAdjustArtworkQuantity = useCallback((runStartIndex: number, delta: 1 | -1) => {
    if (delta === -1) {
      const prev = cartOrder
      const id = prev[runStartIndex]
      if (!id) return
      let end = runStartIndex
      while (end < prev.length && prev[end] === id) end++
      if (end <= runStartIndex) return
      setCartOrder((o) => o.filter((_, i) => i !== end - 1))
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
  }, [cartOrder])

  const handleToggleSelect = useCallback(
    (product: ShopifyProduct) => {
      setCartOrder((prev) => {
        const exists = prev.includes(product.id)
        if (exists) {
          return prev.filter((id) => id !== product.id)
        }
        const next = [...prev, product.id]
        setLastAddedProductId(product.id)
        const variant = product.variants?.edges?.[0]?.node
        trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v3' })
        return next
      })
    },
    []
  )

  const handlePreviewFromPicker = useCallback((product: ShopifyProduct) => {
    setPreviewProduct(product)
  }, [])

  const handleSplineStickyThumbSelect = useCallback((product: ShopifyProduct) => {
    setPreviewProduct(product)
    setMediaMode('spline')
  }, [])

  const handleQuickAddFromPicker = useCallback((product: ShopifyProduct) => {
    if (product.availableForSale === false) return
    setCartOrder((prev) => {
      if (prev.includes(product.id)) return prev
      return [...prev, product.id]
    })
    setLastAddedProductId(product.id)
    const variant = product.variants?.edges?.[0]?.node
    trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v3-quick' })
  }, [])

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

  const handleOpenPicker = useCallback(() => {
    setPickerEngaged(true)
    cartCountWhenPickerOpenedRef.current = cartOrder.length
    setPickerHasBeenOpened(true)
    captureFunnelEvent(FunnelEvents.experience_picker_opened, {
      cart_count: cartOrder.length,
      device_type: getDeviceType(),
    })
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

  useExperienceOpenArtPicker(handleOpenPicker)

  const handleClosePicker = useCallback(() => {
    captureFunnelEvent(FunnelEvents.experience_picker_closed, {
      cart_count: cartOrder.length,
      added_since_open: cartOrder.length > cartCountWhenPickerOpenedRef.current,
      device_type: getDeviceType(),
    })
    setIsPickerOpen(false)
  }, [cartOrder.length])

  useEffect(() => {
    setHeaderTrailingContent(
      <button
        type="button"
        onClick={() => (isPickerOpen ? handleClosePicker() : handleOpenPicker())}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2',
          theme === 'light'
            ? 'focus-visible:ring-offset-white'
            : 'focus-visible:ring-offset-[#0f0d0d]',
          isPickerOpen ? 'bg-violet-700 hover:bg-violet-600' : 'bg-violet-600 hover:bg-violet-500'
        )}
        aria-label={isPickerOpen ? 'Close gallery picker' : 'Open gallery picker'}
        aria-expanded={isPickerOpen}
      >
        <span
          className={cn(
            'pointer-events-none select-none text-lg leading-none',
            isPickerOpen ? 'opacity-100' : 'opacity-90'
          )}
          aria-hidden
        >
          ✦
        </span>
      </button>
    )
    return () => setHeaderTrailingContent(null)
  }, [
    theme,
    isPickerOpen,
    handleOpenPicker,
    handleClosePicker,
    setHeaderTrailingContent,
  ])

  const orderItemCount = selectedArtworks.length + lampQuantity
  useEffect(() => {
    setOrderSummary({ total: orderTotal, itemCount: orderItemCount })
  }, [orderTotal, orderItemCount, setOrderSummary])

  useEffect(() => {
    setOrderBarProps({
      lamp,
      selectedArtworks,
      lampQuantity,
      onLampQuantityChange: handleLampQuantityChange,
      onAdjustArtworkQuantity: handleAdjustArtworkQuantity,
      onViewLampDetail: () => {},
      isGift: false,
      lampPrice,
      lampTotal: lampPrices.reduce((a, b) => a + b, 0),
      artworkCount,
      pastLampPaywall: true,
      lockedArtworkPrices,
      streetLadderPrices,
      streetPricingSeasonFallback: activeSeason === 'season2' ? 2 : 1,
      featuredBundleCheckout: featuredArtistBundlePricingActive ? featuredBundleCheckoutPayload : null,
      bundlePricedArtworkIndices:
        featuredArtistBundlePricingActive ? bundlePricing.bundlePricedArtworkIndices : undefined,
    })
  }, [
    lamp,
    selectedArtworks,
    lampQuantity,
    lampPrice,
    lampPrices,
    artworkCount,
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

  const hasMore =
    activeSeason === 'season1' ? pageInfoSeason1.hasNextPage : pageInfoSeason2.hasNextPage

  const filterPanelLampOffer = useMemo(
    () => ({
      product: lamp,
      quantity: lampQuantity,
      onAdd: () => handleLampQuantityChange(1),
    }),
    [lamp, lampQuantity, handleLampQuantityChange]
  )

  const streetRowForPreview = useMemo(() => {
    if (!previewProduct) return null
    const k = normalizeShopifyProductId(previewProduct.id)
    if (k && streetEditionByProductId[k]) return streetEditionByProductId[k]
    return streetEditionRowFromStorefrontProduct(previewProduct, {
      seasonBandsFallback: activeSeason === 'season2' ? 2 : 1,
    })
  }, [previewProduct, streetEditionByProductId, activeSeason])

  const addButtonLabel = useMemo(() => {
    if (!previewProduct) return 'Add to cart'
    const inCart = cartOrder.includes(previewProduct.id)
    const p = resolveArtworkDetailProduct(previewProduct, previewFull) ?? previewProduct
    const variant = p.variants?.edges?.[0]?.node
    const amt = parseFloat(variant?.price?.amount ?? p.priceRange?.minVariantPrice?.amount ?? '0')
    if (inCart) return 'Remove from cart'
    return `Add to cart $${formatPriceCompact(amt)}`
  }, [previewProduct, cartOrder, previewFull])

  const pDetail = artworkDetailProduct ?? previewProduct
  const isEarlyAccessPreview = pDetail
    ? experienceEarlyAccessForProduct(pDetail, lamp.id, spotlightData)
    : false
  const isNewDropPreview =
    !!pDetail &&
    !!spotlightData &&
    productMatchesSpotlight(pDetail, spotlightData) &&
    !spotlightData.unlisted

  const firstVariant = pDetail?.variants?.edges?.[0]?.node
  const quantityAvailable =
    typeof firstVariant?.quantityAvailable === 'number' ? firstVariant.quantityAvailable : undefined
  const editionSizeRaw = pDetail?.metafields?.find(
    (m) => m && m.namespace === 'custom' && m.key === 'edition_size'
  )?.value
  const editionSizeNum = editionSizeRaw ? parseInt(editionSizeRaw, 10) : null

  const streetLadderBlock = useMemo(
    () =>
      pDetail
        ? buildStreetLadderForScarcity(pDetail, streetRowForPreview, isEarlyAccessPreview)
        : null,
    [pDetail, streetRowForPreview, isEarlyAccessPreview]
  )

  const editionMetricsForWatch = useMemo(() => {
    if (!pDetail) return null
    const fromStorefront = getProductEditionMetrics(pDetail)
    if (fromStorefront) return fromStorefront
    const total = getProductEditionSize(pDetail)
    if (total != null && total >= 2 && typeof quantityAvailable === 'number') {
      return buildEditionMetrics(total, quantityAvailable)
    }
    return null
  }, [pDetail, quantityAvailable])

  const editionArtistName = (previewProduct?.vendor ?? '').trim() || 'Artist'

  const artistProfileTarget = useMemo((): ExperienceV3ArtistProfileTarget | null => {
    const fromSearchParam = (): ExperienceV3ArtistProfileTarget | null => {
      const raw = initialArtistSlug?.trim()
      if (!raw) return null
      if (/\s/.test(raw)) return { slug: getVendorCollectionHandle(raw), vendor: raw }
      return { slug: raw.toLowerCase(), vendor: '' }
    }

    if (previewProduct?.id && previewProduct.id !== lamp.id) {
      const v = previewProduct.vendor?.trim()
      if (v) return { slug: getVendorCollectionHandle(v), vendor: v }
    }
    if (spotlightData?.vendorSlug?.trim()) {
      return {
        slug: spotlightData.vendorSlug.trim().toLowerCase(),
        vendor: spotlightData.vendorName?.trim() || '',
      }
    }
    return fromSearchParam()
  }, [
    previewProduct?.id,
    previewProduct?.vendor,
    lamp.id,
    spotlightData?.vendorSlug,
    spotlightData?.vendorName,
    initialArtistSlug,
  ])

  const scrollToArtistBio = useCallback(() => {
    artistBioSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const editionWatchNode = useMemo(() => {
    if (!pDetail || !editionMetricsForWatch) return null
    return (
      <EditionWatchWithNarrative
        product={pDetail}
        editionNumberSold={editionMetricsForWatch.editionNumberSold}
        totalEditions={editionMetricsForWatch.totalEditions}
        artistName={editionArtistName}
      />
    )
  }, [editionMetricsForWatch, pDetail, editionArtistName])

  const isSoldOut = pDetail ? !pDetail.availableForSale : false
  const autoRotatePauseUntil = useRef(0)

  useEffect(() => {
    autoRotatePauseUntil.current = 0
    const len = galleryImages.length
    setGalleryIndex(len > 1 ? 1 : 0)
  }, [previewProduct?.id, galleryImages])

  const touchGalleryInteraction = useCallback(() => {
    autoRotatePauseUntil.current = Date.now() + 14000
  }, [])

  const goGalleryNext = useCallback(() => {
    if (galleryImages.length <= 1) return
    touchGalleryInteraction()
    setGalleryIndex((i) => (i + 1) % galleryImages.length)
  }, [galleryImages.length, touchGalleryInteraction])

  const goGalleryPrev = useCallback(() => {
    if (galleryImages.length <= 1) return
    touchGalleryInteraction()
    setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
  }, [galleryImages.length, touchGalleryInteraction])

  useEffect(() => {
    if (mediaMode !== 'gallery' || galleryImages.length <= 1) return
    const id = window.setInterval(() => {
      if (Date.now() < autoRotatePauseUntil.current) return
      setGalleryIndex((i) => (i + 1) % galleryImages.length)
    }, 5000)
    return () => clearInterval(id)
  }, [mediaMode, galleryImages.length, previewProduct?.id])

  useEffect(() => {
    setGalleryZoomOpen(false)
  }, [previewProduct?.id])

  useEffect(() => {
    if (mediaMode !== 'gallery') setGalleryZoomOpen(false)
  }, [mediaMode])

  const artistCatalogForFilters = useExperienceArtistCatalog()

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-[#0f0d0d] text-[#f0e8e8]">
      <div className="flex min-h-0 flex-1 min-w-0 flex-row">
        <div
          ref={experienceScrollRootRef}
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden',
            /* Main column scroll — distinct from nested product column overflow-y-auto */
            'snap-y snap-mandatory overflow-y-auto overscroll-y-contain',
            /* Keep snap points clear of fixed bottom checkout UI */
            '[scroll-padding-bottom:max(8rem,env(safe-area-inset-bottom))]'
          )}
          data-experience-v3-scroll-snap-root=""
        >
        <section
          aria-labelledby="experience-v3-hero-heading"
          className={cn(
            /* grow-0: hero height stays content-driven so artist section stacks below in normal flow */
            'flex min-h-0 w-full max-w-full shrink-0 grow-0 snap-start snap-always flex-col',
            /* Mobile: stack gallery then titles in normal flow. Desktop: side-by-side; no max-h trap (artist bio scrolls below). */
            'min-w-0 max-md:max-h-none md:flex-row md:items-stretch md:justify-center'
          )}
        >
        <h2 id="experience-v3-hero-heading" className="sr-only">
          Artwork and details
        </h2>
        {/* Left: thumbnail strip + controls, then hero / 3D */}
        <div
          className={cn(
            'flex min-h-0 min-w-0 w-full flex-col',
            'max-md:flex-none max-md:shrink-0',
            'md:max-w-[min(100%,720px)] md:flex-none md:grow-0 md:shrink'
          )}
        >
          <div className="mx-auto flex w-full max-w-[min(96vw,720px)] flex-col px-2 pt-3 md:max-w-[min(100%,720px)] md:px-2 md:pr-2 md:pt-4">
            {/* md+: vertical left rail; mobile: horizontal thumb strip (images + 3D) above hero */}
            <div className="mb-2 flex min-h-0 w-full flex-col gap-3 bg-[#0f0d0d] md:mb-0 md:flex-row md:items-stretch md:gap-3">
              <div className="flex min-h-0 w-full shrink-0 md:w-[4.25rem] md:flex-col md:flex-nowrap md:items-center md:self-stretch">
                {(galleryImages.length > 0 || splineImage1) && (
                  <div
                    className={cn(
                      'order-first flex min-w-0 gap-1.5 [scrollbar-width:thin]',
                      'min-h-0 w-full flex-1 flex-row overflow-x-auto overflow-y-hidden pb-1',
                      'md:h-full md:max-h-[min(72vh,820px)] md:w-full md:flex-col md:items-center md:overflow-x-hidden md:overflow-y-auto md:pb-0'
                    )}
                  >
                    {galleryImages.map((im, i) => {
                      const u = getShopifyImageUrl(im.url, 120) ?? im.url
                      const selected = mediaMode === 'gallery' && galleryIndex === i
                      return (
                        <button
                          key={`${im.url}-${i}`}
                          type="button"
                          onClick={() => {
                            touchGalleryInteraction()
                            setMediaMode('gallery')
                            setGalleryIndex(i)
                          }}
                          className={cn(
                            'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition-[opacity,box-shadow]',
                            selected
                              ? 'opacity-100 shadow-[0_6px_18px_rgba(255,186,148,0.42)] ring-[#FFBA94]/80'
                              : 'opacity-70'
                          )}
                        >
                          <Image src={u} alt="" fill className="object-cover" unoptimized />
                        </button>
                      )
                    })}
                    {splineImage1 ? (
                      <button
                        type="button"
                        onClick={() => setMediaMode('spline')}
                        aria-pressed={mediaMode === 'spline'}
                        aria-label="Show 3D preview"
                        className={cn(
                          'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#0f0d0d] ring-2 transition-[opacity,box-shadow]',
                          mediaMode === 'spline'
                            ? 'opacity-100 shadow-[0_6px_18px_rgba(255,186,148,0.42)] ring-[#FFBA94]/80'
                            : 'opacity-70 ring-transparent'
                        )}
                      >
                        {splineThumbReady ? (
                          <div className="pointer-events-none absolute inset-0 z-0">
                            <ComponentErrorBoundary
                              componentName="Spline3DThumbnail"
                              fallback={
                                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-[#0f0d0d]">
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[#FFBA94]">
                                    3D
                                  </span>
                                </div>
                              }
                            >
                              <Spline3DPreview
                                {...experienceSplineBindings}
                                key={`v3-spline-thumb-${previewProduct?.id ?? 'unknown'}`}
                                image1={splineImage1}
                                image2={splineImage2 ?? splineImage1}
                                parentScrollMode="isolate"
                                className="relative z-0 h-full min-h-[3rem] w-full min-w-[3rem]"
                              />
                            </ComponentErrorBoundary>
                          </div>
                        ) : (
                          <div
                            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#0f0d0d]"
                            aria-hidden
                          >
                            <div className="h-5 w-5 animate-pulse rounded bg-white/15" />
                            <span className="text-[8px] font-semibold uppercase tracking-wide text-white/85">
                              3D
                            </span>
                          </div>
                        )}
                        <span className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] bg-transparent py-1 text-center text-[8px] font-semibold uppercase tracking-wide text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                          3D
                        </span>
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 md:flex md:min-h-0 md:flex-col">
                <div
                  className={cn(
                    'relative isolate w-full max-md:overflow-hidden',
                    mediaMode === 'spline' && splineImage1 && 'min-h-[min(52vh,500px)]'
                  )}
                >
              {mediaMode === 'gallery' && heroImageUrl && (
                <div className="relative z-[2]">
                  <button
                    type="button"
                    onClick={() => setGalleryZoomOpen(true)}
                    className="absolute left-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-md shadow-black/40 backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/90"
                    aria-label="Zoom image"
                  >
                    <ZoomIn className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <Image
                    src={heroImageUrl}
                    alt={galleryImages[galleryIndex]?.altText ?? previewProduct?.title ?? 'Artwork'}
                    width={heroLayoutWidth}
                    height={heroLayoutHeight}
                    className="mx-auto h-auto w-full max-h-[min(72vh,820px)] object-contain"
                    sizes="(max-width:1023px) 96vw, 720px"
                    unoptimized
                    priority={galleryImages.length > 1 ? galleryIndex === 1 : galleryIndex === 0}
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goGalleryPrev}
                        className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md shadow-black/40 backdrop-blur-sm transition-colors hover:bg-black/70"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={goGalleryNext}
                        className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md shadow-black/40 backdrop-blur-sm transition-colors hover:bg-black/70"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {galleryImages.map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              i === galleryIndex ? 'w-5 bg-[#FFBA94]' : 'w-1.5 bg-white/35'
                            )}
                            aria-hidden
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {mediaMode === 'gallery' && !heroImageUrl && (
                <div className="flex min-h-[200px] items-center justify-center px-6 py-12 text-center text-sm text-white/50">
                  No images for this artwork yet.
                </div>
              )}

              {/* Preload: mount Spline under gallery (invisible) after idle so switching to 3D avoids wait. */}
              {splineImage1 && splineReady && (
                <div
                  className={cn(
                    'absolute inset-0 flex min-h-[min(52vh,500px)] flex-col bg-[#0f0d0d]',
                    mediaMode === 'gallery' &&
                      'pointer-events-none z-[1] select-none opacity-0',
                    mediaMode === 'spline' && 'z-[6]'
                  )}
                  aria-hidden={mediaMode === 'gallery'}
                >
                  <ComponentErrorBoundary
                    componentName="Spline3DPreview"
                    fallback={
                      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-white/70">
                        3D preview unavailable — switch to gallery.
                      </div>
                    }
                  >
                    <Spline3DPreview
                      {...experienceSplineBindings}
                      image1={splineImage1}
                      image2={splineImage2 ?? splineImage1}
                      parentScrollMode="contain"
                      reelScrollContainerRef={artworkScrollRef}
                      onFrontSideSettled={handleFrontSideSettled}
                      className="relative h-full min-h-0 min-w-0 w-full"
                    />
                  </ComponentErrorBoundary>
                </div>
              )}

              {mediaMode === 'spline' && splineImage1 && !splineReady && (
                <div className="absolute inset-0 z-[6] flex min-h-[min(52vh,500px)] flex-col bg-[#0f0d0d]">
                  <div className="flex flex-1 items-center justify-center">
                    <Image
                      src={splineImage1}
                      alt=""
                      width={800}
                      height={800}
                      className="max-h-full w-auto max-w-full object-contain p-4"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {previewLoading && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 flex items-center justify-center',
                    mediaMode === 'spline' ? 'bg-[#0f0d0d]/80' : 'bg-black/20'
                  )}
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: product layout — below gallery on mobile, side column on md+ */}
        <div
          ref={artworkScrollRef}
          data-experience-artwork-scroll
          className={cn(
            'flex w-full shrink-0 flex-col overflow-x-hidden',
            'relative z-10 max-md:flex-none max-md:bg-[#0f0d0d]',
            'max-md:overflow-visible',
            'md:min-h-0 md:w-[min(100%,392px)] md:overflow-visible'
          )}
        >
          {previewProduct && pDetail && (
            <div className="flex flex-col gap-5 px-5 py-6 pb-28 md:gap-4 md:px-3 md:py-6 md:pb-8">
              <header className="mx-auto max-w-xl space-y-2 pb-5 text-center md:pb-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-white/55">
                  {editionArtistName}
                </p>
                {artistProfileTarget ? (
                  <button
                    type="button"
                    onClick={scrollToArtistBio}
                    className="mx-auto block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFBA94]/75 underline-offset-4 transition-colors hover:text-[#FFBA94] hover:underline"
                  >
                    Artist bio ↓
                  </button>
                ) : null}
                <h1 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-[#FFBA94] lg:text-[1.65rem]">
                  {previewProduct.title}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {isSoldOut && (
                    <span className="rounded bg-red-950/60 px-2 py-0.5 text-[11px] font-semibold text-red-300">
                      Sold out
                    </span>
                  )}
                  {isNewDropPreview && !isSoldOut && (
                    <span className="rounded bg-amber-950/50 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                      New drop
                    </span>
                  )}
                  {isEarlyAccessPreview && !isSoldOut && (
                    <span className="rounded bg-violet-950/50 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
                      Early access
                    </span>
                  )}
                  {previewProduct.id !== lamp.id && spotlightData && productMatchesSpotlight(previewProduct, spotlightData) && (
                    <span className="rounded bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-100/90">
                      Featured artist
                    </span>
                  )}
                </div>
              </header>

              {previewLoading && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                  Loading artwork details…
                </div>
              )}

              {!isSoldOut &&
                previewProduct.id !== lamp.id &&
                editionSizeNum != null &&
                editionSizeNum > 0 && (
                  <div className="flex flex-col gap-1 py-1">
                    <ScarcityBadge
                      quantityAvailable={quantityAvailable}
                      editionSize={editionSizeNum}
                      availableForSale={previewProduct.availableForSale}
                      variant="bar"
                      productId={previewProduct.id}
                      productImage={
                        previewProduct.featuredImage?.url ??
                        previewProduct.images?.edges?.[0]?.node?.url ??
                        null
                      }
                      productTitle={previewProduct.title}
                      unifiedSection
                      className="w-full"
                      streetLadder={streetLadderBlock ?? undefined}
                      belowStreetLadder={streetLadderBlock ? editionWatchNode : undefined}
                    />
                    {!streetLadderBlock && editionWatchNode ? (
                      <ScarcityWatchRegion className="mt-4">{editionWatchNode}</ScarcityWatchRegion>
                    ) : null}
                  </div>
                )}

              <div className="sticky bottom-0 z-[5] -mx-5 bg-[#0f0d0d]/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:mt-2 md:bg-transparent md:p-0 md:backdrop-blur-none">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.99 }}
                  disabled={isSoldOut}
                  onClick={() => handleToggleSelect(previewProduct)}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-lg transition-colors',
                    isSoldOut
                      ? 'cursor-not-allowed bg-white/10 text-white/40'
                      : 'bg-[#FFBA94] text-neutral-900 shadow-black/30 hover:bg-[#ffc9a8]'
                  )}
                >
                  {cartOrder.includes(previewProduct.id) && (
                    <Package className="h-4 w-4 opacity-90" strokeWidth={2} />
                  )}
                  {addButtonLabel}
                </motion.button>
              </div>
            </div>
          )}
        </div>
        </section>

        {/* Artist region: full width of scroll column only — avoid w-screen / negative vw margins (breaks flow in nested flex). */}
        <section
          ref={artistBioSectionRef}
          id="experience-v3-artist-bio"
          aria-labelledby="experience-v3-artist-heading"
          className={cn(
            'relative z-0 w-full max-w-full shrink-0 snap-start snap-always',
            'mt-6 border-t border-white/[0.04] pt-8 pb-10',
            'bg-[#0a0909]',
            'md:mt-8 md:pt-10 md:pb-12',
            'scroll-mt-[max(4.5rem,env(safe-area-inset-top))]'
          )}
          data-experience-v3-below-media=""
        >
          <div className="mx-auto w-full max-w-[min(100%,1200px)] px-3 md:px-6">
            <h2 id="experience-v3-artist-heading" className="sr-only">
              Artist profile
            </h2>
            {artistProfileTarget ? (
              <ExperienceV3ArtistProfileSection
                slug={artistProfileTarget.slug}
                vendor={artistProfileTarget.vendor}
              />
            ) : (
              <p className="py-4 text-center text-[11px] leading-relaxed text-white/35">
                Select an artwork to see the artist profile, or browse{' '}
                <Link
                  href="/shop/explore-artists"
                  className="text-[#FFBA94]/80 underline-offset-4 hover:text-[#FFBA94] hover:underline"
                >
                  all artists
                </Link>
                .
              </p>
            )}
          </div>
        </section>
        </div>
        {pickerHasBeenOpened && pickerLayoutDesktop && (
          <div
            className={cn(
              'hidden h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-out lg:flex',
              isPickerOpen ? 'w-[min(440px,40vw)]' : 'w-0'
            )}
          >
            <ArtworkPickerSheet
              presentation="pushPanel"
              showDoneButton={false}
              isOpen={isPickerOpen}
              onClose={handleClosePicker}
              products={filteredProducts}
              selectedArtworks={selectedArtworks}
              lampPreviewOrder={[]}
              onToggleSelect={handleToggleSelect}
              lastAddedProductId={lastAddedProductId}
              hasMore={hasMore}
              onLoadMore={() => loadMoreForSeason(activeSeason)}
              activeSeason={activeSeason}
              onSeasonChange={setActiveSeason}
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
              pickerCardMode="previewAndQuickAdd"
              onPreviewProduct={handlePreviewFromPicker}
              onQuickAddProduct={handleQuickAddFromPicker}
              previewProductId={previewProduct?.id ?? null}
              sheetVariant="rightRail"
            />
          </div>
        )}
      </div>

      {pickerHasBeenOpened && !pickerLayoutDesktop && (
        <ArtworkPickerSheet
          presentation="modal"
          showDoneButton
          isOpen={isPickerOpen}
          onClose={handleClosePicker}
          products={filteredProducts}
          selectedArtworks={selectedArtworks}
          lampPreviewOrder={[]}
          onToggleSelect={handleToggleSelect}
          lastAddedProductId={lastAddedProductId}
          hasMore={hasMore}
          onLoadMore={() => loadMoreForSeason(activeSeason)}
          activeSeason={activeSeason}
          onSeasonChange={setActiveSeason}
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
          pickerCardMode="previewAndQuickAdd"
          onPreviewProduct={handlePreviewFromPicker}
          onQuickAddProduct={handleQuickAddFromPicker}
          previewProductId={previewProduct?.id ?? null}
          sheetVariant="rightRail"
        />
      )}

      <RadixDialog.Root open={galleryZoomOpen} onOpenChange={setGalleryZoomOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-[120] bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <RadixDialog.Content
            className={cn(
              'fixed inset-0 z-[121] flex items-center justify-center border-0 bg-transparent p-4 shadow-none outline-none',
              'pointer-events-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <RadixDialog.Title className="sr-only">Enlarged artwork image</RadixDialog.Title>
            <button
              type="button"
              onClick={() => setGalleryZoomOpen(false)}
              className="pointer-events-auto absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/90"
              aria-label="Close zoomed image"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
            {heroImageUrlLightbox && (
              <div className="pointer-events-auto flex max-h-[min(100vh,100dvh)] max-w-[min(100vw,100dvw)] items-center justify-center">
                <Image
                  src={heroImageUrlLightbox}
                  alt={galleryImages[galleryIndex]?.altText ?? previewProduct?.title ?? 'Artwork'}
                  width={heroLayoutWidth}
                  height={heroLayoutHeight}
                  className="max-h-[min(calc(100vh-5rem),calc(100dvh-5rem))] w-auto max-w-[min(100vw,100dvw)] object-contain"
                  unoptimized
                />
              </div>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      {!pickerLayoutDesktop ? (
        <ExperienceCheckoutStickyBar
          lamp={lamp}
          lampQuantity={lampQuantity}
          selectedArtworks={selectedArtworks}
          orderSubtotal={orderTotal}
          stripMode="collection"
          onOpenPicker={handleOpenPicker}
          onViewLampDetail={() => {}}
          suppressCartThumbnails={mediaMode !== 'spline'}
          onSelectThumbnailForSpline={
            mediaMode === 'spline' ? handleSplineStickyThumbSelect : undefined
          }
          previewSelectedProductId={previewProduct?.id ?? null}
          lampPreviewProductIds={[]}
        />
      ) : null}

      <OrderBar
        lamp={lamp}
        selectedArtworks={selectedArtworks}
        lampQuantity={lampQuantity}
        onLampQuantityChange={handleLampQuantityChange}
        onAdjustArtworkQuantity={handleAdjustArtworkQuantity}
        onViewLampDetail={() => {}}
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
