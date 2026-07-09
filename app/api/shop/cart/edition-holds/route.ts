import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import {
  applyAnonymousHoldSessionCookie,
  resolveCartEditionHoldHolderKey,
} from '@/lib/shop/cart-edition-hold-session'
import {
  deleteCartEditionHold,
  deleteCartEditionHoldsNotInProducts,
  listActiveCartEditionHoldsForHolder,
  upsertCartEditionHold,
} from '@/lib/shop/cart-edition-hold-server'

/** Cart sync creates/refreshes holds for cart lines only — it never releases session holds. */

function jsonWithOptionalSessionCookie(
  body: unknown,
  init: { status?: number; setAnonymousSessionId?: string }
) {
  const res = NextResponse.json(body, { status: init.status ?? 200 })
  if (init.setAnonymousSessionId) {
    applyAnonymousHoldSessionCookie(res, init.setAnonymousSessionId)
  }
  return res
}

/**
 * GET /api/shop/cart/edition-holds — active 24h holds for the current cart session.
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const { holderKey } = await resolveCartEditionHoldHolderKey(cookieStore)
    const svc = createServiceClient()
    const holds = await listActiveCartEditionHoldsForHolder(svc, holderKey)
    return NextResponse.json({ holds })
  } catch (e) {
    console.error('[cart/edition-holds GET]', e)
    return NextResponse.json({ holds: [] })
  }
}

/**
 * POST /api/shop/cart/edition-holds { shopifyProductId }
 * PUT  /api/shop/cart/edition-holds { shopifyProductIds: string[] } — sync with cart
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { holderKey, setAnonymousSessionId } = await resolveCartEditionHoldHolderKey(cookieStore)
    const body = (await request.json().catch(() => ({}))) as {
      shopifyProductId?: string
      shopifyProductIds?: string[]
    }

    const svc = createServiceClient()

    if (Array.isArray(body.shopifyProductIds)) {
      const ids = body.shopifyProductIds
        .map((id) => normalizeShopifyProductId(String(id)))
        .filter((x): x is string => !!x)
      const unique = Array.from(new Set(ids))

      const holds = []
      for (const id of unique) {
        const result = await upsertCartEditionHold(svc, holderKey, id)
        if ('error' in result) {
          if (result.error === 'table_missing') {
            return jsonWithOptionalSessionCookie(
              { error: 'Edition holds not available', holds: [] },
              { status: 503, setAnonymousSessionId }
            )
          }
          if (result.error === 'sold_out') continue
          if (result.error === 'not_found') continue
        } else {
          holds.push(result)
        }
      }

      return jsonWithOptionalSessionCookie({ ok: true, holds }, { setAnonymousSessionId })
    }

    const numeric = normalizeShopifyProductId(body.shopifyProductId?.trim() ?? '')
    if (!numeric) {
      return NextResponse.json({ error: 'shopifyProductId required' }, { status: 400 })
    }

    const result = await upsertCartEditionHold(svc, holderKey, numeric)
    if ('error' in result) {
      if (result.error === 'table_missing') {
        return jsonWithOptionalSessionCookie(
          { error: 'Edition holds not available' },
          { status: 503, setAnonymousSessionId }
        )
      }
      if (result.error === 'sold_out') {
        return NextResponse.json({ error: 'Edition is sold out' }, { status: 400 })
      }
      if (result.error === 'not_found') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
    }

    return jsonWithOptionalSessionCookie({ ok: true, hold: result }, { setAnonymousSessionId })
  } catch (e) {
    console.error('[cart/edition-holds POST]', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

/**
 * DELETE /api/shop/cart/edition-holds { shopifyProductId? }
 * Omit shopifyProductId to clear all holds for this session.
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { holderKey } = await resolveCartEditionHoldHolderKey(cookieStore)
    const body = (await request.json().catch(() => ({}))) as { shopifyProductId?: string }
    const svc = createServiceClient()

    const numeric = body.shopifyProductId
      ? normalizeShopifyProductId(body.shopifyProductId.trim())
      : null

    if (numeric) {
      await deleteCartEditionHold(svc, holderKey, numeric)
    } else {
      await deleteCartEditionHoldsNotInProducts(svc, holderKey, [])
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[cart/edition-holds DELETE]', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
