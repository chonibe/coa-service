import { Suspense } from 'react'
import Link from 'next/link'
import {
  getProduct,
  getCollectionWithListProducts,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
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

interface ExperiencePageProps {
  searchParams: Promise<{ artist?: string; skipQuiz?: string }>
}

async function ExperiencePageContent({ searchParams }: ExperiencePageProps) {
  const resolved = await searchParams
  const initialArtistSlug = resolved?.artist?.trim() || undefined
  const skipQuiz = resolved?.skipQuiz === '1'
  let lamp: ShopifyProduct | null = null
  let productsSeason1: ShopifyProduct[] = []
  let productsSeason2: ShopifyProduct[] = []
  let error: string | null = null

  try {
    const [lampResult, season1Result, season2Result] = await Promise.all([
      getProduct('street_lamp').catch(() => null),
      getCollectionWithListProducts(SEASON_1_HANDLE, {
        first: 50,
        sortKey: 'MANUAL',
      }).catch(() => null),
      getCollectionWithListProducts(SEASON_2_HANDLE, {
        first: 50,
        sortKey: 'MANUAL',
      }).catch(() => null),
    ])

    lamp = lampResult
    productsSeason1 = season1Result?.products?.edges?.map((e) => e.node) ?? []
    productsSeason2 = season2Result?.products?.edges?.map((e) => e.node) ?? []
  } catch (err: unknown) {
    console.error('Experience page fetch error:', err)
    error = err instanceof Error ? err.message : 'Failed to load products'
  }

  if (error || !lamp) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3">Unavailable</h1>
          <p className="text-neutral-400 mb-6">
            {error || 'Could not load the lamp product. Please try again later.'}
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
    <ExperienceClient
      lamp={lamp}
      productsSeason1={productsSeason1}
      productsSeason2={productsSeason2}
      initialArtistSlug={initialArtistSlug}
      skipQuiz={skipQuiz}
    />
  )
}

export default function ExperiencePage(props: ExperiencePageProps) {
  return (
    <Suspense fallback={<ExperienceLoadingSkeleton />}>
      <ExperiencePageContent {...props} />
    </Suspense>
  )
}
