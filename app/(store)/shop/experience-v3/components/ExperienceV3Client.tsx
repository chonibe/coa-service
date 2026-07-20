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
  EXPERIENCE_GALLERY_HERO_MOBILE_PX,
  EXPERIENCE_GALLERY_HERO_PX,
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
import { getStorePageContent } from '@/lib/content/site-content'
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
import {
  findProductByLastViewed,
  loadLastViewedArtwork,
  saveLastViewedArtwork,
} from '@/lib/shop/experience-last-viewed-artwork'
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
import { LayoutGrid, PanelRight, X, ZoomIn } from 'lucide-react'
import { getVendorCollectionHandle } from '@/lib/shopify/vendor-collection-handle'
import { experienceArtworkUnitUsd } from '@/lib/shop/experience-artwork-unit-price'
import type { ExperienceV3ArtistProfileTarget } from './ExperienceV3ArtistProfileSection'
import { ExperienceV3ArtistWorksSlider } from './ExperienceV3ArtistWorksSlider'
import { ExperienceV3LampBundleCard, type ExperienceV3BundleMode } from './ExperienceV3LampBundleCard'
import { ExperienceV3StickyAddPanel } from './ExperienceV3StickyAddPanel'
import { ExperienceV3StickyBarProductMeta } from './ExperienceV3StickyBarProductMeta'
import { ExperienceV3ProductInfoTabs } from './ExperienceV3ProductInfoTabs'
import { ExperienceV3SplineLampSection } from './ExperienceV3SplineLampSection'
import { useCartEditionHolds } from '@/lib/shop/use-cart-edition-holds'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'
import {
  cartEditionHoldExpiresAt,
  computeReservedEditionNumber,
  formatCartEditionHoldEditionLabel,
  isCartEditionHoldActive,
  resolveCartEditionHoldDisplayNumber,
} from '@/lib/shop/compute-cart-edition-reserve'
import { EditionHoldIndicator } from '../../experience-v2/components/EditionHoldIndicator'
import { ExperienceV3FomoPill } from './ExperienceV3FomoPill'
import { shopUnifiedTopBarTopInsetClass } from '@/lib/shop/shop-unified-top-bar-layout'

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

/**
 * Chunk-load placeholder for the artist bio module itself (before its JS has downloaded).
 * Must contain visible skeleton content — not just a bare bordered/bg box — since on a slow
 * connection this can be what's on-screen for a moment after the section scrolls into view.
 */
function ArtistBioModuleLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border border-border bg-background p-5 text-left">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="aspect-[4/5] max-h-56 shrink-0 rounded-lg bg-muted md:w-2/5" />
        <div className="min-w-0 flex-1 space-y-3 pt-2">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted/60" />
          <div className="h-3 w-[92%] rounded bg-muted/60" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <div className="h-8 w-24 rounded-full bg-muted" />
        <div className="h-8 w-28 rounded-full bg-muted" />
      </div>
    </div>
  )
}

const ExperienceV3ArtistProfileSection = dynamic(
  () =>
    import('./ExperienceV3ArtistProfileSection').then((m) => ({
      default: m.ExperienceV3ArtistProfileSection,
    })),
  {
    ssr: false,
    loading: () => <ArtistBioModuleLoadingSkeleton />,
  }
)

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const LOAD_MORE_PAGE_SIZE = 36
/** Persists dismissal of the mobile top-bar Collection attention nudge. */
const COLLECTION_BUTTON_CLICKED_KEY = 'experience-v3-collection-button-clicked'
const experienceV3Content = getStorePageContent('experienceV3')

