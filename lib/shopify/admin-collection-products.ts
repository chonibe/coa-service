import { pickVideoSourceUrl } from '@/lib/shop/product-carousel-slides'
import type { ShopifyVideo } from '@/lib/shopify/storefront-client'

/**
 * Shopify Admin API — collection products (including unlisted)
 *
 * The Storefront API omits unlisted products from collection.products.
 * This helper uses the Admin API to get product handles for a collection,
 * so we can then fetch each product by handle via Storefront (which returns unlisted when queried by handle).
 * Used for early-access / unlisted collection flows.
 */

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP || ''
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || ''

const ADMIN_HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
  'Content-Type': 'application/json',
} as const

export function isAdminCollectionApiAvailable(): boolean {
  return Boolean(SHOPIFY_SHOP && SHOPIFY_ACCESS_TOKEN)
}

/**
 * Resolve a Shopify media GID (e.g. MediaImage, GenericFile, or Video) to a playable/file URL via Admin API.
 */
export async function resolveMediaGidToUrl(gid: string): Promise<string | null> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN || !gid?.startsWith('gid://')) return null
  try {
    const query = `
      query getMediaUrl($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            image { url }
          }
          ... on GenericFile {
            url
          }
          ... on Video {
            sources {
              url
              mimeType
              format
              height
              width
            }
          }
        }
      }
    `
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ query, variables: { id: gid } }),
      next: { revalidate: 60 },
    })
    if (!response.ok) return null
    const json = await response.json()
    const node = json?.data?.node
    const imageOrFileUrl = node?.image?.url ?? node?.url
    if (typeof imageOrFileUrl === 'string' && imageOrFileUrl.trim()) return imageOrFileUrl.trim()

    const sources = node?.sources as ShopifyVideo['sources'] | undefined
    if (sources?.length) {
      const picked = pickVideoSourceUrl(sources)
      return picked?.trim() || null
    }

    return null
  } catch {
    return null
  }
}

/**
 * Fetch collection metafield custom.gif via Admin API (works even when Storefront doesn't expose it).
 * If the metafield value is a media GID (e.g. gid://shopify/MediaImage/...), resolves it to the image URL.
 * collectionId: Storefront GID (e.g. gid://shopify/Collection/123) or numeric id.
 */
export async function getCollectionGifUrlByAdmin(collectionId: string): Promise<string | null> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) return null
  const gid = collectionId.startsWith('gid://') ? collectionId : `gid://shopify/Collection/${collectionId}`
  try {
    const query = `
      query getCollectionGif($id: ID!) {
        collection(id: $id) {
          metafield(namespace: "custom", key: "gif") { value }
        }
      }
    `
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ query, variables: { id: gid } }),
      next: { revalidate: 60 },
    })
    if (!response.ok) return null
    const json = await response.json()
    const value = json?.data?.collection?.metafield?.value?.trim()
    if (!value) return null
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    const resolved = await resolveMediaGidToUrl(value)
    return resolved ?? value
  } catch {
    return null
  }
}

/**
 * Fetch collection metafield custom.video via Admin API (when Storefront omits or value is file reference).
 * Resolves media GIDs to a URL (Video → progressive/HLS URL; file → URL).
 */
export async function getCollectionVideoUrlByAdmin(collectionId: string): Promise<string | null> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) return null
  const gid = collectionId.startsWith('gid://') ? collectionId : `gid://shopify/Collection/${collectionId}`
  try {
    const query = `
      query getCollectionVideo($id: ID!) {
        collection(id: $id) {
          metafield(namespace: "custom", key: "video") { value }
        }
      }
    `
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ query, variables: { id: gid } }),
      next: { revalidate: 60 },
    })
    if (!response.ok) return null
    const json = await response.json()
    const value = json?.data?.collection?.metafield?.value?.trim()
    if (!value) return null
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    const resolved = await resolveMediaGidToUrl(value)
    return resolved ?? value
  } catch {
    return null
  }
}

/**
 * Get collection ID by handle via REST (list collections and find by handle).
 */
async function getCollectionIdByHandleREST(handle: string): Promise<string | null> {
  let url: string | null = `https://${SHOPIFY_SHOP}/admin/api/2024-01/collections.json?limit=250`
  while (url) {
    const response = await fetch(url, { method: 'GET', headers: ADMIN_HEADERS })
    if (!response.ok) return null
    const data = (await response.json()) as { collections?: Array<{ id: number; handle?: string }> }
    const col = data.collections?.find((c) => (c.handle ?? '').toLowerCase() === handle.toLowerCase())
    if (col) return String(col.id)
    const link = response.headers.get('Link')
    const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = nextMatch ? nextMatch[1] : null
  }
  return null
}

/**
 * Get product handles for a collection via Admin REST API (includes unlisted products).
 */
async function getCollectionProductHandlesREST(handle: string): Promise<string[]> {
  const collectionId = await getCollectionIdByHandleREST(handle)
  if (!collectionId) return []

  const handles: string[] = []
  let url: string | null = `https://${SHOPIFY_SHOP}/admin/api/2024-01/collections/${collectionId}/products.json?limit=250`
  let pageCount = 0
  while (url && pageCount < 5) {
    pageCount++
    const response = await fetch(url, { method: 'GET', headers: ADMIN_HEADERS })
    if (!response.ok) break
    const data = (await response.json()) as { products?: Array<{ handle?: string }> }
    for (const p of data.products ?? []) {
      if (p.handle?.trim()) handles.push(p.handle.trim())
    }
    const link = response.headers.get('Link')
    const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = nextMatch ? nextMatch[1] : null
  }
  return handles
}

/**
 * Get product handles for a collection via Admin API (includes unlisted products).
 * Tries GraphQL first, then REST. Returns [] if Admin API is not configured or the collection is not found.
 */
export async function getCollectionProductHandlesByHandle(handle: string): Promise<string[]> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[admin-collection-products] SHOPIFY_SHOP or SHOPIFY_ACCESS_TOKEN not set; unlisted products will not load.')
    }
    return []
  }

  // 1. Try GraphQL (collectionByHandle)
  try {
    const query = `
      query getCollectionProductHandles($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          products(first: 100, sortKey: COLLECTION_DEFAULT) {
            edges {
              node {
                handle
              }
            }
          }
        }
      }
    `
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ query, variables: { handle } }),
      next: { revalidate: 60 },
    })

    if (response.ok) {
      const json = await response.json()
      if (json.errors?.length && process.env.NODE_ENV === 'development') {
        console.warn('[admin-collection-products] GraphQL errors for', handle, json.errors)
      }
      const collection = json?.data?.collectionByHandle
      if (collection?.products?.edges?.length) {
        const out = collection.products.edges
          .map((e: { node?: { handle?: string } }) => e?.node?.handle)
          .filter((h: string | undefined): h is string => Boolean(h?.trim()))
        return out
      }
      if (collection && (!collection.products?.edges?.length)) {
        return [] // collection found but no products
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[admin-collection-products] GraphQL failed for', handle, e)
    }
  }

  // 2. Fallback: REST API (list collections by handle, then collection products)
  try {
    const handles = await getCollectionProductHandlesREST(handle)
    if (process.env.NODE_ENV === 'development' && handles.length === 0) {
      console.warn('[admin-collection-products] REST returned 0 handles for collection handle:', handle)
    }
    return handles
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[admin-collection-products] REST fallback failed for', handle, e)
    }
    return []
  }
}
