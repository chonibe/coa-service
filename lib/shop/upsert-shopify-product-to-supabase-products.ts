import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { SHOPIFY_ACCESS_TOKEN, SHOPIFY_SHOP } from '@/lib/env'

const SHOPIFY_ADMIN_GRAPHQL = '2024-01'

const PRODUCT_FOR_SUPABASE_QUERY = `
  query ProductForSupabase($id: ID!) {
    product(id: $id) {
      legacyResourceId
      title
      handle
      vendor
      bodyHtml
      featuredImage {
        url
      }
      variants(first: 1) {
        edges {
          node {
            price
          }
        }
      }
      editionSize: metafield(namespace: "custom", key: "edition_size") {
        value
      }
      editionVolume: metafield(namespace: "verisart", key: "edition_volume") {
        value
      }
    }
  }
`

type GqlProductNode = {
  legacyResourceId: string
  title: string
  handle: string
  vendor: string
  bodyHtml: string | null
  featuredImage: { url: string } | null
  variants: { edges: Array<{ node: { price: string } }> }
  editionSize: { value: string } | null
  editionVolume: { value: string } | null
} | null

/**
 * Fetches one product from Shopify Admin and upserts `public.products` (same shape as
 * `scripts/sync-shopify-products-with-metafields.js`). Preserves existing `edition_counter`
 * by omitting it from the payload. Used by product webhooks and optional admin sync.
 */
export async function upsertShopifyProductIntoSupabaseProducts(
  supabase: SupabaseClient<Database>,
  shopifyProductIdNumeric: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    return { ok: false, error: 'Missing SHOPIFY_SHOP or SHOPIFY_ACCESS_TOKEN' }
  }

  const idNum = parseInt(String(shopifyProductIdNumeric).replace(/\D/g, ''), 10)
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return { ok: false, error: 'Invalid Shopify product id' }
  }

  const gid = `gid://shopify/Product/${idNum}`

  let product: GqlProductNode
  try {
    const res = await fetch(`https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_ADMIN_GRAPHQL}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PRODUCT_FOR_SUPABASE_QUERY,
        variables: { id: gid },
      }),
    })

    if (!res.ok) {
      return { ok: false, error: `Shopify HTTP ${res.status}` }
    }

    const json = (await res.json()) as {
      errors?: unknown
      data?: { product: GqlProductNode }
    }

    if (json.errors) {
      return { ok: false, error: 'Shopify GraphQL errors' }
    }

    product = json.data?.product ?? null
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }

  if (!product) {
    return { ok: false, error: 'Product not found in Shopify (deleted or wrong id)' }
  }

  const productId = parseInt(String(product.legacyResourceId), 10)
  if (!Number.isFinite(productId) || productId <= 0) {
    return { ok: false, error: 'Invalid legacyResourceId' }
  }

  const imgUrl = product.featuredImage?.url ?? null
  const priceStr = product.variants?.edges?.[0]?.node?.price
  const price = priceStr ? parseFloat(priceStr) : 0
  const editionSize =
    product.editionSize?.value || product.editionVolume?.value || null

  const vendorName = (product.vendor || '').trim() || 'Unknown'

  const upsertData = {
    product_id: productId,
    name: product.title || 'Untitled',
    handle: product.handle || null,
    vendor_name: vendorName,
    description: product.bodyHtml || '',
    price: Number.isFinite(price) ? price : 0,
    image_url: imgUrl,
    img_url: imgUrl,
    edition_size: editionSize != null ? String(editionSize) : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('products').upsert(upsertData, { onConflict: 'product_id' })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
