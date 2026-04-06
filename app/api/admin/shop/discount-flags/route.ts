import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-session'
import { isAdminEmail } from '@/lib/vendor-auth'
import { getUnifiedSession, isUnifiedAuthEnabled, sessionHasRole } from '@/lib/auth/unified-session'
import { getShopDiscountFlags } from '@/lib/shop/get-shop-discount-flags'
import {
  mergeShopDiscountFlagsWithDefaults,
  parseStoredShopDiscountFlags,
  pickShopDiscountFlagUpdates,
  SHOP_DISCOUNT_FLAGS_KEY,
  SHOP_DISCOUNT_REGISTRY,
  type ShopDiscountFlags,
} from '@/lib/shop/shop-discount-flags'

async function requireAdminApi(): Promise<{ ok: true; email: string } | { ok: false; status: number }> {
  if (isUnifiedAuthEnabled()) {
    const session = await getUnifiedSession()
    if (session && sessionHasRole(session, 'admin')) {
      return { ok: true, email: session.email }
    }
    return { ok: false, status: 401 }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(token)
  if (payload?.email && isAdminEmail(payload.email)) {
    return { ok: true, email: payload.email }
  }
  return { ok: false, status: 401 }
}

/**
 * GET /api/admin/shop/discount-flags
 * Merged flags + registry for the admin UI.
 */
export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: auth.status })
  }

  const flags = await getShopDiscountFlags()
  return NextResponse.json({
    flags,
    registry: SHOP_DISCOUNT_REGISTRY,
  })
}

/**
 * PATCH /api/admin/shop/discount-flags
 * Body: partial flags, e.g. `{ "lampArtworkVolume": true }`
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates = pickShopDiscountFlagUpdates(body)
  if (!updates) {
    return NextResponse.json(
      { error: 'No valid discount flag fields provided' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  const { data: row } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', SHOP_DISCOUNT_FLAGS_KEY)
    .maybeSingle()

  const parsed = parseStoredShopDiscountFlags(row?.value ?? null)
  const current = mergeShopDiscountFlagsWithDefaults(parsed)
  const next: ShopDiscountFlags = { ...current, ...updates }

  const { error: upsertError } = await supabase.from('system_settings').upsert(
    {
      key: SHOP_DISCOUNT_FLAGS_KEY,
      value: next as unknown as Record<string, boolean>,
      description: 'Shop experience discount toggles (admin-managed)',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  )

  if (upsertError) {
    console.error('[discount-flags] upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    flags: next,
    registry: SHOP_DISCOUNT_REGISTRY,
  })
}
