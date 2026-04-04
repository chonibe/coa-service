import type { MetadataRoute } from 'next'
import { getShopArtistsList } from '@/lib/shop/artists-list'
import { getProducts } from '@/lib/shopify/storefront-client'
import { absoluteShopUrl } from '@/lib/seo/site-url'

export const dynamic = 'force-dynamic'

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }[] =
  [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/shop/home-v2', changeFrequency: 'weekly', priority: 0.95 },
    { path: '/shop/products', changeFrequency: 'daily', priority: 0.9 },
    { path: '/shop/explore-artists', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/shop/faq', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/shop/street-collector', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/shop/contact', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/shop/for-business', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/shop/collab', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/policies/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/policies/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/policies/shipping-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/policies/refund-policy', changeFrequency: 'yearly', priority: 0.3 },
  ]

async function fetchAllProductHandles(): Promise<string[]> {
  const handles: string[] = []
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
      if (p.handle) handles.push(p.handle)
    }
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) break
    cursor = pageInfo.endCursor ?? undefined
  }

  return [...new Set(handles)]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: absoluteShopUrl(path),
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))

  let artistEntries: MetadataRoute.Sitemap = []
  let productEntries: MetadataRoute.Sitemap = []

  try {
    const [artists, handles] = await Promise.all([
      getShopArtistsList(),
      fetchAllProductHandles(),
    ])

    artistEntries = artists.map((a) => ({
      url: absoluteShopUrl(`/shop/artists/${a.slug}`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))

    productEntries = handles.map((h) => ({
      url: absoluteShopUrl(`/shop/${h}`),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  } catch (e) {
    console.error('[sitemap] Dynamic entries failed:', e)
  }

  return [...staticEntries, ...artistEntries, ...productEntries]
}
