import { Suspense } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getCollectionProductHandlesByHandle } from '@/lib/shopify/admin-collection-products'
import {
  getProduct,
  getCollectionWithListProducts,
  getProductsByHandles,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { getAffiliateArtistSlugFromSearchParams, AFFILIATE_ARTIST_COOKIE_NAME, AFFILIATE_DISMISSED_COOKIE_NAME, AFFILIATE_PRODUCT_COOKIE_NAME } from '@/lib/affiliate-tracking'
import { ExperienceClient } from './components/ExperienceClient'
import { ExperienceLoadingSkeleton } from './loading'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Customize Your Lamp | Street Collector',
  description:
    'Build your Street Lamp with artwork you love. Preview art live on the 3D lamp and checkout in one tap.',
}

const SEASON_1_HANDLE = 'season-1'
const SEASON_2_HANDLE = '2025-edition'
const INITIAL_PRODUCTS_PER_SEASON = 36
/** Artist collections to merge into Season 2 so their artworks appear in the selector */
const SPOTLIGHT_COLLECTIONS_IN_SEASON2 = ['tyler-shelton'] as const

interface ExperiencePageProps {
  searchParams: Promise<{ artist?: string; skipQuiz?: string; utm_campaign?: string; unlisted?: string }>
}

interface SeasonPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

async function ExperienceProductsLoader({
  lamp,
  initialArtistSlug,
  skipQuiz,
  forceUnlisted,
}: {
  lamp: ShopifyProduct
  initialArtistSlug?: string
  skipQuiz: boolean
  forceUnlisted?: boolean
}) {
  // When user has direct link (?artist=handle), include that collection so its products appear in the selector (e.g. unlisted)
  const extraHandles = initialArtistSlug
    ? [initialArtistSlug, `${initialArtistSlug}-one`]
    : []
  const collectionsToMerge = [...new Set([...SPOTLIGHT_COLLECTIONS_IN_SEASON2, ...extraHandles])]
  const [season1Result, season2Result, ...spotlightResults] = await Promise.all([
    getCollectionWithListProducts(SEASON_1_HANDLE, {
      first: INITIAL_PRODUCTS_PER_SEASON,
    }).catch(() => null),
    getCollectionWithListProducts(SEASON_2_HANDLE, {
      first: INITIAL_PRODUCTS_PER_SEASON,
    }).catch(() => null),
    ...collectionsToMerge.map((h) =>
      getCollectionWithListProducts(h, { first: 12 }).catch(() => null)
    ),
  ])

  const productsSeason1 = season1Result?.products?.edges?.map((e) => e.node) ?? []
  const baseSeason2 = season2Result?.products?.edges?.map((e) => e.node) ?? []
  const season2Ids = new Set(baseSeason2.map((p) => p.id))
  const spotlightProducts: ShopifyProduct[] = []
  const collectionResults = spotlightResults as Awaited<ReturnType<typeof getCollectionWithListProducts>>[]
  for (const col of collectionResults) {
    const nodes = col?.products?.edges?.map((e) => e.node).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    ) ?? []
    for (const p of nodes) {
      if (!season2Ids.has(p.id)) {
        season2Ids.add(p.id)
        spotlightProducts.push(p)
      }
    }
    // Unlisted products are omitted from collection.products in Storefront API; fetch by handle
    let handles: string[] = []
    const handlesStr = col?.productHandlesMetafield?.value?.trim()
    if (handlesStr) {
      handles = handlesStr.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    }
    if (handles.length === 0 && col?.handle) {
      // No metafield: use Admin API to get product handles (includes unlisted) for early-access collections
      handles = await getCollectionProductHandlesByHandle(col.handle)
    }
    if (handles.length > 0) {
      try {
        const byHandles = await getProductsByHandles(handles)
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
  const productsSeason2 = [...spotlightProducts, ...baseSeason2]

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
      forceUnlisted={forceUnlisted}
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
  const forceUnlisted = ['1', 'true', 'yes'].includes((resolved?.unlisted ?? '').toLowerCase())

  const lamp = await getProduct('street_lamp').catch(() => null)

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
        forceUnlisted={forceUnlisted}
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
