import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { capturePostHogServerEvent } from '@/lib/posthog-server'
import type { EditionStageKey } from '@/lib/shop/edition-stages'

async function getSessionUserId(cookieStore: ReturnType<typeof cookies>) {
  const supabase = createRouteClient(cookieStore)
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session?.user?.id) return null
  return session.user.id
}

const STAGE_KEYS = new Set<string>([
  'justOpened',
  'fresh',
  'early',
  'firstWave',
  'gathering',
  'momentum',
  'breakthrough',
  'scarce',
  'final',
  'lastChance',
  'soldOut',
])

function isValidStage(s: string): s is EditionStageKey {
  return STAGE_KEYS.has(s)
}

/**
 * GET /api/shop/watchlist — list current user's watchlist + optional ?product_id= for single status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = await getSessionUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const productIdParam = request.nextUrl.searchParams.get('product_id')
    const normalized = productIdParam ? normalizeShopifyProductId(productIdParam) : null

    const supabase = createServiceClient()

    if (normalized) {
      const { data: row } = await supabase
        .from('edition_watchlist')
        .select('id, shopify_product_id, stage_at_save, product_title, product_handle, artist_name, created_at')
        .eq('user_id', userId)
        .eq('shopify_product_id', normalized)
        .maybeSingle()

      return NextResponse.json({ watching: !!row, item: row ?? null })
    }

    const { data: rows, error } = await supabase
      .from('edition_watchlist')
      .select('id, shopify_product_id, stage_at_save, product_title, product_handle, artist_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[watchlist GET]', error)
      return NextResponse.json({ error: 'Failed to load watchlist' }, { status: 500 })
    }

    return NextResponse.json({ items: rows ?? [] })
  } catch (e) {
    console.error('[watchlist GET]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/shop/watchlist — add or update watch (stage_at_save refreshed)
 * Body: { shopify_product_id, stage, product_title?, product_handle?, artist_name? }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = await getSessionUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const rawId = body?.shopify_product_id as string | undefined
    const stage = body?.stage as string | undefined
    const productId = normalizeShopifyProductId(rawId || '')
    if (!productId || !stage || !isValidStage(stage)) {
      return NextResponse.json({ error: 'Invalid product or stage' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const payload = {
      user_id: userId,
      shopify_product_id: productId,
      stage_at_save: stage,
      product_title: typeof body.product_title === 'string' ? body.product_title.slice(0, 500) : null,
      product_handle: typeof body.product_handle === 'string' ? body.product_handle.slice(0, 255) : null,
      artist_name: typeof body.artist_name === 'string' ? body.artist_name.slice(0, 255) : null,
      updated_at: new Date().toISOString(),
    }

    const { data: row, error } = await supabase
      .from('edition_watchlist')
      .upsert(payload, { onConflict: 'user_id,shopify_product_id' })
      .select('id, shopify_product_id, stage_at_save, created_at')
      .single()

    if (error) {
      console.error('[watchlist POST]', error)
      return NextResponse.json({ error: 'Failed to save watchlist' }, { status: 500 })
    }

    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (email) {
      await capturePostHogServerEvent('watchlist_saved', email, {
        artwork_id: productId,
        stage_at_save: stage,
      })
    }

    return NextResponse.json({ ok: true, item: row })
  } catch (e) {
    console.error('[watchlist POST]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/shop/watchlist — body: { shopify_product_id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = await getSessionUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const productId = normalizeShopifyProductId(body?.shopify_product_id || '')
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from('edition_watchlist')
      .select('id, stage_at_save')
      .eq('user_id', userId)
      .eq('shopify_product_id', productId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ ok: true, removed: false })
    }

    const { error } = await supabase.from('edition_watchlist').delete().eq('id', existing.id)

    if (error) {
      console.error('[watchlist DELETE]', error)
      return NextResponse.json({ error: 'Failed to remove' }, { status: 500 })
    }

    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (email) {
      await capturePostHogServerEvent('watchlist_removed', email, {
        artwork_id: productId,
        stage_at_removal: existing.stage_at_save,
      })
    }

    return NextResponse.json({ ok: true, removed: true })
  } catch (e) {
    console.error('[watchlist DELETE]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
