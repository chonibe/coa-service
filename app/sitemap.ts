import type { MetadataRoute } from 'next'
import { getShopArtistsList } from '@/lib/shop/artists-list'
import { getProducts } from '@/lib/shopify/storefront-client'
import { absoluteShopUrl } from '@/lib/seo/site-url'

/** ISR: sitemap regenerated at most once per hour (Shopify timestamps still drive product lastModified when available). */
export const revalidate = 3600

/**
 * `/` resolves to the same UI as `/shop/street-collector`; canonical URLs point to `/shop/street-collector`.
 * Listing only the canonical URL here avoids duplicate sitemap entries while matching on-page canonicals.
 */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }[] =
  [
    { path: '/shop/street-collector', changeFrequency: 'weekly', priority: 1 },
    { path: '/shop/home-v2', changeFrequency: 'weekly', priority: 0.95 },
    { path: '/shop/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/shop/explore-artists', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/shop/faq', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/shop/contact', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/shop/for-business', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/shop/collab', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/policies/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/policies/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/policies/shipping-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/policies/refund-policy', changeFrequency: 'yearly', priority: 0.3 },
  ]

async function fetchProductSitemapEntries(): Promise<
  { handle: string; lastModified?: Date }[]
> {
  const handles = new Set<string>()
  const latestByHandle = new Map<string, Date>()
  let cursor: string | undefined
  const maxPages = 40

  for (let i = 0; i < maxPages; i++) {
    const { products, pageInfo } = await getProducts({
      first: 100,
      after: cursor,
      sortKey: 'UPDATED_AT',
      reverse: true,
    })
    for (const p of products) {
      if (!p.handle) continue
      handles.add(p.handle)
      if (p.updatedAt) {
        const d = new Date(p.updatedAt)
        if (!Number.isNaN(d.getTime())) {
          const prev = latestByHandle.get(p.handle)
          if (!prev || d > prev) latestByHandle.set(p.handle, d)
        }
      }
    }
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break
    cursor = pageInfo.endCursor ?? undefined
  }

  return [...handles].map((handle) => ({
    handle,
    lastModified: latestByHandle.get(handle),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: absoluteShopUrl(path),
    changeFrequency,
    priority,
  }))

  let artistEntries: MetadataRoute.Sitemap = []
  let productEntries: MetadataRoute.Sitemap = []

  try {
    const [artists, products] = await Promise.all([
      getShopArtistsList(),
      fetchProductSitemapEntries(),
    ])

    artistEntries = artists.map((a) => ({
      url: absoluteShopUrl(`/shop/artists/${a.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

    productEntries = products.map(({ handle, lastModified }) => ({
      url: absoluteShopUrl(`/shop/${handle}`),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error('[sitemap] Dynamic entries failed:', e)
  }

  return [...staticEntries, ...artistEntries, ...productEntries]
}
