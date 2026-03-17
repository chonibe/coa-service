import { Suspense } from 'react'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { cookies, headers } from 'next/headers'
import type { Metadata } from 'next'
import { getCollectionProductHandlesByHandle } from '@/lib/shopify/admin-collection-products'
import {
  getProduct,
  getCollectionWithListProducts,
  getProductsByHandles,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { getAdPreset } from '@/lib/experience/ad-presets'
import { getAffiliateArtistSlugFromSearchParams, AFFILIATE_ARTIST_COOKIE_NAME, AFFILIATE_DISMISSED_COOKIE_NAME, AFFILIATE_PRODUCT_COOKIE_NAME } from '@/lib/affiliate-tracking'
import { ExperienceClient } from './components/ExperienceClient'
import { ExperienceLoadingSkeleton } from './loading'

// force-dynamic is required because cookies() is called for affiliate tracking.
// Product data is cached via unstable_cache (5-min TTL) to bypass the force-dynamic
// fetch-cache override — this is the key fix for LCP: Shopify fetches are served from
// cache on subsequent requests instead of hitting the API cold every time.
export const dynamic = 'force-dynamic'

// Cached Shopify product fetches — survive force-dynamic at the page level.
const getCachedLamp = unstable_cache(
  () => getProduct('street_lamp'),
  ['experience-lamp'],
  { revalidate: 300, tags: ['experience-products'] }
)

const getCachedSeasonCollections = unstable_cache(
  () =>
    Promise.all([
      getCollectionWithListProducts('season-1', { first: 36 }).catch((err) => {
        console.error('[experience] Failed to fetch season-1 collection:', err?.message ?? err)
        return null
      }),
      getCollectionWithListProducts('2025-edition', { first: 36 }).catch((err) => {
        console.error('[experience] Failed to fetch 2025-edition collection:', err?.message ?? err)
        return null
      }),
    ]),
  ['experience-season-collections'],
  { revalidate: 300, tags: ['experience-products'] }
)

const DEFAULT_TITLE = 'Customize Your Lamp | Street Collector'
const DEFAULT_DESCRIPTION =
  'Build your Street Lamp with artwork you love. Preview art live on the 3D lamp and checkout in one tap.'

/** Build base URL for server-side fetch (OG image URLs must be absolute) */
async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL || ''
}

export async function generateMetadata(props: {
  searchParams: Promise<{ artist?: string; vendor?: string; [key: string]: string | undefined }>
}): Promise<Metadata> {
  const searchParams = await props.searchParams
  const artistSlug = searchParams?.artist?.trim() || searchParams?.vendor?.trim()
  if (!artistSlug) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    }
  }

  const base = await getBaseUrl()
  if (!base) {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
  }

  try {
    const res = await fetch(`${base}/api/shop/artist-spotlight?artist=${encodeURIComponent(artistSlug)}`, {
      next: { revalidate: 60 },
    })
    const spotlight = res.ok ? (await res.json()) : null
    if (!spotlight?.vendorName) {
      return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
    }

    const titleSuffix = ' | Street Collector'
    const isEarlyAccess = Boolean(spotlight.unlisted)
    const title = isEarlyAccess
      ? `Early access — ${spotlight.vendorName}${titleSuffix}`
      : `Artist Spotlight — ${spotlight.vendorName}${titleSuffix}`
    const description =
      spotlight.bio?.replace(/\s+/g, ' ').trim().slice(0, 160) ||
      (isEarlyAccess
        ? `Early access to artworks by ${spotlight.vendorName}. Customize your Street Lamp with their art.`
        : `Artist spotlight: ${spotlight.vendorName}. Build your Street Lamp with their artwork.`)

    const imageUrl = spotlight.image?.startsWith('http')
      ? spotlight.image
      : spotlight.image && base
        ? `${base}${spotlight.image.startsWith('/') ? '' : '/'}${spotlight.image}`
        : undefined

    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: spotlight.vendorName }] }),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imageUrl && { images: [imageUrl] }),
      },
    }
    return metadata
  } catch {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }
  }
}

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const INITIAL_PRODUCTS_PER_SEASON = 36
/** Extra collections to merge into Season 2 (e.g. for ?artist= only; spotlight is derived from Season 2 latest 2) */
const SPOTLIGHT_COLLECTIONS_IN_SEASON2: readonly string[] = []

