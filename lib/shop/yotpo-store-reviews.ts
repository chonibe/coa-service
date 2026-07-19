import { unstable_cache } from 'next/cache'
import { SHOPIFY_ACCESS_TOKEN, SHOPIFY_SHOP } from '@/lib/env'
import type { ReviewRatingSummary } from '@/lib/shop/format-review-rating-label'

/**
 * Yotpo public app key (widget key). Prefer env; otherwise Shopify shop metafield
 * `yotpo.app_key` (same key used by the Yotpo storefront widgets).
 */
async function resolveYotpoAppKey(): Promise<string> {
  const fromEnv =
    process.env.YOTPO_APP_KEY?.trim() || process.env.NEXT_PUBLIC_YOTPO_APP_KEY?.trim() || ''
  if (fromEnv) return fromEnv

  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) return ''

  try {
    const res = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `{ shop { metafield(namespace: "yotpo", key: "app_key") { value } } }`,
      }),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return ''
    const data = (await res.json()) as {
      data?: { shop?: { metafield?: { value?: string } | null } }
    }
    return data.data?.shop?.metafield?.value?.trim() || ''
  } catch {
    return ''
  }
}

type YotpoBottomlineRow = {
  domain_key?: string
  product_score?: number
  total_reviews?: number
}

type YotpoBottomlinesResponse = {
  response?: {
    bottomlines?: YotpoBottomlineRow[]
  }
}

type YotpoSiteBottomlineResponse = {
  response?: {
    bottomline?: {
      average_score?: number
      total_reviews?: number
      total_review?: number
    }
  }
}

function aggregateProductBottomlines(rows: YotpoBottomlineRow[]): ReviewRatingSummary | null {
  let totalReviews = 0
  let weighted = 0
  for (const row of rows) {
    const n = Number(row.total_reviews)
    const score = Number(row.product_score)
    if (!Number.isFinite(n) || n <= 0) continue
    if (!Number.isFinite(score) || score <= 0) continue
    totalReviews += n
    weighted += n * score
  }
  if (totalReviews <= 0) return null
  return {
    averageScore: weighted / totalReviews,
    totalReviews,
  }
}

async function fetchAllProductBottomlines(appKey: string): Promise<YotpoBottomlineRow[]> {
  const rows: YotpoBottomlineRow[] = []
  for (let page = 1; page <= 20; page += 1) {
    const url = `https://api.yotpo.com/v1/apps/${encodeURIComponent(appKey)}/bottom_lines?count=100&page=${page}`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) break
    const data = (await res.json()) as YotpoBottomlinesResponse
    const batch = data.response?.bottomlines ?? []
    if (batch.length === 0) break
    rows.push(...batch)
    if (batch.length < 100) break
  }
  return rows
}

async function fetchSiteReviewsBottomline(appKey: string): Promise<ReviewRatingSummary | null> {
  const url = `https://api.yotpo.com/products/${encodeURIComponent(appKey)}/yotpo_site_reviews/bottomline`
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as YotpoSiteBottomlineResponse
  const bl = data.response?.bottomline
  const total = Number(bl?.total_reviews ?? bl?.total_review ?? 0)
  const average = Number(bl?.average_score ?? 0)
  if (!Number.isFinite(total) || total <= 0) return null
  if (!Number.isFinite(average) || average <= 0) return null
  return { averageScore: average, totalReviews: total }
}

/**
 * Prefer product-review aggregate (stronger sample). Fall back to Yotpo site reviews.
 * Never fabricates counts — returns null when the provider has no data.
 */
async function fetchYotpoStoreReviewSummaryUncached(): Promise<ReviewRatingSummary | null> {
  const appKey = await resolveYotpoAppKey()
  if (!appKey) {
    console.warn('[yotpo-store-reviews] No Yotpo app key (env or Shopify metafield)')
    return null
  }

  try {
    const productRows = await fetchAllProductBottomlines(appKey)
    const productSummary = aggregateProductBottomlines(productRows)
    if (productSummary) return productSummary
    return await fetchSiteReviewsBottomline(appKey)
  } catch (error) {
    console.error('[yotpo-store-reviews] Failed to fetch summary:', error)
    return null
  }
}

export const getYotpoStoreReviewSummary = unstable_cache(
  fetchYotpoStoreReviewSummaryUncached,
  ['yotpo-store-review-summary-v1'],
  { revalidate: 3600, tags: ['yotpo-reviews'] }
)

/** Exported for unit tests — pure aggregation only. */
export function aggregateYotpoProductBottomlinesForTest(
  rows: YotpoBottomlineRow[]
): ReviewRatingSummary | null {
  return aggregateProductBottomlines(rows)
}
