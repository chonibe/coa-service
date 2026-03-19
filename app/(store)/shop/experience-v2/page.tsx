import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import {
  getProduct,
  getSeasonCollections,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { ExperienceV2ClientLoader } from './components/ExperienceV2ClientLoader'

export const dynamic = 'force-dynamic'

const getCachedLamp = unstable_cache(
  () => getProduct('street_lamp'),
  ['experience-v2-lamp'],
  { revalidate: 300, tags: ['experience-products'] }
)

const getCachedSeasonCollections = unstable_cache(
  () => getSeasonCollections('season-1', '2025-edition', { first: 24 }),
  ['experience-v2-season-collections'],
  { revalidate: 300, tags: ['experience-products'] }
)

export const metadata: Metadata = {
  title: 'Experience V2 | Street Collector',
  description: 'Build your Street Lamp with artwork you love. New streamlined experience.',
}

function filterLamp(products: ShopifyProduct[]) {
  return products.filter(
    (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
  )
}

type SeasonResult = Awaited<ReturnType<typeof getCachedSeasonCollections>>[0]

function buildProductsFromSeasons(season1Result: SeasonResult, season2Result: SeasonResult) {
  const productsSeason1 = filterLamp(
    season1Result?.products?.edges?.map((e) => e.node) ?? []
  )
  const productsSeason2 = filterLamp(
    season2Result?.products?.edges?.map((e) => e.node) ?? []
  )
  const pageInfoSeason1 = season1Result?.products?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  }
  const pageInfoSeason2 = season2Result?.products?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  }
  return { productsSeason1, productsSeason2, pageInfoSeason1, pageInfoSeason2 }
}

type ExperienceV2PageProps = {
  searchParams: Promise<{ artist?: string; vendor?: string }>
}

export default async function ExperienceV2Page({ searchParams }: ExperienceV2PageProps) {
  const resolved = await searchParams
  const initialArtistSlug = resolved?.artist?.trim() || resolved?.vendor?.trim() || undefined

  const [lamp, [season1Result, season2Result]] = await Promise.all([
    getCachedLamp().catch(() => null),
    getCachedSeasonCollections(),
  ])

  if (!lamp) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3 text-white">Unavailable</h1>
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

  const { productsSeason1, productsSeason2, pageInfoSeason1, pageInfoSeason2 } =
    buildProductsFromSeasons(season1Result, season2Result)

  return (
    <ExperienceV2ClientLoader
      lamp={lamp}
      productsSeason1={productsSeason1}
      productsSeason2={productsSeason2}
      pageInfoSeason1={pageInfoSeason1}
      pageInfoSeason2={pageInfoSeason2}
      initialArtistSlug={initialArtistSlug}
    />
  )
}
