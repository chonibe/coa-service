import { Suspense } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  getProduct,
  getCollectionWithListProducts,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { getAffiliateArtistSlugFromSearchParams, AFFILIATE_ARTIST_COOKIE_NAME } from '@/lib/affiliate-tracking'
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
  searchParams: Promise<{ artist?: string; skipQuiz?: string; utm_campaign?: string }>
}

interface SeasonPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

async function ExperienceProductsLoader({
  lamp,
  initialArtistSlug,
  skipQuiz,
}: {
  lamp: ShopifyProduct
  initialArtistSlug?: string
  skipQuiz: boolean
}) {
  const [season1Result, season2Result, ...spotlightResults] = await Promise.all([
    getCollectionWithListProducts(SEASON_1_HANDLE, {
      first: INITIAL_PRODUCTS_PER_SEASON,
    }).catch(() => null),
    getCollectionWithListProducts(SEASON_2_HANDLE, {
      first: INITIAL_PRODUCTS_PER_SEASON,
    }).catch(() => null),
    ...SPOTLIGHT_COLLECTIONS_IN_SEASON2.map((h) =>
      getCollectionWithListProducts(h, { first: 12 }).catch(() => null)
    ),
  ])

  const productsSeason1 = season1Result?.products?.edges?.map((e) => e.node) ?? []
  const baseSeason2 = season2Result?.products?.edges?.map((e) => e.node) ?? []
  const season2Ids = new Set(baseSeason2.map((p) => p.id))
  const spotlightProducts: ShopifyProduct[] = []
  for (const col of spotlightResults as Awaited<ReturnType<typeof getCollectionWithListProducts>>[]) {
    const nodes = col?.products?.edges?.map((e) => e.node).filter(
      (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
    ) ?? []
    for (const p of nodes) {
      if (!season2Ids.has(p.id)) {
        season2Ids.add(p.id)
        spotlightProducts.push(p)
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
  const fromCookie = cookieStore.get(AFFILIATE_ARTIST_COOKIE_NAME)?.value?.trim()
  const initialArtistSlug = (fromParams ?? fromCookie) || undefined
  const skipQuiz = resolved?.skipQuiz === '1'

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
