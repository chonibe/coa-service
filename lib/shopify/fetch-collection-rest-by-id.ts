import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'
import { safeJsonParse } from '@/lib/shopify-api'

const API_VERSION = '2024-01'

async function adminFetch(path: string): Promise<Response> {
  const url = path.startsWith('https')
    ? path
    : `https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}/${path.replace(/^\//, '')}`
  return fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  })
}

export type RestCollectionRow = {
  id: string
  handle: string
  title: string
  bodyHtml: string | null
  imageSrc: string | null
}

function normalizeRow(
  id: number | string,
  handle: string,
  title: string,
  bodyHtml: string | null | undefined,
  image: { src?: string } | null | undefined
): RestCollectionRow {
  return {
    id: String(id),
    handle,
    title,
    bodyHtml: bodyHtml ?? null,
    imageSrc: image?.src ?? null,
  }
}

/**
 * Load a collection from Shopify Admin REST by numeric id (custom or smart).
 */
export async function fetchShopifyCollectionRestById(collectionId: string): Promise<RestCollectionRow | null> {
  let res = await adminFetch(`custom_collections/${collectionId}.json`)
  if (res.ok) {
    const data = await safeJsonParse(res)
    const c = data?.custom_collection
    if (c?.id != null && c?.handle) {
      return normalizeRow(c.id, c.handle, c.title ?? c.handle, c.body_html, c.image)
    }
  }

  res = await adminFetch(`smart_collections/${collectionId}.json`)
  if (res.ok) {
    const data = await safeJsonParse(res)
    const c = data?.smart_collection
    if (c?.id != null && c?.handle) {
      return normalizeRow(c.id, c.handle, c.title ?? c.handle, c.body_html, c.image)
    }
  }

  return null
}

/**
 * Load collection from Admin REST by public handle (custom or smart list endpoint).
 */
export async function fetchShopifyCollectionRestByHandle(handle: string): Promise<RestCollectionRow | null> {
  const h = encodeURIComponent(handle.trim())
  for (const path of [`custom_collections.json?handle=${h}`, `smart_collections.json?handle=${h}`]) {
    const res = await adminFetch(path)
    if (!res.ok) continue
    const data = await safeJsonParse(res)
    const key = path.startsWith('custom') ? 'custom_collections' : 'smart_collections'
    const list = data?.[key] as Array<{
      id: number | string
      handle: string
      title?: string
      body_html?: string
      image?: { src?: string }
    }>
    const c = list?.[0]
    if (c?.id != null && c?.handle) {
      return normalizeRow(c.id, c.handle, c.title ?? c.handle, c.body_html, c.image)
    }
  }
  return null
}
