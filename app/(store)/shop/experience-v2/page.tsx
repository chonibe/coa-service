import { Suspense } from 'react'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import {
  getProduct,
  getSeasonCollections,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { ExperienceV2Client } from './components/ExperienceV2Client'

export const dynamic = 'force-dynamic'

const getCachedLamp = unstable_cache(
  () => getProduct('street_lamp'),
  ['experience-v2-lamp'],
  { revalidate: 300, tags: ['experience-products'] }
)

const getCachedSeasonCollections = unstable_cache(
  () => getSeasonCollections('season-1', '2025-edition', { first: 50 }),
  ['experience-v2-season-collections'],
  { revalidate: 300, tags: ['experience-products'] }
)

export const metadata: Metadata = {
  title: 'Experience V2 | Street Collector',
  description: 'Build your Street Lamp with artwork you love. New streamlined experience.',
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-sm text-white/50">Loading experience…</p>
      </div>
    </div>
  )
}

function filterLamp(products: ShopifyProduct[]) {
  return products.filter(
    (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
  )
}

async function ExperienceV2Loader({ lamp }: { lamp: ShopifyProduct }) {
  const [season1Result, season2Result] = await getCachedSeasonCollections()

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

  return (
    <ExperienceV2Client
      lamp={lamp}
      productsSeason1={productsSeason1}
      productsSeason2={productsSeason2}
      pageInfoSeason1={pageInfoSeason1}
      pageInfoSeason2={pageInfoSeason2}
    />
  )
}

async function ExperienceV2LampLoader() {
  const lamp = await getCachedLamp().catch(() => null)

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

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ExperienceV2Loader lamp={lamp} />
    </Suspense>
  )
}

export default function ExperienceV2Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ExperienceV2LampLoader />
    </Suspense>
  )
}
