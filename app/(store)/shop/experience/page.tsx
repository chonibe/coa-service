import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import type { Metadata } from 'next'
import { buildShopExperienceMetadata } from '@/lib/seo/experience-metadata'
import {
  getExperienceLampAndSeasonCollections,
  getProduct,
  type ShopifyCollection,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { getGalleryHeroImageUrl, pickInitialPreviewProduct } from '@/lib/shop/experience-gallery-images'
import { getShopDiscountSettings } from '@/lib/shop/get-shop-discount-flags'
import { ExperienceV3ClientLoader } from '../experience-v3/components/ExperienceV3ClientLoader'

export const dynamic = 'force-dynamic'

const getCachedExperienceBundle = unstable_cache(
  () =>
    getExperienceLampAndSeasonCollections('street_lamp', 'season-1', '2025-edition', { first: 24 }),
  ['experience-shopify-bundle-v1'],
  { revalidate: 300, tags: ['experience-products'] }
)

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string; vendor?: string; artwork?: string; unlisted?: string }>
}): Promise<Metadata> {
  return buildShopExperienceMetadata(searchParams, '/shop/experience')
}

function filterLamp(products: ShopifyProduct[]) {
  return products.filter((p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp'))
}

function buildProductsFromSeasons(
  season1Result: ShopifyCollection | null,
  season2Result: ShopifyCollection | null
) {
  const productsSeason1 = filterLamp(season1Result?.products?.edges?.map((e) => e.node) ?? [])
  const productsSeason2 = filterLamp(season2Result?.products?.edges?.map((e) => e.node) ?? [])
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

type ExperiencePageProps = {
  searchParams: Promise<{ artist?: string; vendor?: string; artwork?: string }>
}

export default async function ExperiencePage({ searchParams }: ExperiencePageProps) {
  const resolved = await searchParams
  const initialArtistSlug = resolved?.artist?.trim() || resolved?.vendor?.trim() || undefined
  const initialArtworkHandle = resolved?.artwork?.trim() || undefined

  const bundle = await getCachedExperienceBundle().catch(() => ({
    lamp: null as ShopifyProduct | null,
    season1: null as ShopifyCollection | null,
    season2: null as ShopifyCollection | null,
  }))
  const { lamp, season1: season1Result, season2: season2Result } = bundle

  if (!lamp) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3 text-foreground">Unavailable</h1>
          <p className="text-muted-foreground mb-6">Could not load the lamp product. Please try again later.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2.5 bg-card text-foreground rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const { productsSeason1, productsSeason2, pageInfoSeason1, pageInfoSeason2 } =
    buildProductsFromSeasons(season1Result, season2Result)

  const shopDiscountSettings = await getShopDiscountSettings()

  const initialSelectedArtwork = initialArtworkHandle
    ? await getProduct(initialArtworkHandle).catch(() => null)
    : null
  const initialPreviewProduct = initialSelectedArtwork ?? pickInitialPreviewProduct(productsSeason2, productsSeason1)
  const initialGalleryProduct = initialPreviewProduct?.handle
    ? ((await getProduct(initialPreviewProduct.handle).catch(() => null)) ?? initialPreviewProduct)
    : null
  const initialHeroPreloadUrl = getGalleryHeroImageUrl(initialGalleryProduct ?? initialPreviewProduct)

  return (
    <>
      {initialHeroPreloadUrl ? (
        <link rel="preload" as="image" href={initialHeroPreloadUrl} fetchPriority="high" />
      ) : null}
      <ExperienceV3ClientLoader
        lamp={lamp}
        productsSeason1={productsSeason1}
        productsSeason2={productsSeason2}
        pageInfoSeason1={pageInfoSeason1}
        pageInfoSeason2={pageInfoSeason2}
        initialArtistSlug={initialArtistSlug}
        initialSelectedArtwork={initialSelectedArtwork}
        shopDiscountSettings={shopDiscountSettings}
        initialGalleryProduct={initialGalleryProduct}
      />
    </>
  )
}
