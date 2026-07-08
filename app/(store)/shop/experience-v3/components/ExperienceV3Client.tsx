'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getShopifyImageUrl } from '@/lib/shopify/image-url'
import {
  buildGalleryImageUrlSets,
  collectProductImages,
  EXPERIENCE_GALLERY_SPLINE_PX,
  EXPERIENCE_GALLERY_THUMB_PX,
  getAdjacentGalleryIndices,
  getDefaultGalleryIndex,
  getFirstProductImageUrl,
  injectGalleryLinkPreloads,
  pickInitialPreviewProduct,
  prefetchImageUrls,
} from '@/lib/shop/experience-gallery-images'
import { useGalleryProductHydration } from '@/lib/shop/use-gallery-product-hydration'
import { useExperienceOpenArtPicker, useExperienceOrder } from '../../experience-v2/ExperienceOrderContext'
import { useExperienceTheme } from '../../experience-v2/ExperienceThemeContext'
import { trackAddToCart, trackViewItem } from '@/lib/google-analytics'
import { storefrontProductToItem, trackQuickAddToCart } from '@/lib/analytics-ecommerce'
import { applyFilters, DEFAULT_FILTERS, type FilterState } from '../../experience-v2/components/FilterPanel'
import type { SpotlightData } from '../../experience-v2/components/ArtistSpotlightBanner'
import { capitalizeFirstLetter, cn, formatPriceCompact } from '@/lib/utils'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
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
import {
  ExperienceV3EditionStrip,
  ExperienceV3ProductInfoStack,
} from './ExperienceV3ProductPanel'
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
import { experienceArtworkUnitUsd } from '@/lib/shop/experience-artwork-unit-price'
import type { ExperienceV3ArtistProfileTarget } from './ExperienceV3ArtistProfileSection'
import { ExperienceV3ArtistWorksSlider } from './ExperienceV3ArtistWorksSlider'
import { ExperienceV3LampBundleCard } from './ExperienceV3LampBundleCard'
import { ExperienceV3StickyAddPanel } from './ExperienceV3StickyAddPanel'
import { ExperienceV3ProductInfoTabs } from './ExperienceV3ProductInfoTabs'
import { ExperienceV3SplineLampSection } from './ExperienceV3SplineLampSection'
import { useCartEditionHolds } from '@/lib/shop/use-cart-edition-holds'
import { computeReservedEditionNumber } from '@/lib/shop/compute-cart-edition-reserve'
import { EditionHoldIndicator } from '../../experience-v2/components/EditionHoldIndicator'

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
      <div className="animate-pulse rounded-xl border border-border bg-experience-surface/60 p-8" />
    ),
  }
)

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36

type SeasonTab = 'season1' | 'season2'

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

interface ExperienceV3ClientProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: PageInfo
  pageInfoSeason2: PageInfo
  initialArtistSlug?: string
  initialSelectedArtwork?: ShopifyProduct | null
  /** Full Storefront product for the first preview — avoids a client round-trip for the hero gallery. */
  initialGalleryProduct?: ShopifyProduct | null
}