interface ExperiencePageProps {
  searchParams: Promise<{ artist?: string; skipQuiz?: string; direct?: string; preset?: string; utm_campaign?: string; unlisted?: string; fromOnboardingLogin?: string }>
}

interface SeasonPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

async function ExperienceProductsLoader({
  lamp,
  initialArtistSlug,
  skipQuiz,
  directEntry,
  adPreset,
  forceUnlisted,
  onboardingQueryParams,
  fromOnboardingLogin,
}: {
  lamp: ShopifyProduct
  initialArtistSlug?: string
  skipQuiz: boolean
  directEntry?: boolean
  adPreset?: string
  forceUnlisted?: boolean
  onboardingQueryParams?: Record<string, string>
  fromOnboardingLogin?: boolean
}) {
  // When user has direct link (?artist=handle), include that collection so its products appear in the selector (e.g. unlisted)
  const extraHandles = initialArtistSlug
    ? [initialArtistSlug, `${initialArtistSlug}-one`]
    : []
  const collectionsToMerge = [...new Set([...SPOTLIGHT_COLLECTIONS_IN_SEASON2, ...extraHandles])]

  // Use cached base season collections when no artist-specific collections are needed.
  // For artist/spotlight links, fall back to uncached fetches (per-request, personalised).
  const useBaseCache = collectionsToMerge.length === 0
  let season1Result: Awaited<ReturnType<typeof getCollectionWithListProducts>> | null
  let season2Result: Awaited<ReturnType<typeof getCollectionWithListProducts>> | null
  let spotlightResults: (Awaited<ReturnType<typeof getCollectionWithListProducts>> | null)[]

  if (useBaseCache) {
    const [s1, s2] = await getCachedSeasonCollections()
    season1Result = s1
    season2Result = s2
    spotlightResults = []
  } else {
    const results = await Promise.all([
      getCollectionWithListProducts(SEASON_1_HANDLE, { first: INITIAL_PRODUCTS_PER_SEASON }).catch(() => null),
      getCollectionWithListProducts(SEASON_2_HANDLE, { first: INITIAL_PRODUCTS_PER_SEASON }).catch(() => null),
      ...collectionsToMerge.map((h) =>
        getCollectionWithListProducts(h, { first: 12 }).catch(() => null)
      ),
    ])
    ;[season1Result, season2Result, ...spotlightResults] = results
  }

  const productsSeason1 = season1Result?.products?.edges?.map((e) => e.node) ?? []
  const baseSeason2 = season2Result?.products?.edges?.map((e) => e.node) ?? []
  const season2Ids = new Set(baseSeason2.map((p) => p.id))
  const spotlightProducts: ShopifyProduct[] = []
  const collectionResults = spotlightResults as Awaited<ReturnType<typeof getCollectionWithListProducts>>[]
  const earlyAccessHandles = new Set(extraHandles)
  for (let i = 0; i < collectionResults.length; i++) {
    const col = collectionResults[i]
    const collectionHandle = collectionsToMerge[i]
    const isEarlyAccessCollection = earlyAccessHandles.has(collectionHandle)
    const nodes = col?.products?.edges?.map((e) => e.node).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    ) ?? []
    for (const p of nodes) {
      if (!season2Ids.has(p.id)) {
        season2Ids.add(p.id)
        spotlightProducts.push(p)
      }
    }
    // Only fetch via Admin/COA for early-access (?artist=) collections; normal experience shows Online Store channel only
    if (!isEarlyAccessCollection) continue
    let handles: string[] = []
    const handlesStr = col?.productHandlesMetafield?.value?.trim()
    if (handlesStr) {
      handles = handlesStr.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    }
    if (handles.length === 0 && col?.handle) {
      handles = await getCollectionProductHandlesByHandle(col.handle)
    }
    if (handles.length > 0) {
      try {
        const byHandles = await getProductsByHandles(handles, { preferPrivateToken: true })
        for (const p of byHandles) {
          if (p.handle === 'street_lamp' || p.handle?.startsWith('street-lamp')) continue
          if (season2Ids.has(p.id)) continue
          season2Ids.add(p.id)
          spotlightProducts.push(p)
        }
      } catch {
        // ignore
      }
    }
  }
  let productsSeason2 = [...spotlightProducts, ...baseSeason2]

  // When ?preset= is set, ensure preset products are loaded so the bundle grid is never empty
  if (adPreset?.trim()) {
    const preset = getAdPreset(adPreset.trim())
    if (preset?.handles?.length) {
      try {
        const byHandles = await getProductsByHandles(preset.handles, { preferPrivateToken: true })
        const season2IdSet = new Set(productsSeason2.map((p) => p.id))
        const presetOnly = byHandles.filter(
          (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp') && !season2IdSet.has(p.id)
        )
        if (presetOnly.length > 0) {
          productsSeason2 = [...presetOnly, ...productsSeason2]
        }
      } catch {
        // ignore
      }
    }
  }

  const pageInfoSeason1: SeasonPageInfo = {
    hasNextPage: season1Result?.products?.pageInfo?.hasNextPage ?? false,
    endCursor: season1Result?.products?.pageInfo?.endCursor ?? null,
  }
  const pageInfoSeason2: SeasonPageInfo = {
    hasNextPage: season2Result?.products?.pageInfo?.hasNextPage ?? false,
    endCursor: season2Result?.products?.pageInfo?.endCursor ?? null,
  }

  return (
    <ExperienceClient
      lamp={lamp}
      productsSeason1={productsSeason1}
      productsSeason2={productsSeason2}
      pageInfoSeason1={pageInfoSeason1}
      pageInfoSeason2={pageInfoSeason2}
      initialArtistSlug={initialArtistSlug}
      skipQuiz={skipQuiz}
      directEntry={directEntry}
      adPreset={adPreset}
      forceUnlisted={forceUnlisted}
      onboardingQueryParams={onboardingQueryParams}
      fromOnboardingLogin={fromOnboardingLogin}
    />
  )
}

