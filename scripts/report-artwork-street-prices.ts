/**
 * Report artist, artwork title, Shopify variant USD, and Street ladder list USD
 * for vendor submissions that resolve to a numeric Shopify product id (`shopify_product_id` or
 * `product_data.id`). Default: published only (collector marketplace parity).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/report-artwork-street-prices.ts
 *   npx tsx scripts/report-artwork-street-prices.ts --json > docs/dev/artwork-prices-report.json
 *   npx tsx scripts/report-artwork-street-prices.ts --status=all
 *   npx tsx scripts/report-artwork-street-prices.ts --status=all --include-drafts
 *     (rows without a synced Shopify product id: variant USD from product_data only, ladder N/A)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import {
  getStreetPricingStageDisplay,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function parseArgs() {
  const argv = process.argv.slice(2)
  const json = argv.includes('--json')
  const includeDrafts = argv.includes('--include-drafts')
  let status: 'published' | 'approved' | 'all' = 'published'
  const s = argv.find((a) => a.startsWith('--status='))
  if (s) {
    const v = s.split('=')[1] as string
    if (v === 'published' || v === 'approved' || v === 'all') status = v
  }
  return { json, status, includeDrafts }
}

function normalizeNumericProductId(raw: string | null | undefined): number | null {
  if (!raw) return null
  const s = String(raw).replace(/^gid:\/\/shopify\/Product\//i, '').trim()
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function normalizeNumericProductIdFromUnknown(raw: unknown): number | null {
  if (raw == null) return null
  return normalizeNumericProductId(String(raw))
}

function variantUsdFromProductData(pd: Record<string, unknown> | null): number | null {
  if (!pd) return null
  const variants = pd.variants as { price?: string }[] | undefined
  if (!variants?.length) return null
  const p = parseFloat(String(variants[0].price ?? ''))
  return Number.isFinite(p) ? p : null
}

type ProductRow = {
  product_id: number | null
  edition_counter: number | null
  edition_size: string | null
}

async function fetchProductsByIds(
  supabase: ReturnType<typeof createClient>,
  ids: number[]
): Promise<Map<number, ProductRow>> {
  const map = new Map<number, ProductRow>()
  const chunk = 120
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk)
    const { data, error } = await supabase
      .from('products')
      .select('product_id, edition_counter, edition_size')
      .in('product_id', slice)
    if (error) {
      console.error('[products]', error.message)
      continue
    }
    for (const row of data || []) {
      const pid = row.product_id
      if (pid != null) map.set(Number(pid), row as ProductRow)
    }
  }
  return map
}

async function main() {
  const { json, status, includeDrafts } = parseArgs()
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  let q = supabase.from('vendor_product_submissions').select('id, vendor_name, status, shopify_product_id, product_data')

  if (status === 'published') q = q.eq('status', 'published')
  else if (status === 'approved') q = q.eq('status', 'approved')

  const { data: rows, error } = await q.order('vendor_name', { ascending: true })
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  const raw = rows || []
  const submissions = includeDrafts
    ? raw
    : raw.filter((r) => {
        const pd = r.product_data as Record<string, unknown> | null
        const pid =
          normalizeNumericProductId(r.shopify_product_id) ?? normalizeNumericProductIdFromUnknown(pd?.id)
        return pid != null
      })

  if (submissions.length === 0 && raw.length > 0 && !includeDrafts) {
    console.error(
      `[report-artwork-street-prices] 0 rows with a resolvable Shopify product id (column or product_data.id). ` +
        `Try: --include-drafts or --status=all --include-drafts (${raw.length} submission(s) loaded).`
    )
  }
  const idSet = new Set<number>()
  for (const r of submissions) {
    const pd = r.product_data as Record<string, unknown> | null
    const fromCol = normalizeNumericProductId(r.shopify_product_id)
    const fromPd = normalizeNumericProductIdFromUnknown(pd?.id)
    const n = fromCol ?? fromPd
    if (n) idSet.add(n)
  }
  const productIds = [...idSet]
  const productMap = await fetchProductsByIds(supabase, productIds)

  type RowOut = {
    artist: string
    title: string
    status: string
    shopifyProductId: string | null
    editionsSold: number | null
    editionTotal: number | null
    season: 1 | 2 | null
    stageLabel: string
    streetListUsd: number | null
    shopifyVariantUsd: number | null
    note: string | null
  }

  const out: RowOut[] = []

  for (const r of submissions) {
    const pd = r.product_data as Record<string, unknown> | null
    const title = (pd?.title as string) || 'Untitled'
    const variantUsd = variantUsdFromProductData(pd)
    const pid =
      normalizeNumericProductId(r.shopify_product_id) ?? normalizeNumericProductIdFromUnknown(pd?.id)

    let editionsSold: number | null = null
    let editionTotal: number | null = null
    let season: 1 | 2 | null = null
    let streetListUsd: number | null = null
    let stageLabel = '—'
    let note: string | null = null

    if (pid == null) {
      note = 'No numeric Shopify product id'
    } else {
      const pr = productMap.get(pid)
      if (!pr) {
        note = 'No products row — ladder N/A'
        streetListUsd = null
      } else {
        editionsSold = Math.max(0, Math.floor(Number(pr.edition_counter ?? 0)))
        const totalParsed = pr.edition_size != null ? parseInt(String(pr.edition_size), 10) : NaN
        editionTotal = Number.isFinite(totalParsed) ? totalParsed : null
        season = streetSeasonFromTotalEditions(editionTotal ?? 90)
        const display = getStreetPricingStageDisplay(season, editionsSold)
        streetListUsd = display.priceUsd
        stageLabel = display.label
      }
    }

    out.push({
      artist: r.vendor_name,
      title,
      status: r.status,
      shopifyProductId: r.shopify_product_id,
      editionsSold,
      editionTotal,
      season,
      stageLabel,
      streetListUsd,
      shopifyVariantUsd: variantUsd,
      note,
    })
  }

  if (json) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), count: out.length, items: out }, null, 2))
    return
  }

  console.log(
    ['Artist', 'Artwork', 'Status', 'Sold', 'Total', 'S', 'Stage', 'Street USD', 'Variant USD', 'Note'].join('\t')
  )
  for (const x of out) {
    console.log(
      [
        x.artist,
        x.title.replace(/\t/g, ' '),
        x.status,
        x.editionsSold ?? '',
        x.editionTotal ?? '',
        x.season ?? '',
        x.stageLabel,
        x.streetListUsd != null ? String(x.streetListUsd) : '',
        x.shopifyVariantUsd != null ? String(x.shopifyVariantUsd) : '',
        x.note ?? '',
      ].join('\t')
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
