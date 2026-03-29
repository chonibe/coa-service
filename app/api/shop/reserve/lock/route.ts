import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import {
  getStreetPricingStage,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'
import { STREET_RESERVE_TIER_LOCK_DAYS, type StreetReserveTierId } from '@/lib/shop/street-reserve-config'

async function getSession(cookieStore: ReturnType<typeof cookies>) {
  const supabase = createRouteClient(cookieStore)
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session?.user?.id || !session.user.email) return null
  return session
}

/**
 * POST /api/shop/reserve/lock { shopifyProductId } — freeze current ladder price for this artwork (Reserve members).
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getSession(cookieStore)
    if (!session) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { shopifyProductId?: string }
    const gidOrNumeric = body.shopifyProductId?.trim()
    if (!gidOrNumeric) {
      return NextResponse.json({ error: 'shopifyProductId required' }, { status: 400 })
    }
    const numeric = normalizeShopifyProductId(gidOrNumeric)
    if (!numeric) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
    }
    const productIdNum = parseInt(numeric, 10)
    if (!Number.isFinite(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
    }

    const svc = createServiceClient() as any

    const { data: subRow, error: subErr } = await svc
      .from('street_reserve_subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (subErr && subErr.code !== '42P01') {
      console.error('[reserve/lock] sub', subErr)
      return NextResponse.json({ error: 'Subscription lookup failed' }, { status: 500 })
    }

    const tier = subRow?.tier as StreetReserveTierId | undefined
    if (!tier || !STREET_RESERVE_TIER_LOCK_DAYS[tier]) {
      return NextResponse.json({ error: 'Active Reserve subscription required' }, { status: 403 })
    }

    const lockDays = STREET_RESERVE_TIER_LOCK_DAYS[tier]

    const { data: productRow, error: prodErr } = await svc
      .from('products')
      .select('edition_counter, edition_size')
      .eq('product_id', productIdNum)
      .maybeSingle()

    if (prodErr || !productRow) {
      return NextResponse.json({ error: 'Product not found in catalog' }, { status: 404 })
    }

    const sold = Math.max(0, Math.floor(Number(productRow.edition_counter ?? 0)))
    const totalParsed =
      productRow.edition_size != null ? parseInt(String(productRow.edition_size), 10) : NaN
    const season = streetSeasonFromTotalEditions(Number.isFinite(totalParsed) ? totalParsed : 90)
    const stage = getStreetPricingStage(season, sold)
    if (stage.priceUsd == null) {
      return NextResponse.json({ error: 'Edition is sold out — lock not available' }, { status: 400 })
    }

    const locked_price_cents = Math.round(stage.priceUsd * 100)
    const expires_at = new Date(Date.now() + lockDays * 86400000).toISOString()

    const { error: upsertErr } = await svc.from('street_reserve_locks').upsert(
      {
        user_id: session.user.id,
        customer_email: session.user.email.toLowerCase(),
        shopify_product_id: numeric,
        locked_price_cents,
        expires_at,
      },
      { onConflict: 'user_id,shopify_product_id' }
    )

    if (upsertErr) {
      if (upsertErr.code === '42P01') {
        return NextResponse.json({ error: 'Reserve locks table not migrated' }, { status: 503 })
      }
      console.error('[reserve/lock] upsert', upsertErr)
      return NextResponse.json({ error: 'Failed to save lock' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      shopify_product_id: numeric,
      locked_price_usd: stage.priceUsd,
      expires_at,
      tier,
    })
  } catch (e) {
    console.error('[reserve/lock]', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