export function ExperienceV3Client({
  lamp,
  productsSeason1: initialSeason1,
  productsSeason2: initialSeason2,
  pageInfoSeason1: initialPageInfo1,
  pageInfoSeason2: initialPageInfo2,
  initialArtistSlug,
  initialSelectedArtwork = null,
  initialGalleryProduct = null,
}: ExperienceV3ClientProps) {
  const searchParams = useSearchParams()
  const { setOrderSummary, setOrderBarProps, setPickerEngaged, setHeaderCenterContent } = useExperienceOrder()
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
  const [lampPreviewOrder, setLampPreviewOrder] = useState<string[]>(() => initialCart.lampPreviewOrder)
  const [lampQuantity, setLampQuantity] = useState(() => initialCart.lampQuantity)
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null)
  const [rotateToSide, setRotateToSide] = useState<'A' | 'B' | null>(null)
  const [rotateTrigger, setRotateTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [lampSplineFocusProductId, setLampSplineFocusProductId] = useState<string | null>(null)

  const [previewProduct, setPreviewProduct] = useState<ShopifyProduct | null>(() =>
    pickInitialPreviewProduct(initialSeason1, initialSeason2)
  )
  const galleryProduct = useGalleryProductHydration(previewProduct, {
    initialFullProduct: initialGalleryProduct,
  })
  const [galleryIndex, setGalleryIndex] = useState(() => {
    const initial =
      initialGalleryProduct ??
      pickInitialPreviewProduct(initialSeason1, initialSeason2)
    return getDefaultGalleryIndex(collectProductImages(initial).length)
  })
  const [galleryZoomOpen, setGalleryZoomOpen] = useState(false)

  const artworkScrollRef = useRef<HTMLDivElement | null>(null)
  const experienceScrollRootRef = useRef<HTMLDivElement | null>(null)
  const heroSectionRef = useRef<HTMLElement | null>(null)
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
  const [splineSectionInView, setSplineSectionInView] = useState(false)
  const cartCountWhenPickerOpenedRef = useRef(0)

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
    if (!pickerLayoutDesktop) return
    setPickerHasBeenOpened(true)
    setIsPickerOpen(true)
  }, [pickerLayoutDesktop])

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, lampPreviewOrder)
  }, [cartOrder, lampQuantity, lampPreviewOrder])

  useEffect(() => {
    setProductsSeason1(initialSeason1)
    setProductsSeason2(initialSeason2)
    setPageInfoSeason1(initialPageInfo1)
    setPageInfoSeason2(initialPageInfo2)
  }, [initialSeason1, initialSeason2, initialPageInfo1, initialPageInfo2])

  useEffect(() => {
    if (!initialSelectedArtwork) return
    const selectedId = normalizeShopifyProductId(initialSelectedArtwork.id) ?? initialSelectedArtwork.id
    const existsInSeason1 = initialSeason1.some((p) => (normalizeShopifyProductId(p.id) ?? p.id) === selectedId)
    const existsInSeason2 = initialSeason2.some((p) => (normalizeShopifyProductId(p.id) ?? p.id) === selectedId)
    if (!existsInSeason1 && !existsInSeason2) {
      setProductsSeason2((prev) => {
        const alreadyExists = prev.some((p) => (normalizeShopifyProductId(p.id) ?? p.id) === selectedId)
        return alreadyExists ? prev : [initialSelectedArtwork, ...prev]
      })
    }
    setPreviewProduct(initialSelectedArtwork)
    if (initialSelectedArtwork.availableForSale !== false) {
      setLampSplineFocusProductId(initialSelectedArtwork.id)
    }
  }, [initialSelectedArtwork, initialSeason1, initialSeason2])

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

  const filteredProductsCrossSeason = useMemo(() => {
    if (filters.artists.length === 0) {
      return { season1: [], season2: [], combined: [] }
    }
    const season1Filtered = applyFilters(productsSeason1, filters, '', cartOrder)
    const season2Filtered = applyFilters(productsSeason2, filters, '', cartOrder)
    return {
      season1: season1Filtered,
      season2: season2Filtered,
      combined: [...season2Filtered, ...season1Filtered],
    }
  }, [productsSeason1, productsSeason2, filters, cartOrder])

  const filteredProducts = useMemo(() => {
    if (filters.artists.length === 0) {
      return applyFilters(productsForActiveSeason, filters, '', cartOrder)
    }
    return activeSeason === 'season1' ? filteredProductsCrossSeason.season1 : filteredProductsCrossSeason.season2
  }, [productsForActiveSeason, filters, cartOrder, activeSeason, filteredProductsCrossSeason])

  useEffect(() => {
    if (filters.artists.length === 0) return
    const season1Count = filteredProductsCrossSeason.season1.length
    const season2Count = filteredProductsCrossSeason.season2.length
    if (season2Count > 0 && season1Count === 0 && activeSeason !== 'season2') {
      setActiveSeason('season2')
    } else if (season1Count > 0 && season2Count === 0 && activeSeason !== 'season1') {
      setActiveSeason('season1')
    } else if (season2Count > 0 && season1Count > 0 && activeSeason === 'season1' && season2Count > season1Count) {
      setActiveSeason('season2')
    }
  }, [filters.artists, filteredProductsCrossSeason, activeSeason])

  useEffect(() => {
    if (previewProduct) return
    const first = filteredProducts[0]
    if (first) {
      setPreviewProduct(first)
    }
  }, [filteredProducts, previewProduct])

  useEffect(() => {
    if (!previewProduct) return
    const variant = previewProduct.variants?.edges?.[0]?.node
    trackViewItem({ ...storefrontProductToItem(previewProduct, variant, 1), item_list_name: 'experience-v3' })
  }, [previewProduct?.id])

  const galleryImages = useMemo(() => collectProductImages(galleryProduct), [galleryProduct])

  const galleryUrlSets = useMemo(
    () => buildGalleryImageUrlSets(galleryImages),
    [galleryImages]
  )

  useLayoutEffect(() => {
    setGalleryIndex(getDefaultGalleryIndex(galleryImages.length))
  }, [previewProduct?.id, galleryImages.length])

  const heroImageUrl = useMemo(() => {
    const set = galleryUrlSets[galleryIndex] ?? galleryUrlSets[0]
    return set?.hero ?? null
  }, [galleryUrlSets, galleryIndex])

  const heroImageUrlLightbox = useMemo(() => {
    const set = galleryUrlSets[galleryIndex] ?? galleryUrlSets[0]
    return set?.lightbox ?? null
  }, [galleryUrlSets, galleryIndex])

  /** Preload entire gallery hero + thumb set as soon as product images are known. */
  useEffect(() => {
    if (galleryUrlSets.length === 0) return
    const heroUrls = galleryUrlSets.map((s) => s.hero)
    const thumbUrls = galleryUrlSets.map((s) => s.thumb)
    const removeLinks = injectGalleryLinkPreloads(heroUrls, heroUrls.length)
    prefetchImageUrls(heroUrls, 'high')
    prefetchImageUrls(thumbUrls, 'auto')
    return () => {
      removeLinks()
    }
  }, [galleryProduct?.id, galleryUrlSets])

  /** Keep current + adjacent hero/lightbox URLs warm when navigating the rail. */
  useEffect(() => {
    if (galleryUrlSets.length === 0) return
    const indices = getAdjacentGalleryIndices(galleryIndex, galleryUrlSets.length)
    const heroUrls = indices.map((i) => galleryUrlSets[i]?.hero).filter(Boolean) as string[]
    const lightboxUrls = indices.map((i) => galleryUrlSets[i]?.lightbox).filter(Boolean) as string[]
    prefetchImageUrls(heroUrls, 'high')
    prefetchImageUrls(lightboxUrls, 'low')
  }, [galleryIndex, galleryUrlSets])

  /** Warm lightbox assets when zoom opens. */
  useEffect(() => {
    if (!galleryZoomOpen || galleryUrlSets.length === 0) return
    prefetchImageUrls(
      galleryUrlSets.map((s) => s.lightbox),
      'high'
    )
  }, [galleryZoomOpen, galleryUrlSets])

  const heroLayoutWidth = 3
  const heroLayoutHeight = 4

  const sideAProduct = useMemo(() => {
    const fromPreview = lampPreviewOrder[0] ? findProductByCartId(lampPreviewOrder[0]) : null
    if (fromPreview && fromPreview.id !== lamp.id) return fromPreview
    if (previewProduct && previewProduct.id !== lamp.id) return previewProduct
    return null
  }, [lampPreviewOrder, findProductByCartId, previewProduct, lamp.id])

  const sideBProduct = useMemo(() => {
    const fromPreview = lampPreviewOrder[1] ? findProductByCartId(lampPreviewOrder[1]) : null
    return fromPreview && fromPreview.id !== lamp.id ? fromPreview : null
  }, [lampPreviewOrder, findProductByCartId, lamp.id])

  const splineImage1 = useMemo(() => {
    if (!sideAProduct) return null
    const u = getFirstProductImageUrl(sideAProduct)
    return u ? (getShopifyImageUrl(u, EXPERIENCE_GALLERY_SPLINE_PX) ?? u) : null
  }, [sideAProduct])

  const splineImage2 = useMemo(() => {
    if (sideBProduct) {
      const u = getFirstProductImageUrl(sideBProduct)
      return u ? (getShopifyImageUrl(u, EXPERIENCE_GALLERY_SPLINE_PX) ?? u) : null
    }
    // Single artwork on lamp: both physical sides use the product's first image (never gallery image 2).
    return splineImage1
  }, [sideBProduct, splineImage1])

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
      resetTrigger,
      rotateToSide,
      rotateTrigger,
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
      resetTrigger,
      rotateToSide,
      rotateTrigger,
    ]
  )

  const getSideToShowForProduct = useCallback((order: string[], productId: string): 'A' | 'B' => {
    const productIndex = order.indexOf(productId)
    if (productIndex === 0) return 'B'
    if (productIndex === 1) return 'A'
    return 'A'
  }, [])

  const assignProductToLampPreview = useCallback(
    (productId: string) => {
      setLampPreviewOrder((prev) => {
        const idx = prev.indexOf(productId)
        if (idx >= 0) {
          const sideToShow = getSideToShowForProduct(prev, productId)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          setLampSplineFocusProductId(productId)
          return prev
        }
        const newOrder =
          prev.length >= 2
            ? currentFrontSideRef.current === 'A'
              ? [productId, prev[1]!]
              : [prev[0]!, productId]
            : [...prev, productId]
        const sideToShow = getSideToShowForProduct(newOrder, productId)
        setRotateTrigger((t) => t + 1)
        setRotateToSide(sideToShow)
        setLampSplineFocusProductId(productId)
        return newOrder
      })
    },
    [getSideToShowForProduct]
  )

  const removeProductFromLampPreview = useCallback(
    (productId: string, nextCart: string[]) => {
      setLampPreviewOrder((prevLamp) => {
        const next = prevLamp.filter((id) => id !== productId)
        if (next.length === 0) {
          setRotateToSide(null)
          setLampSplineFocusProductId(null)
          return []
        }
        if (next.length < prevLamp.length) {
          const remainingId = next[0]!
          const sideToShow = getSideToShowForProduct(next, remainingId)
          setRotateTrigger((t) => t + 1)
          setRotateToSide(sideToShow)
          setLampSplineFocusProductId(remainingId)
        } else if (!nextCart.includes(lampSplineFocusProductId ?? '')) {
          setLampSplineFocusProductId(next[0] ?? null)
        }
        return next
      })
    },
    [getSideToShowForProduct, lampSplineFocusProductId]
  )

  const handleSplineStickyThumbSelect = useCallback(
    (product: ShopifyProduct) => {
      if (product.id === lamp.id) return
      assignProductToLampPreview(product.id)
    },
    [assignProductToLampPreview, lamp.id]
  )

  const selectedArtworks = useMemo(
    () => cartOrder.map((id) => findProductByCartId(id)).filter(Boolean) as ShopifyProduct[],
    [cartOrder, findProductByCartId]
  )

  const {
    cartHoldsByProductId: cartEditionHolds,
    soonestExpiry: cartEditionHoldSoonestExpiry,
  } = useCartEditionHolds({
    cartProductGids: cartOrder,
    streetEditionByProductId,
  })

  const previewCartEditionHold = useMemo(() => {
    if (!previewProduct) return null
    const key = normalizeShopifyProductId(previewProduct.id)
    return key ? cartEditionHolds[key] ?? null : null
  }, [previewProduct, cartEditionHolds])

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
        setLampPreviewOrder([a.id, b.id])
        setLampSplineFocusProductId(a.id)
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

  const handleLampQuantityChange = useCallback(
    (n: number) => {
      const next = Math.max(0, n)
      if (next > 0 && cartOrder.length === 0) return
      setLampQuantity(next)
    },
    [cartOrder.length]
  )

  useEffect(() => {
    if (cartOrder.length === 0 && lampQuantity > 0) {
      setLampQuantity(0)
    }
  }, [cartOrder.length, lampQuantity])

  const addArtworkToCart = useCallback((product: ShopifyProduct) => {
    setCartOrder((prev) => {
      if (prev.includes(product.id)) return prev
      const next = [...prev, product.id]
      setLastAddedProductId(product.id)
      assignProductToLampPreview(product.id)
      const variant = product.variants?.edges?.[0]?.node
      trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v3' })
      return next
    })
  }, [assignProductToLampPreview])

  const handleAddPreviewWithLamp = useCallback(() => {
    if (!previewProduct || previewProduct.id === lamp.id || previewProduct.availableForSale === false) return
    addArtworkToCart(previewProduct)
    setLampQuantity((q) => (q > 0 ? q : 1))
  }, [previewProduct, lamp.id, addArtworkToCart])

  const handleAddPreviewArtworkOnly = useCallback(() => {
    if (!previewProduct || previewProduct.id === lamp.id) return
    if (cartOrder.includes(previewProduct.id)) {
      setCartOrder((prev) => {
        const filtered = prev.filter((id) => id !== previewProduct.id)
        if (filtered.length === 0) {
          setResetTrigger((t) => t + 1)
          setRotateToSide(null)
          setLampPreviewOrder([])
          setLampSplineFocusProductId(null)
        } else {
          removeProductFromLampPreview(previewProduct.id, filtered)
        }
        return filtered
      })
      return
    }
    addArtworkToCart(previewProduct)
  }, [previewProduct, lamp.id, cartOrder, addArtworkToCart, removeProductFromLampPreview])

  const handleAdjustArtworkQuantity = useCallback((runStartIndex: number, delta: 1 | -1) => {
    if (delta === -1) {
      const prev = cartOrder
      const id = prev[runStartIndex]
      if (!id) return
      let end = runStartIndex
      while (end < prev.length && prev[end] === id) end++
      if (end <= runStartIndex) return
      const removeIndex = end - 1
      setCartOrder((o) => {
        const filtered = o.filter((_, i) => i !== removeIndex)
        if (filtered.length === 0) {
          setResetTrigger((t) => t + 1)
          setRotateToSide(null)
          setLampPreviewOrder([])
          setLampSplineFocusProductId(null)
        } else {
          const removedId = o[removeIndex]
          if (removedId) removeProductFromLampPreview(removedId, filtered)
        }
        return filtered
      })
      return
    }
    setCartOrder((prev) => {
      const id = prev[runStartIndex]
      if (!id) return prev
      let end = runStartIndex
      while (end < prev.length && prev[end] === id) end++
      const next = [...prev]
      next.splice(end, 0, id)
      assignProductToLampPreview(id)
      return next
    })
  }, [cartOrder, removeProductFromLampPreview, assignProductToLampPreview])

  const handleToggleSelect = useCallback(
    (product: ShopifyProduct) => {
      setCartOrder((prev) => {
        const exists = prev.includes(product.id)
        if (exists) {
          const filtered = prev.filter((id) => id !== product.id)
          if (filtered.length === 0) {
            setResetTrigger((t) => t + 1)
            setRotateToSide(null)
            setLampPreviewOrder([])
            setLampSplineFocusProductId(null)
          } else {
            removeProductFromLampPreview(product.id, filtered)
          }
          return filtered
        }
        const next = [...prev, product.id]
        setLastAddedProductId(product.id)
        assignProductToLampPreview(product.id)
        const variant = product.variants?.edges?.[0]?.node
        trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'experience-v3' })
        return next
      })
    },
    [assignProductToLampPreview, removeProductFromLampPreview]
  )

  const handleQuickAddFromPicker = useCallback((product: ShopifyProduct) => {
    if (product.availableForSale === false) return
    setCartOrder((prev) => {
      if (prev.includes(product.id)) return prev
      assignProductToLampPreview(product.id)
      return [...prev, product.id]
    })
    setLastAddedProductId(product.id)
    const variant = product.variants?.edges?.[0]?.node
    trackQuickAddToCart(product, variant, 'experience-v3-quick')
  }, [assignProductToLampPreview])

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

  const scrollToArtworkPreview = useCallback(() => {
    experienceScrollRootRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePreviewFromPicker = useCallback(
    (product: ShopifyProduct) => {
      setPreviewProduct(product)
      if (isPickerOpen && !pickerLayoutDesktop) {
        handleClosePicker()
      }
      requestAnimationFrame(() => scrollToArtworkPreview())
    },
    [isPickerOpen, handleClosePicker, scrollToArtworkPreview, pickerLayoutDesktop]
  )

  const handleSelectArtworkFromCart = useCallback(
    (product: ShopifyProduct) => {
      const inSeason1 = productsSeason1.some((p) => p.id === product.id)
      if (inSeason1 && activeSeason !== 'season1') setActiveSeason('season1')
      else if (!inSeason1 && activeSeason !== 'season2') setActiveSeason('season2')
      setPreviewProduct(product)
      if (isPickerOpen && !pickerLayoutDesktop) {
        handleClosePicker()
      }
      requestAnimationFrame(() => scrollToArtworkPreview())
    },
    [
      productsSeason1,
      activeSeason,
      isPickerOpen,
      handleClosePicker,
      scrollToArtworkPreview,
      pickerLayoutDesktop,
    ]
  )

  const handleTogglePicker = useCallback(() => {
    if (isPickerOpen) {
      handleClosePicker()
    } else {
      handleOpenPicker()
    }
  }, [isPickerOpen, handleClosePicker, handleOpenPicker])

  useEffect(() => {
    setHeaderCenterContent(null)
    return () => setHeaderCenterContent(null)
  }, [setHeaderCenterContent])

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
      onSelectArtwork: handleSelectArtworkFromCart,
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
      requireArtworkForLamp: true,
      cartEditionHolds,
      cartEditionHoldSoonestExpiry,
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
    cartEditionHolds,
    cartEditionHoldSoonestExpiry,
    handleLampQuantityChange,
    handleAdjustArtworkQuantity,
    handleSelectArtworkFromCart,
    setOrderBarProps,
  ])

  const hasMore =
    activeSeason === 'season1' ? pageInfoSeason1.hasNextPage : pageInfoSeason2.hasNextPage

  const previewArtworkUnitUsd = useMemo(() => {
    if (!previewProduct || previewProduct.id === lamp.id) return 0
    return experienceArtworkUnitUsd(previewProduct, {
      lockedUsdByProductId: lockedArtworkPrices,
      streetLadderUsdByProductId: streetLadderPrices,
      seasonBandsFallback: activeSeason === 'season2' ? 2 : 1,
    })
  }, [previewProduct, lamp.id, lockedArtworkPrices, streetLadderPrices, activeSeason])

  const previewLampUnitUsd = lampPrices[0] ?? lampPrice

  const previewInCart = Boolean(previewProduct && cartOrder.includes(previewProduct.id))
  const lampInCart = lampQuantity > 0 || cartOrder.includes(lamp.id)
  const showLampBundleCard =
    Boolean(previewProduct && previewProduct.id !== lamp.id && !previewInCart && !lampInCart)

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
    if (previewInCart) return 'Remove from cart'
    if (lampInCart && previewProduct.id !== lamp.id) return 'Add to your lamp collection'
    return 'Add to cart'
  }, [previewProduct, previewInCart, lampInCart, lamp.id])

  const previewDisplayTitle = useMemo(
    () => (previewProduct?.title ? capitalizeFirstLetter(previewProduct.title) : null),
    [previewProduct?.title]
  )

  const heroImageAlt = useMemo(() => {
    const raw = galleryImages[galleryIndex]?.altText ?? previewProduct?.title ?? 'Artwork'
    return capitalizeFirstLetter(raw)
  }, [galleryImages, galleryIndex, previewProduct?.title])

  const pDetail = previewProduct
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

  const previewHoldFallbackEditionNumber = useMemo(() => {
    if (!editionMetricsForWatch) return null
    return computeReservedEditionNumber(editionMetricsForWatch.editionNumberSold, 0)
  }, [editionMetricsForWatch])

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

  const isSoldOut = pDetail ? !pDetail.availableForSale : false

  const showEditionStrip =
    !isSoldOut &&
    !!previewProduct &&
    previewProduct.id !== lamp.id &&
    editionSizeNum != null &&
    editionSizeNum > 0 &&
    !!editionMetricsForWatch &&
    !!pDetail

  const editionStripProps = useMemo(() => {
    if (!showEditionStrip || !pDetail || !editionMetricsForWatch || editionSizeNum == null) return null
    return {
      product: pDetail,
      editionSize: editionSizeNum,
      quantityAvailable,
      streetLadder: streetLadderBlock ?? undefined,
      editionNumberSold: editionMetricsForWatch.editionNumberSold,
      totalEditions: editionMetricsForWatch.totalEditions,
      artistName: editionArtistName,
    }
  }, [
    showEditionStrip,
    pDetail,
    editionMetricsForWatch,
    editionSizeNum,
    quantityAvailable,
    streetLadderBlock,
    editionArtistName,
  ])

  const autoRotatePauseUntil = useRef(0)

  useEffect(() => {
    autoRotatePauseUntil.current = 0
    const len = galleryImages.length
    setGalleryIndex(getDefaultGalleryIndex(len))
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
    if (galleryImages.length <= 1) return
    const id = window.setInterval(() => {
      if (Date.now() < autoRotatePauseUntil.current) return
      setGalleryIndex((i) => (i + 1) % galleryImages.length)
    }, 5000)
    return () => clearInterval(id)
  }, [galleryImages.length, previewProduct?.id])

  useEffect(() => {
    setGalleryZoomOpen(false)
  }, [previewProduct?.id])

  const artistCatalogForFilters = useExperienceArtistCatalog()

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-background text-foreground">
      <div className="flex min-h-0 flex-1 min-w-0 flex-row">
        <div
          ref={experienceScrollRootRef}
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden',
            /* Main column scroll — distinct from nested product column overflow-y-auto */
            'touch-pan-y overflow-y-auto overscroll-y-contain'
          )}
        >
        <section
          ref={heroSectionRef}
          id="experience-v3-hero"
          aria-labelledby="experience-v3-hero-heading"
          className={cn(
            /* grow-0: hero height stays content-driven so artist section stacks below in normal flow */
            'flex min-h-0 w-full max-w-full shrink-0 grow-0 flex-col',
            /* Mobile: stack gallery then titles in normal flow. Desktop: side-by-side; no max-h trap (artist bio scrolls below). */
            'min-w-0 max-md:max-h-none md:flex-row md:items-stretch md:justify-center'
          )}
        >
        <h2 id="experience-v3-hero-heading" className="sr-only">
          Artwork and details
        </h2>
        {/* Left: thumbnail strip + controls, then hero image */}
        <div
          className={cn(
            'flex min-h-0 min-w-0 w-full flex-col',
            'max-md:flex-none max-md:shrink-0',
            'md:max-w-[min(100%,720px)] md:flex-none md:grow-0 md:shrink'
          )}
        >
          <div className="mx-auto flex w-full max-w-[min(96vw,720px)] flex-col px-2 pt-3 md:max-w-[min(100%,720px)] md:px-2 md:pr-2 md:pt-4">
            {/* md+: vertical left rail; mobile: horizontal thumb strip above hero */}
            <div className="mb-2 flex min-h-0 w-full flex-col gap-3 bg-background md:mb-0 md:flex-row md:items-stretch md:gap-3">
              <div className="flex min-h-0 w-full shrink-0 md:w-[4.25rem] md:flex-col md:flex-nowrap md:items-center md:self-stretch">
                {galleryImages.length > 0 && (
                  <div
                    className={cn(
                      'order-first flex min-w-0 gap-1.5 [scrollbar-width:thin]',
                      'touch-pan-x min-h-0 w-full flex-1 flex-row overflow-x-auto overflow-y-hidden pb-1',
                      'md:h-full md:max-h-[min(72vh,820px)] md:w-full md:flex-col md:items-center md:overflow-x-hidden md:overflow-y-auto md:pb-0'
                    )}
                  >
                    {galleryImages.map((im, i) => {
                      const u = galleryUrlSets[i]?.thumb ?? (getShopifyImageUrl(im.url, EXPERIENCE_GALLERY_THUMB_PX) ?? im.url)
                      const selected = galleryIndex === i
                      const isNearActive = Math.abs(i - galleryIndex) <= 2 || (galleryIndex === 0 && i <= 3)
                      return (
                        <button
                          key={`${im.url}-${i}`}
                          type="button"
                          onClick={() => {
                            touchGalleryInteraction()
                            setGalleryIndex(i)
                          }}
                          className={cn(
                            'relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition-[opacity,box-shadow]',
                            selected
                              ? 'opacity-100 shadow-[0_6px_18px_rgba(255,186,148,0.42)] ring-[#FFBA94]/80'
                              : 'opacity-70'
                          )}
                        >
                          <Image
                            src={u}
                            alt=""
                            fill
                            className="object-contain"
                            sizes="48px"
                            loading="eager"
                            fetchPriority={selected || isNearActive ? 'high' : 'auto'}
                            unoptimized
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 md:flex md:min-h-0 md:flex-col">
                <div className="relative isolate w-full max-md:overflow-visible">
              {heroImageUrl && (
                <div
                  className={cn(
                    'relative z-[2] mx-auto aspect-[3/4] overflow-hidden rounded-lg bg-experience-surface',
                    'w-[min(100%,calc(min(52dvh,560px)*3/4))]',
                    'md:w-[min(100%,calc(min(72vh,820px)*3/4))]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setGalleryZoomOpen(true)}
                    className="absolute left-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-md shadow-black/40 backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/90"
                    aria-label="Zoom image"
                  >
                    <ZoomIn className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <Image
                    key={`${galleryProduct?.id ?? 'gallery'}-${galleryIndex}`}
                    src={heroImageUrl}
                    alt={heroImageAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 767px) min(84vw, 420px), min(615px, 54vw)"
                    unoptimized
                    priority={galleryIndex === getDefaultGalleryIndex(galleryImages.length)}
                    fetchPriority="high"
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
                              i === galleryIndex ? 'w-5 bg-experience-highlight' : 'w-1.5 bg-muted-foreground/35'
                            )}
                            aria-hidden
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {!heroImageUrl && (
                <div
                  className={cn(
                    'mx-auto flex aspect-[3/4] items-center justify-center rounded-lg bg-experience-surface px-6 text-center text-sm text-muted-foreground',
                    'w-[min(100%,calc(min(52dvh,560px)*3/4))]',
                    'md:w-[min(100%,calc(min(72vh,820px)*3/4))]'
                  )}
                >
                  No images for this artwork yet.
                </div>
              )}
                </div>
              </div>
            </div>

            {editionStripProps ? (
              <div className="mx-auto hidden w-full max-w-[min(96vw,720px)] px-2 pb-3 md:block md:max-w-[min(100%,720px)] md:px-2">
                <div className="overflow-hidden rounded-xl border border-border bg-experience-surface/60">
                  <ExperienceV3EditionStrip {...editionStripProps} />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: product layout — below gallery on mobile, side column on md+ */}
        <div
          ref={artworkScrollRef}
          data-experience-artwork-scroll
          className={cn(
            'flex w-full shrink-0 flex-col overflow-x-hidden',
            'relative z-10 max-md:flex-none max-md:bg-background',
            'max-md:overflow-visible',
            'md:min-h-0 md:w-[min(100%,392px)] md:overflow-visible'
          )}
        >
          {previewProduct && pDetail && (
            <div className="flex flex-col gap-4 px-5 py-6 pb-28 md:gap-3 md:px-3 md:py-5 md:pb-8">
              <header className="mx-auto max-w-xl space-y-2 pb-2 text-center md:pb-1">
                {artistProfileTarget ? (
                  <button
                    type="button"
                    onClick={scrollToArtistBio}
                    className="mx-auto block text-[11px] font-medium uppercase tracking-widest text-muted-foreground underline-offset-4 transition-colors hover:text-experience-highlight hover:underline"
                  >
                    {editionArtistName}
                  </button>
                ) : (
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {editionArtistName}
                  </p>
                )}
                <h1 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-experience-title lg:text-[1.65rem]">
                  {previewDisplayTitle}
                </h1>
                {previewProduct.id !== lamp.id &&
                (streetLadderBlock?.listPricePrimary ||
                  previewArtworkUnitUsd > 0) ? (
                  <div className="space-y-1 pt-0.5">
                    <p className="flex items-center justify-center gap-2">
                      <span className="text-lg font-semibold tabular-nums text-foreground">
                        {streetLadderBlock?.listPricePrimary
                          ? streetLadderBlock.listPricePrimary
                          : `$${formatPriceCompact(previewArtworkUnitUsd)}`}
                      </span>
                      {streetLadderBlock?.listPriceCompareAt ? (
                        <span className="text-sm tabular-nums text-muted-foreground line-through">
                          {streetLadderBlock.listPriceCompareAt}
                        </span>
                      ) : null}
                    </p>
                    {streetLadderBlock?.nextStepChip ? (
                      <p className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {streetLadderBlock.nextStepChip}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {isSoldOut && (
                    <span className="rounded bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      Sold out
                    </span>
                  )}
                  {isNewDropPreview && !isSoldOut && (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border">
                      New drop
                    </span>
                  )}
                  {isEarlyAccessPreview && !isSoldOut && (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border">
                      Early access
                    </span>
                  )}
                  {previewProduct.id !== lamp.id && spotlightData && productMatchesSpotlight(previewProduct, spotlightData) && (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border">
                      Featured artist
                    </span>
                  )}
                </div>
              </header>

              <div className="sticky bottom-0 z-[5] -mx-5 bg-background/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:mx-0 md:mt-2 md:bg-transparent md:p-0 md:backdrop-blur-none">
                {previewInCart && previewCartEditionHold ? (
                  <div className="mb-3">
                    <EditionHoldIndicator
                      hold={previewCartEditionHold}
                      inCart
                      fallbackEditionNumber={previewHoldFallbackEditionNumber}
                      variant="banner"
                    />
                  </div>
                ) : null}
                {showLampBundleCard ? (
                  <ExperienceV3LampBundleCard
                    lamp={lamp}
                    artwork={previewProduct}
                    artworkUnitUsd={previewArtworkUnitUsd}
                    lampUnitUsd={previewLampUnitUsd}
                    disabled={isSoldOut}
                    onAddWithLamp={handleAddPreviewWithLamp}
                    onArtworkOnly={handleAddPreviewArtworkOnly}
                  />
                ) : (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    disabled={isSoldOut}
                    onClick={() =>
                      previewProduct.id !== lamp.id
                        ? handleAddPreviewArtworkOnly()
                        : handleToggleSelect(previewProduct)
                    }
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-lg transition-colors',
                      isSoldOut
                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                        : 'bg-experience-cta text-white shadow-black/30 hover:bg-experience-cta-hover dark:text-neutral-900'
                    )}
                  >
                    {previewInCart && (
                      <Package className="h-4 w-4 opacity-90" strokeWidth={2} />
                    )}
                    {addButtonLabel}
                  </motion.button>
                )}
              </div>

              {previewProduct.id !== lamp.id ? (
                <ExperienceV3ProductInfoTabs />
              ) : null}

              {editionStripProps ? (
                <ExperienceV3ProductInfoStack edition={editionStripProps} />
              ) : null}
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
            'relative z-0 w-full max-w-full shrink-0',
            'mt-6 border-t border-border pt-8 pb-10',
            'bg-experience-surface',
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
              <p className="py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
                Select an artwork to see the artist profile, or browse{' '}
                <Link
                  href="/shop/explore-artists"
                  className="text-experience-highlight/80 underline-offset-4 hover:text-experience-highlight hover:underline"
                >
                  all artists
                </Link>
                .
              </p>
            )}
          </div>
        </section>

        <ExperienceV3SplineLampSection
          image1={splineImage1}
          image2={splineImage2}
          splineBindings={experienceSplineBindings}
          onFrontSideSettled={handleFrontSideSettled}
          onInViewChange={setSplineSectionInView}
          reelScrollContainerRef={experienceScrollRootRef}
          footer={
            <ExperienceCheckoutStickyBar
              lamp={lamp}
              lampQuantity={lampQuantity}
              selectedArtworks={selectedArtworks}
              presentedProduct={previewProduct}
              orderSubtotal={orderTotal}
              stripMode="collection"
              barPosition="inline"
              hideCollectionStrip
              hideCheckoutPill
              onViewLampDetail={() => {}}
              onSelectThumbnailForSpline={handleSplineStickyThumbSelect}
              previewSelectedProductId={lampSplineFocusProductId ?? previewProduct?.id ?? null}
              lampPreviewProductIds={lampPreviewOrder}
            />
          }
        />

        {previewProduct && previewProduct.id !== lamp.id ? (
          <ExperienceV3ArtistWorksSlider
            currentProduct={previewProduct}
            catalog={allProducts}
            lampProductId={lamp.id}
            artistSlug={artistProfileTarget?.slug ?? null}
            artistVendor={artistProfileTarget?.vendor ?? previewProduct.vendor ?? null}
            previewProductId={previewProduct.id}
            cartProductIds={cartOrder}
            onPreview={handlePreviewFromPicker}
            onQuickAdd={(product) => {
              addArtworkToCart(product)
            }}
            lockedArtworkPrices={lockedArtworkPrices}
            streetLadderPrices={streetLadderPrices}
            streetPricingSeasonFallback={activeSeason === 'season2' ? 2 : 1}
          />
        ) : null}
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
              lampPreviewOrder={lampPreviewOrder}
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
              artistCatalogForFilters={artistCatalogForFilters}
              pickerLamp={lamp}
              lampQuantity={lampQuantity}
              lampPriceUsd={lampPrice}
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
          lampPreviewOrder={lampPreviewOrder}
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
          artistCatalogForFilters={artistCatalogForFilters}
          pickerLamp={lamp}
          lampQuantity={lampQuantity}
          lampPriceUsd={lampPrice}
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
                  alt={heroImageAlt}
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

      {!pickerLayoutDesktop && !splineSectionInView ? (
        <ExperienceCheckoutStickyBar
          lamp={lamp}
          lampQuantity={lampQuantity}
          selectedArtworks={selectedArtworks}
          orderSubtotal={orderTotal}
          bottomBarVariant="collectionButtonOnly"
          collectionPickerOpen={isPickerOpen}
          onCollectionButtonClick={handleTogglePicker}
          onOpenPicker={handleOpenPicker}
          onViewLampDetail={() => {}}
        />
      ) : null}

      <ExperienceV3StickyAddPanel
        scrollRootRef={experienceScrollRootRef}
        heroSectionRef={heroSectionRef}
        previewProduct={previewProduct}
        lamp={lamp}
        heroImageUrl={heroImageUrl}
        previewDisplayTitle={previewDisplayTitle}
        previewArtworkUnitUsd={previewArtworkUnitUsd}
        previewLampUnitUsd={previewLampUnitUsd}
        listPricePrimary={streetLadderBlock?.listPricePrimary}
        listPriceCompareAt={streetLadderBlock?.listPriceCompareAt}
        showLampBundleCard={showLampBundleCard}
        addButtonLabel={addButtonLabel}
        previewInCart={previewInCart}
        isSoldOut={isSoldOut}
        onAddWithLamp={handleAddPreviewWithLamp}
        onArtworkOnly={handleAddPreviewArtworkOnly}
        onPrimaryAction={() => {
          if (!previewProduct || previewProduct.id === lamp.id) return
          handleAddPreviewArtworkOnly()
        }}
      />

      <OrderBar
        lamp={lamp}
        selectedArtworks={selectedArtworks}
        lampQuantity={lampQuantity}
        onLampQuantityChange={handleLampQuantityChange}
        onAdjustArtworkQuantity={handleAdjustArtworkQuantity}
        onSelectArtwork={handleSelectArtworkFromCart}
        onViewLampDetail={() => {}}
        isGift={false}
        lockedArtworkPrices={lockedArtworkPrices}
        streetLadderPrices={streetLadderPrices}
        streetPricingSeasonFallback={activeSeason === 'season2' ? 2 : 1}
        featuredBundleCheckout={featuredArtistBundlePricingActive ? featuredBundleCheckoutPayload : null}
        bundlePricedArtworkIndices={
          featuredArtistBundlePricingActive ? bundlePricing.bundlePricedArtworkIndices : undefined
        }
        requireArtworkForLamp
      />
    </div>
  )
}