function cartIncludesProductId(cartOrder: string[], productId: string): boolean {
  const productKey = normalizeShopifyProductId(productId) ?? productId
  return cartOrder.some((id) => (normalizeShopifyProductId(id) ?? id) === productKey)
}

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
  // Default is "withLamp" when no lamp is in the cart — bundle-first; visitor can switch to artwork only.
  const [bundleOfferMode, setBundleOfferMode] = useState<ExperienceV3BundleMode>('withLamp')

  // Prefer deep link (`?artwork=` → initialSelectedArtwork). Random / server pick applies only
  // when there is no deep link and no saved last-viewed (restored in an effect below).
  const [previewProduct, setPreviewProduct] = useState<ShopifyProduct | null>(() =>
    initialSelectedArtwork ??
      initialGalleryProduct ??
      pickInitialPreviewProduct(initialSeason1, initialSeason2)
  )
  const galleryProduct = useGalleryProductHydration(previewProduct, {
    initialFullProduct: initialGalleryProduct,
  })
  const [galleryIndex, setGalleryIndex] = useState(() => {
    const initial =
      initialSelectedArtwork ??
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
  const [collectionPanelExpanded, setCollectionPanelExpanded] = useState(true)
  /** Soft pulse/wiggle on mobile Collection pill until first tap (persisted). */
  const [showCollectionNudge, setShowCollectionNudge] = useState(false)
  const cartCountWhenPickerOpenedRef = useRef(0)

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLECTION_BUTTON_CLICKED_KEY) === '1') return
      setShowCollectionNudge(true)
    } catch {
      setShowCollectionNudge(true)
    }
  }, [])

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
    const sync = () => {
      const isDesktop = q.matches
      setPickerLayoutDesktop(isDesktop)
      if (isDesktop) {
        setPickerHasBeenOpened(true)
        setCollectionPanelExpanded(true)
      }
    }
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    saveExperienceCart(cartOrder, lampQuantity, lampPreviewOrder)
  }, [cartOrder, lampQuantity, lampPreviewOrder])

  const lastViewedRestoredRef = useRef(Boolean(initialSelectedArtwork))

  /** Restore last-viewed artwork when there is no `?artwork=` deep link. */
  useEffect(() => {
    if (initialSelectedArtwork) {
      lastViewedRestoredRef.current = true
      return
    }
    if (lastViewedRestoredRef.current) return

    const saved = loadLastViewedArtwork()
    if (!saved) {
      lastViewedRestoredRef.current = true
      return
    }

    const found = findProductByLastViewed(saved, [
      productsSeason1,
      productsSeason2,
      spotlightProductsFromApi,
    ])
    if (!found || found.id === lamp.id) {
      if (productsSeason1.length + productsSeason2.length > 0) {
        lastViewedRestoredRef.current = true
      }
      return
    }

    lastViewedRestoredRef.current = true
    setPreviewProduct(found)
    setGalleryIndex(getDefaultGalleryIndex(collectProductImages(found).length))
    if (found.availableForSale !== false) {
      setLampSplineFocusProductId(found.id)
    }
  }, [
    initialSelectedArtwork,
    productsSeason1,
    productsSeason2,
    spotlightProductsFromApi,
    lamp.id,
  ])

  /** Persist preview selection for the next Experience visit. */
  useEffect(() => {
    if (!lastViewedRestoredRef.current && !initialSelectedArtwork) return
    if (!previewProduct || previewProduct.id === lamp.id) return
    saveLastViewedArtwork(previewProduct)
  }, [previewProduct, lamp.id, initialSelectedArtwork])

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

  /**
   * Hero gallery view excludes the product's first/primary image when 2+ images exist — that
   * image is already shown elsewhere (e.g. bundle artwork-only overlay via
   * {@link primaryGalleryImageUrl}). Single-image products still use index 0 so the hero isn't blank.
   */
  const heroGalleryStartIndex = galleryImages.length > 1 ? 1 : 0
  const heroGalleryLength = Math.max(0, galleryImages.length - heroGalleryStartIndex)
  const heroGalleryImages = useMemo(
    () => galleryImages.slice(heroGalleryStartIndex),
    [galleryImages, heroGalleryStartIndex]
  )
  const heroGalleryUrlSets = useMemo(
    () => galleryUrlSets.slice(heroGalleryStartIndex),
    [galleryUrlSets, heroGalleryStartIndex]
  )

  useLayoutEffect(() => {
    setGalleryIndex(getDefaultGalleryIndex(galleryImages.length))
  }, [previewProduct?.id, galleryImages.length])

  useLayoutEffect(() => {
    if (galleryImages.length > 1 && galleryIndex < heroGalleryStartIndex) {
      setGalleryIndex(heroGalleryStartIndex)
    }
  }, [galleryImages.length, galleryIndex, heroGalleryStartIndex])

  const [heroViewportWidth, setHeroViewportWidth] = useState(EXPERIENCE_GALLERY_HERO_PX)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () =>
      setHeroViewportWidth(mq.matches ? EXPERIENCE_GALLERY_HERO_MOBILE_PX : EXPERIENCE_GALLERY_HERO_PX)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const heroImageUrl = useMemo(() => {
    const im =
      galleryImages[galleryIndex] ??
      galleryImages[heroGalleryStartIndex] ??
      galleryImages[0]
    if (!im?.url) return null
    return getShopifyImageUrl(im.url, heroViewportWidth) ?? im.url
  }, [galleryImages, galleryIndex, heroGalleryStartIndex, heroViewportWidth])

  /** Always the artwork's first/primary gallery image — unlike `heroImageUrl`, never follows gallery navigation. */
  const primaryGalleryImageUrl = useMemo(() => galleryUrlSets[0]?.hero ?? null, [galleryUrlSets])

  const heroImageUrlLightbox = useMemo(() => {
    const set = galleryUrlSets[galleryIndex] ?? galleryUrlSets[heroGalleryStartIndex] ?? galleryUrlSets[0]
    return set?.lightbox ?? null
  }, [galleryUrlSets, galleryIndex, heroGalleryStartIndex])

  /** Preload hero-view (+ primary for bundle overlay) as soon as product images are known. */
  useEffect(() => {
    if (galleryUrlSets.length === 0) return
    const heroUrls = [
      ...(primaryGalleryImageUrl ? [primaryGalleryImageUrl] : []),
      ...heroGalleryUrlSets.map((s) => s.hero),
    ]
    const thumbUrls = heroGalleryUrlSets.map((s) => s.thumb)
    const removeLinks = injectGalleryLinkPreloads(heroUrls, heroUrls.length)
    prefetchImageUrls(heroUrls, 'high')
    prefetchImageUrls(thumbUrls, 'auto')
    return () => {
      removeLinks()
    }
  }, [galleryProduct?.id, galleryUrlSets, heroGalleryUrlSets, primaryGalleryImageUrl])

  /** Keep current + adjacent hero URLs warm when navigating the rail (skip 1800px lightbox until zoom). */
  useEffect(() => {
    if (heroGalleryLength === 0) return
    const relativeIndex = Math.max(0, galleryIndex - heroGalleryStartIndex)
    const relativeAdjacent = getAdjacentGalleryIndices(relativeIndex, heroGalleryLength)
    const absoluteIndices = relativeAdjacent.map((i) => i + heroGalleryStartIndex)
    const heroUrls = absoluteIndices.map((i) => galleryUrlSets[i]?.hero).filter(Boolean) as string[]
    prefetchImageUrls(heroUrls, 'high')
  }, [galleryIndex, galleryUrlSets, heroGalleryLength, heroGalleryStartIndex])

  /** Warm lightbox assets when zoom opens (current hero-view image is enough; full primary stays via overlay). */
  useEffect(() => {
    if (!galleryZoomOpen || heroGalleryUrlSets.length === 0) return
    prefetchImageUrls(
      heroGalleryUrlSets.map((s) => s.lightbox),
      'high'
    )
  }, [galleryZoomOpen, heroGalleryUrlSets])

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
      minimalZoomScale: 1.06,
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
    holdsByProductId: sessionEditionHolds,
    soonestExpiry: cartEditionHoldSoonestExpiry,
  } = useCartEditionHolds({
    cartProductGids: cartOrder,
    streetEditionByProductId,
  })

  const optimisticEditionHoldsRef = useRef<Record<string, CartEditionHold>>({})

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
      const productKey = normalizeShopifyProductId(product.id) ?? product.id
      setCartOrder((prev) => {
        const exists = cartIncludesProductId(prev, product.id)
        if (exists) {
          const filtered = prev.filter(
            (id) => (normalizeShopifyProductId(id) ?? id) !== productKey
          )
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

  const handleQuickAddFromPicker = useCallback(
    (product: ShopifyProduct) => {
      if (cartIncludesProductId(cartOrder, product.id)) {
        handleToggleSelect(product)
        return
      }
      if (product.availableForSale === false) return
      setCartOrder((prev) => {
        if (cartIncludesProductId(prev, product.id)) return prev
        assignProductToLampPreview(product.id)
        return [...prev, product.id]
      })
      setLastAddedProductId(product.id)
      const variant = product.variants?.edges?.[0]?.node
      trackQuickAddToCart(product, variant, 'experience-v3-quick')
    },
    [cartOrder, handleToggleSelect, assignProductToLampPreview]
  )

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
    if (pickerLayoutDesktop) {
      setCollectionPanelExpanded(true)
    }
  }, [cartOrder.length, setPickerEngaged, spotlightData?.vendorName, spotlightArtistVendorForFilter, pickerLayoutDesktop])

  useExperienceOpenArtPicker(handleOpenPicker)

  const handleCollapseCollectionPanel = useCallback(() => {
    captureFunnelEvent(FunnelEvents.experience_picker_closed, {
      cart_count: cartOrder.length,
      added_since_open: cartOrder.length > cartCountWhenPickerOpenedRef.current,
      device_type: getDeviceType(),
    })
    setCollectionPanelExpanded(false)
  }, [cartOrder.length])

  const handleExpandCollectionPanel = useCallback(() => {
    setPickerEngaged(true)
    cartCountWhenPickerOpenedRef.current = cartOrder.length
    setPickerHasBeenOpened(true)
    captureFunnelEvent(FunnelEvents.experience_picker_opened, {
      cart_count: cartOrder.length,
      device_type: getDeviceType(),
    })
    setCollectionPanelExpanded(true)
  }, [cartOrder.length, setPickerEngaged])

  const handleToggleCollectionPanel = useCallback(() => {
    if (collectionPanelExpanded) {
      handleCollapseCollectionPanel()
    } else {
      handleExpandCollectionPanel()
    }
  }, [collectionPanelExpanded, handleCollapseCollectionPanel, handleExpandCollectionPanel])

  const handleClosePicker = useCallback(() => {
    if (pickerLayoutDesktop) {
      handleCollapseCollectionPanel()
      return
    }
    captureFunnelEvent(FunnelEvents.experience_picker_closed, {
      cart_count: cartOrder.length,
      added_since_open: cartOrder.length > cartCountWhenPickerOpenedRef.current,
      device_type: getDeviceType(),
    })
    setIsPickerOpen(false)
  }, [cartOrder.length, pickerLayoutDesktop, handleCollapseCollectionPanel])

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
    if (pickerLayoutDesktop) {
      handleToggleCollectionPanel()
      return
    }
    if (isPickerOpen) {
      handleClosePicker()
    } else {
      handleOpenPicker()
    }
  }, [
    isPickerOpen,
    handleClosePicker,
    handleOpenPicker,
    pickerLayoutDesktop,
    handleToggleCollectionPanel,
  ])

  const dismissCollectionNudge = useCallback(() => {
    setShowCollectionNudge(false)
    try {
      window.localStorage.setItem(COLLECTION_BUTTON_CLICKED_KEY, '1')
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  const handleCollectionButtonClick = useCallback(() => {
    dismissCollectionNudge()
    handleTogglePicker()
  }, [dismissCollectionNudge, handleTogglePicker])

  useEffect(() => {
    if (pickerLayoutDesktop) {
      if (collectionPanelExpanded) {
        setHeaderCenterContent(
          <div className="pointer-events-none mx-auto min-w-0 max-w-[200px] text-center text-foreground md:max-w-[320px]">
            <p className="truncate text-sm font-semibold text-foreground">Choose your Art</p>
          </div>
        )
      } else {
        setHeaderCenterContent(null)
      }
      return () => setHeaderCenterContent(null)
    }
    setHeaderCenterContent(
      <button
        type="button"
        onClick={handleCollectionButtonClick}
        className={cn(
          'flex shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors active:scale-95 outline-none sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm',
          'focus-visible:ring-2 focus-visible:ring-offset-2',
          'border-experience-cta/50 bg-transparent text-experience-cta hover:border-experience-cta/75 hover:bg-experience-cta/[0.08]',
          'focus-visible:ring-experience-cta focus-visible:ring-offset-background',
          isPickerOpen && 'ring-2 ring-experience-cta/70',
          showCollectionNudge && 'animate-collection-btn-attention'
        )}
        aria-label={isPickerOpen ? 'Close the collection picker' : 'Open the collection picker'}
        aria-expanded={isPickerOpen}
      >
        <LayoutGrid className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
        The Collection
      </button>
    )
    return () => setHeaderCenterContent(null)
  }, [
    isPickerOpen,
    pickerLayoutDesktop,
    collectionPanelExpanded,
    handleCollectionButtonClick,
    setHeaderCenterContent,
    showCollectionNudge,
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

  const previewInCart = Boolean(previewProduct && cartIncludesProductId(cartOrder, previewProduct.id))

  const lampInCart = lampQuantity > 0 || cartOrder.includes(lamp.id)

  const showLampBundleCard = Boolean(
    previewProduct &&
      previewProduct.id !== lamp.id &&
      !previewInCart &&
      !lampInCart &&
      previewProduct.availableForSale !== false
  )

  // Reset bundle toggle when the previewed artwork changes — bundle-first when no lamp in cart.
  useEffect(() => {
    setBundleOfferMode(lampInCart ? 'artworkOnly' : 'withLamp')
  }, [previewProduct?.id, showLampBundleCard, lampInCart])

  // While toggled to "Artwork only", cover the Spline viewport with a plain artwork image (desktop).
  const isBundleArtworkOnlyPreview = showLampBundleCard && bundleOfferMode === 'artworkOnly'
  const bundleArtworkOverlaySrc = isBundleArtworkOnlyPreview ? primaryGalleryImageUrl : null

  const streetRowForPreview = useMemo(() => {
    if (!previewProduct) return null
    const k = normalizeShopifyProductId(previewProduct.id)
    if (k && streetEditionByProductId[k]) return streetEditionByProductId[k]
    return streetEditionRowFromStorefrontProduct(previewProduct, {
      seasonBandsFallback: activeSeason === 'season2' ? 2 : 1,
    })
  }, [previewProduct, streetEditionByProductId, activeSeason])

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

  const nextReserveEditionPosition = useMemo(() => {
    if (!editionMetricsForWatch || previewInCart) return null
    const nextEditionNumber = Math.min(
      editionMetricsForWatch.totalEditions,
      editionMetricsForWatch.editionNumberSold + 1
    )
    if (nextEditionNumber < 1) return null
    return `${nextEditionNumber}/${editionMetricsForWatch.totalEditions}`
  }, [editionMetricsForWatch, previewInCart])

  const addButtonEditionParts = useMemo(() => {
    if (!previewProduct || previewInCart || showLampBundleCard || !nextReserveEditionPosition) {
      return null
    }
    const { prefix, suffix } = experienceV3Content.stickyAddPanel.addArtworkEditionToCart
    return {
      prefix,
      editionBadge: `#${nextReserveEditionPosition}`,
      suffix,
    }
  }, [previewProduct, previewInCart, showLampBundleCard, nextReserveEditionPosition])

  const addButtonLabel = useMemo(() => {
    if (!previewProduct) return 'Add to collection'
    if (previewInCart) return ''
    if (showLampBundleCard) {
      return bundleOfferMode === 'withLamp'
        ? experienceV3Content.bundleCard.addBundle
        : experienceV3Content.bundleCard.addArtwork
    }
    if (addButtonEditionParts) {
      return `${addButtonEditionParts.prefix}${addButtonEditionParts.editionBadge}${addButtonEditionParts.suffix}`
    }
    if (lampInCart && previewProduct.id !== lamp.id) {
      return experienceV3Content.stickyAddPanel.addEdition
    }
    return experienceV3Content.stickyAddPanel.addArtwork
  }, [
    previewProduct,
    previewInCart,
    showLampBundleCard,
    bundleOfferMode,
    addButtonEditionParts,
    lampInCart,
    lamp.id,
  ])

  const previewHoldFallbackEditionNumber = useMemo(() => {
    if (!editionMetricsForWatch) return null
    return computeReservedEditionNumber(editionMetricsForWatch.editionNumberSold, 0)
  }, [editionMetricsForWatch])

  const previewCartEditionHold = useMemo(() => {
    if (!previewProduct || !previewInCart) return null
    const key = normalizeShopifyProductId(previewProduct.id)
    if (!key) return null

    const synced = cartEditionHolds[key] ?? sessionEditionHolds[key]
    if (synced) {
      delete optimisticEditionHoldsRef.current[key]
      return synced
    }

    let optimistic = optimisticEditionHoldsRef.current[key]
    if (!optimistic || !isCartEditionHoldActive(optimistic.expiresAt)) {
      const streetRow = streetEditionByProductId[key]
      const editionsSold =
        streetRow?.editionsSold != null && Number.isFinite(streetRow.editionsSold)
          ? Math.max(0, Math.floor(streetRow.editionsSold))
          : editionMetricsForWatch?.editionNumberSold ?? null
      optimistic = {
        shopifyProductId: key,
        editionNumber:
          editionsSold != null
            ? computeReservedEditionNumber(editionsSold, 0)
            : previewHoldFallbackEditionNumber,
        lockedPriceUsd: streetRow?.priceUsd ?? null,
        expiresAt: cartEditionHoldExpiresAt(),
      }
      optimisticEditionHoldsRef.current[key] = optimistic
    }

    return optimistic
  }, [
    previewProduct,
    previewInCart,
    cartEditionHolds,
    sessionEditionHolds,
    streetEditionByProductId,
    editionMetricsForWatch?.editionNumberSold,
    previewHoldFallbackEditionNumber,
  ])

  const reserveEditionLabel = useMemo(() => {
    if (!previewProduct || previewProduct.id === lamp.id) return null

    if (previewInCart) {
      const displayNumber = previewCartEditionHold
        ? resolveCartEditionHoldDisplayNumber(previewCartEditionHold, previewHoldFallbackEditionNumber)
        : previewHoldFallbackEditionNumber
      if (displayNumber == null) return null
      const total = editionMetricsForWatch?.totalEditions
      if (total != null && total > 0) {
        return `Edition #${displayNumber}/${total}`
      }
      return formatCartEditionHoldEditionLabel(displayNumber)
    }

    if (!editionMetricsForWatch) return null
    const nextEditionNumber = Math.min(
      editionMetricsForWatch.totalEditions,
      editionMetricsForWatch.editionNumberSold + 1
    )
    if (nextEditionNumber < 1) return null
    return `Reserving #${nextEditionNumber}/${editionMetricsForWatch.totalEditions}`
  }, [
    editionMetricsForWatch,
    previewProduct,
    lamp.id,
    previewInCart,
    previewCartEditionHold,
    previewHoldFallbackEditionNumber,
  ])

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

  const showArtistWorksSlider = Boolean(previewProduct && previewProduct.id !== lamp.id)

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
    setGalleryIndex(getDefaultGalleryIndex(galleryImages.length))
  }, [previewProduct?.id, galleryImages])

  const touchGalleryInteraction = useCallback(() => {
    autoRotatePauseUntil.current = Date.now() + 14000
  }, [])

  useEffect(() => {
    // Need at least two hero-view images (i.e. 3+ product images, or 2 with start at 1) to rotate.
    if (heroGalleryLength <= 1) return
    const id = window.setInterval(() => {
      if (Date.now() < autoRotatePauseUntil.current) return
      setGalleryIndex((i) => {
        const start = heroGalleryStartIndex
        const len = heroGalleryLength
        const relative = Math.max(0, i - start)
        return start + ((relative + 1) % len)
      })
    }, 5000)
    return () => clearInterval(id)
  }, [heroGalleryLength, heroGalleryStartIndex, previewProduct?.id])

  useEffect(() => {
    setGalleryZoomOpen(false)
  }, [previewProduct?.id])

  const artistCatalogForFilters = useExperienceArtistCatalog()

  /** Desktop push panel open — hero uses the tighter gallery/copy split tuned for the right rail. */
  const desktopCollectionRailOpen = pickerLayoutDesktop && collectionPanelExpanded

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-background text-foreground">
      <div className="flex min-h-0 flex-1 min-w-0 flex-row">
        <div
          ref={experienceScrollRootRef}
          data-experience-scroll-root
          className={cn(
            /* overflow-x-clip preferred; with overflow-y-auto CSS may compute x to hidden — still OK */
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip',
            /* Main column scroll — distinct from nested product column overflow-y-auto */
            'touch-pan-y overflow-y-auto overscroll-y-contain pb-28 lg:pb-32 [-webkit-overflow-scrolling:touch]'
          )}
        >
        <section
          ref={heroSectionRef}
          id="experience-v3-hero"
          aria-labelledby="experience-v3-hero-heading"
          className={cn(
            'flex min-h-0 w-full max-w-full shrink-0 grow-0 flex-col',
            'min-w-0 max-md:max-h-none',
            /* md:flex-row: gallery left, copy right on desktop; DOM order keeps image-first mobile stacking. */
            'md:h-[82svh] md:min-h-[560px] md:w-full md:flex-row md:items-stretch md:justify-start'
          )}
        >
        <h2 id="experience-v3-hero-heading" className="sr-only">
          Artwork and details
        </h2>

        {/* Gallery — full-bleed on mobile; ~58% of hero on desktop when the collection rail is open; grows to absorb free width when the rail is collapsed. */}
        <div
          className={cn(
            'flex w-full max-w-[100vw] flex-col items-stretch md:h-full md:min-w-0',
            desktopCollectionRailOpen
              ? 'md:w-[min(58%,52rem)] md:shrink-0'
              : 'md:flex-1 md:max-w-none'
          )}
        >
          <div className="relative w-full md:h-full md:[container-type:size]">
            <div className="relative isolate w-full max-md:overflow-visible md:flex md:h-full md:items-center md:justify-start">
              {heroImageUrl ? (
                <div
                  className={cn(
                    'relative z-[2] overflow-hidden',
                    'aspect-square max-md:w-full max-md:max-h-[min(72svh,780px)]',
                    'md:aspect-square md:h-[min(100cqw,100cqh)] md:w-[min(100cqw,100cqh)] md:max-h-full md:max-w-full'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setGalleryZoomOpen(true)}
                    className="absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/90"
                    aria-label="Zoom image"
                  >
                    <ZoomIn className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                  <Image
                    key={`${galleryProduct?.id ?? 'gallery'}-${galleryIndex}`}
                    src={heroImageUrl}
                    alt={heroImageAlt}
                    fill
                    className="object-cover"
                    sizes={
                      desktopCollectionRailOpen
                        ? '(max-width: 767px) 100vw, 58vw'
                        : '(max-width: 767px) 100vw, 72vw'
                    }
                    unoptimized
                    priority={galleryIndex === getDefaultGalleryIndex(galleryImages.length)}
                    fetchPriority="high"
                  />
                  {heroGalleryLength > 1 ? (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/45 via-black/15 to-transparent px-3 pb-2.5 pt-8">
                      <div className="flex justify-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {heroGalleryImages.map((im, relativeI) => {
                          const absoluteI = relativeI + heroGalleryStartIndex
                          const u =
                            galleryUrlSets[absoluteI]?.thumb ??
                            (getShopifyImageUrl(im.url, EXPERIENCE_GALLERY_THUMB_PX) ?? im.url)
                          const selected = galleryIndex === absoluteI
                          const isNearActive = Math.abs(absoluteI - galleryIndex) <= 2
                          return (
                            <button
                              key={`${im.url}-${absoluteI}`}
                              type="button"
                              onClick={() => {
                                touchGalleryInteraction()
                                setGalleryIndex(absoluteI)
                              }}
                              aria-label={`Show gallery image ${relativeI + 1} of ${heroGalleryLength}`}
                              aria-current={selected ? 'true' : undefined}
                              className={cn(
                                /* Ring lives on the button; image clips inside an inset layer so the ring
                                   stays fully visible (not covered by object-cover fill / parent overflow). */
                                'relative aspect-square w-7 shrink-0 rounded-sm transition-opacity sm:w-8',
                                selected
                                  ? 'opacity-100 ring-1 ring-inset ring-white/90'
                                  : 'opacity-60 ring-1 ring-inset ring-white/35 hover:opacity-80'
                              )}
                            >
                              <span className="pointer-events-none absolute inset-[1.5px] overflow-hidden rounded-[1px]">
                                <Image
                                  src={u}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                  loading="eager"
                                  fetchPriority={selected || isNearActive ? 'high' : 'auto'}
                                  unoptimized
                                />
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center px-6 text-center text-sm text-muted-foreground',
                    'aspect-square max-md:w-full max-md:max-h-[min(72svh,780px)]',
                    'md:h-full md:w-full'
                  )}
                >
                  No images for this artwork yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product copy — flex-1 beside gallery; centers badges/title/edition strip in the column (panel open or collapsed). */}
        <div
          ref={artworkScrollRef}
          data-experience-artwork-scroll
          className={cn(
            'flex w-full shrink-0 flex-col overflow-x-clip',
            'relative z-10 max-md:flex-none max-md:bg-background max-md:overflow-visible',
            'md:flex md:h-full md:min-w-0 md:flex-1 md:flex-col md:items-center md:justify-center md:overflow-visible',
            !desktopCollectionRailOpen && 'md:px-4 xl:px-8'
          )}
        >
          {previewProduct && pDetail ? (
            <div
              className={cn(
                'mx-auto flex w-auto flex-col items-center gap-4 py-6 pb-8',
                'md:gap-5 md:py-0'
              )}
            >
              <header className="w-auto space-y-2.5 pb-1 text-center">
                {!previewInCart && reserveEditionLabel ? (
                  <ExperienceV3StickyBarProductMeta
                    reserveEditionLabel={reserveEditionLabel}
                    align="center"
                    className="pb-0.5"
                  />
                ) : null}
                {previewInCart && previewCartEditionHold ? (
                  <div className="flex w-auto justify-center">
                    <EditionHoldIndicator
                      hold={previewCartEditionHold}
                      inCart
                      fallbackEditionNumber={previewHoldFallbackEditionNumber}
                      variant="banner"
                      className="mx-auto"
                    />
                  </div>
                ) : previewInCart && reserveEditionLabel ? (
                  <ExperienceV3StickyBarProductMeta
                    reserveEditionLabel={reserveEditionLabel}
                    align="center"
                    className="pb-0.5"
                  />
                ) : null}
                <ExperienceV3FomoPill
                  productId={previewProduct.id}
                  previewInCart={previewInCart}
                  className="pb-0.5"
                />
                {artistProfileTarget ? (
                  <button
                    type="button"
                    onClick={scrollToArtistBio}
                    className="mx-auto block text-[11px] font-medium uppercase tracking-widest text-muted-foreground underline-offset-4 transition-colors hover:text-experience-highlight hover:underline md:text-xs"
                  >
                    {editionArtistName}
                  </button>
                ) : (
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground md:text-xs">
                    {editionArtistName}
                  </p>
                )}
                <h1 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-experience-title md:text-3xl lg:text-4xl">
                  {previewDisplayTitle}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {isSoldOut ? (
                    <span className="rounded bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive md:text-xs">
                      Sold out
                    </span>
                  ) : null}
                  {isNewDropPreview && !isSoldOut ? (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border md:text-xs">
                      New drop
                    </span>
                  ) : null}
                  {isEarlyAccessPreview && !isSoldOut ? (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground ring-1 ring-border md:text-xs">
                      Early access
                    </span>
                  ) : null}
                  {previewProduct.id !== lamp.id &&
                  spotlightData &&
                  productMatchesSpotlight(previewProduct, spotlightData) ? (
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border md:text-xs">
                      Featured artist
                    </span>
                  ) : null}
                </div>
              </header>

              {editionStripProps ? (
                <div className="w-auto overflow-visible rounded-xl border border-border bg-experience-surface/60">
                  <ExperienceV3EditionStrip {...editionStripProps} />
                </div>
              ) : null}

            </div>
          ) : null}
        </div>
        </section>

        <div className="hidden md:block">
        <ExperienceV3SplineLampSection
          image1={splineImage1}
          image2={splineImage2}
          splineBindings={experienceSplineBindings}
          onFrontSideSettled={handleFrontSideSettled}
          reelScrollContainerRef={experienceScrollRootRef}
          artworkOverlaySrc={bundleArtworkOverlaySrc}
          artworkOverlayAlt={previewDisplayTitle ?? 'Artwork preview'}
          sideContent={
            showLampBundleCard && previewProduct ? (
              <ExperienceV3LampBundleCard
                lamp={lamp}
                artwork={previewProduct}
                disabled={isSoldOut}
                onAddWithLamp={handleAddPreviewWithLamp}
                onArtworkOnly={handleAddPreviewArtworkOnly}
                artistName={editionArtistName}
                mode={bundleOfferMode}
                onModeChange={setBundleOfferMode}
              />
            ) : undefined
          }
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
        </div>

        {previewProduct && previewProduct.id !== lamp.id ? (
          <section
            id="experience-v3-product-info"
            aria-labelledby="experience-v3-product-info-heading"
            className="relative z-0 w-full shrink-0 border-t border-border bg-background px-3 py-6 md:px-6 md:py-8"
          >
            <h2 id="experience-v3-product-info-heading" className="sr-only">
              Product details
            </h2>
            <div className="mx-auto w-full max-w-[min(100%,1200px)]">
              <ExperienceV3ProductInfoTabs />
            </div>
          </section>
        ) : null}

        {showArtistWorksSlider ? (
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
              if (cartIncludesProductId(cartOrder, product.id)) {
                handleToggleSelect(product)
                return
              }
              addArtworkToCart(product)
            }}
            lockedArtworkPrices={lockedArtworkPrices}
            streetLadderPrices={streetLadderPrices}
            streetPricingSeasonFallback={activeSeason === 'season2' ? 2 : 1}
          />
        ) : null}

        {/* Artist region: full width of scroll column only — avoid w-screen / negative vw margins (breaks flow in nested flex). */}
        <section
          ref={artistBioSectionRef}
          id="experience-v3-artist-bio"
          aria-labelledby="experience-v3-artist-heading"
          className={cn(
            'relative z-0 w-full max-w-full shrink-0',
            'bg-experience-surface pb-10 md:pb-12',
            'scroll-mt-[max(4.5rem,env(safe-area-inset-top))]',
            !showArtistWorksSlider && 'mt-6 border-t border-border pt-8 md:mt-8 md:pt-10'
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

        </div>
        {pickerLayoutDesktop && (
          <>
            <button
              type="button"
              onClick={handleToggleCollectionPanel}
              className={cn(
                'fixed right-0 z-[130] hidden h-8 w-8 items-center justify-center rounded-l-md transition-colors lg:flex',
                shopUnifiedTopBarTopInsetClass,
                'border border-r-0 border-border/80 bg-white text-experience-cta shadow-sm',
                'hover:bg-neutral-50',
                'dark:border-transparent dark:bg-experience-cta dark:!text-neutral-900 dark:shadow-md',
                'dark:hover:bg-experience-cta-hover',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-cta focus-visible:ring-offset-2'
              )}
              aria-label={collectionPanelExpanded ? 'Hide collection panel' : 'Show collection panel'}
              aria-expanded={collectionPanelExpanded}
            >
              <PanelRight className="h-3.5 w-3.5 shrink-0 text-current" strokeWidth={2.25} aria-hidden />
            </button>
            <div
              className={cn(
                'hidden h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out lg:flex',
                collectionPanelExpanded ? 'w-[min(440px,40vw)]' : 'w-0'
              )}
            >
              <ArtworkPickerSheet
                presentation="pushPanel"
                showDoneButton={false}
                showPanelCollapseToggle={false}
                isOpen
                onClose={handleCollapseCollectionPanel}
                products={filteredProducts}
                selectedArtworks={selectedArtworks}
                lampPreviewOrder={lampPreviewOrder}
                onToggleSelect={handleToggleSelect}
                lastAddedProductId={lastAddedProductId}
                hasMore={hasMore}
                isLoadingMore={loadingMore}
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
                lockedArtworkPrices={lockedArtworkPrices}
                streetLadderPrices={streetLadderPrices}
                sheetVariant="rightRail"
              />
            </div>
          </>
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
          isLoadingMore={loadingMore}
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
          lockedArtworkPrices={lockedArtworkPrices}
          streetLadderPrices={streetLadderPrices}
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

      <ExperienceV3StickyAddPanel
        scrollRootRef={experienceScrollRootRef}
        previewProduct={previewProduct}
        lamp={lamp}
        heroImageUrl={heroImageUrl}
        previewDisplayTitle={previewDisplayTitle}
        artistName={editionArtistName}
        reserveEditionLabel={reserveEditionLabel}
        cartEditionHold={previewCartEditionHold}
        cartEditionHoldFallbackNumber={previewHoldFallbackEditionNumber}
        addButtonLabel={addButtonLabel}
        addButtonEditionParts={addButtonEditionParts}
        previewInCart={previewInCart}
        isSoldOut={isSoldOut}
        onOpenCollection={handleCollectionButtonClick}
        collectionPickerOpen={isPickerOpen}
        bundleOffer={
          showLampBundleCard
            ? {
                mode: bundleOfferMode,
                onModeChange: setBundleOfferMode,
                artworkUnitUsd: previewArtworkUnitUsd,
                lampUnitUsd: previewLampUnitUsd,
                listPriceCompareAt: streetLadderBlock?.listPriceCompareAt ?? null,
              }
            : undefined
        }
        priceMeta={
          previewProduct && previewProduct.id !== lamp.id
            ? {
                primary:
                  streetLadderBlock?.listPricePrimary ??
                  (previewArtworkUnitUsd > 0 ? `$${formatPriceCompact(previewArtworkUnitUsd)}` : null),
                compareAt: streetLadderBlock?.listPriceCompareAt ?? null,
                nextStepChip: streetLadderBlock?.nextStepChip ?? null,
              }
            : undefined
        }
        onPrimaryAction={() => {
          if (!previewProduct || previewProduct.id === lamp.id || previewInCart) return
          if (showLampBundleCard && bundleOfferMode === 'withLamp') {
            handleAddPreviewWithLamp()
            return
          }
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