async function ExperienceLampLoader({ searchParams }: ExperiencePageProps) {
  const resolved = await searchParams
  const fromParams = getAffiliateArtistSlugFromSearchParams({
    artist: resolved?.artist,
    utm_campaign: resolved?.utm_campaign,
  })
  const cookieStore = await cookies()
  const dismissed = cookieStore.get(AFFILIATE_DISMISSED_COOKIE_NAME)?.value
  const fromCookie = dismissed ? undefined : cookieStore.get(AFFILIATE_ARTIST_COOKIE_NAME)?.value?.trim()
  let initialArtistSlug = (fromParams ?? fromCookie) || undefined

  // When user landed on /products/:handle without artist/utm (e.g. ?fbclid= only), resolve artist from product vendor
  if (!initialArtistSlug && !dismissed) {
    const productHandle = cookieStore.get(AFFILIATE_PRODUCT_COOKIE_NAME)?.value?.trim()
    if (productHandle) {
      const product = await getProduct(productHandle).catch(() => null)
      if (product?.vendor) {
        initialArtistSlug = product.vendor
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/^-|-$/g, '') || undefined
      }
    }
  }

  const skipQuiz = resolved?.skipQuiz === '1'
  const directEntry = resolved?.direct === '1'
  const adPreset = resolved?.preset?.trim() || undefined
  const forceUnlisted = ['1', 'true', 'yes'].includes((resolved?.unlisted ?? '').toLowerCase())
  const fromOnboardingLogin = resolved?.fromOnboardingLogin === '1'

  const onboardingQueryParams: Record<string, string> = {}
  if (resolved?.artist) onboardingQueryParams.artist = resolved.artist
  if (resolved?.utm_campaign) onboardingQueryParams.utm_campaign = resolved.utm_campaign
  if (resolved?.vendor) onboardingQueryParams.vendor = resolved.vendor

  const lamp = await getCachedLamp().catch(() => null)

  if (!lamp) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3 text-white dark:text-[#FFBA94]">Unavailable</h1>
          <p className="text-neutral-400 mb-6">
            Could not load the lamp product. Please try again later.
          </p>
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
    <Suspense fallback={<ExperienceLoadingSkeleton />}>
      <ExperienceProductsLoader
        lamp={lamp}
        initialArtistSlug={initialArtistSlug}
        skipQuiz={skipQuiz}
        directEntry={directEntry}
        adPreset={adPreset}
        forceUnlisted={forceUnlisted}
        onboardingQueryParams={onboardingQueryParams}
        fromOnboardingLogin={fromOnboardingLogin}
      />
    </Suspense>
  )
}

export default function ExperiencePage(props: ExperiencePageProps) {
  return (
    <Suspense fallback={<ExperienceLoadingSkeleton />}>
      <ExperienceLampLoader {...props} />
    </Suspense>
  )
}
