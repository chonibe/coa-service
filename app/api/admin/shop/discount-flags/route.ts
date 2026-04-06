import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-session'
import { isAdminEmail } from '@/lib/vendor-auth'
import { getUnifiedSession, isUnifiedAuthEnabled, sessionHasRole } from '@/lib/auth/unified-session'
import { getShopDiscountSettings } from '@/lib/shop/get-shop-discount-flags'
import {
  mergeShopDiscountSettingsWithDefaults,
  parseStoredShopDiscountSettings,
  pickShopDiscountSettingsUpdates,
  SHOP_DISCOUNT_FLAGS_KEY,
  SHOP_DISCOUNT_REGISTRY,
  type ShopDiscountSettings,
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

function settingsToStoredValue(s: ShopDiscountSettings): Record<string, unknown> {
  return {
    lampArtworkVolume: s.flags.lampArtworkVolume,
    featuredBundleEnabled: s.featuredBundle.enabled,
    featuredBundleMode: s.featuredBundle.mode,
    featuredBundleValue: s.featuredBundle.value,
  }
}

/**
 * GET /api/admin/shop/discount-flags
 * Merged flags, featured bundle pricing, and registry for the admin UI.
 */
export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: auth.status })
  }

  const settings = await getShopDiscountSettings()
  return NextResponse.json({
    flags: settings.flags,
    featuredBundle: settings.featuredBundle,
    registry: SHOP_DISCOUNT_REGISTRY,
  })
}

/**
 * PATCH /api/admin/shop/discount-flags
 * Body: partial fields, e.g. `{ "lampArtworkVolume": true }` or bundle keys.
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

  const updates = pickShopDiscountSettingsUpdates(body)
  if (!updates) {
    return NextResponse.json(
      { error: 'No valid discount fields provided' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  const { data: row } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', SHOP_DISCOUNT_FLAGS_KEY)
    .maybeSingle()

  const parsed = parseStoredShopDiscountSettings(row?.value ?? null)
  const current = mergeShopDiscountSettingsWithDefaults(parsed)

  const next: ShopDiscountSettings = {
    flags: {
      ...current.flags,
      ...(updates.lampArtworkVolume !== undefined ? { lampArtworkVolume: updates.lampArtworkVolume } : {}),
    },
    featuredBundle: {
      enabled:
        updates.featuredBundleEnabled !== undefined
          ? updates.featuredBundleEnabled
          : current.featuredBundle.enabled,
      mode: updates.featuredBundleMode ?? current.featuredBundle.mode,
      value:
        updates.featuredBundleValue !== undefined
          ? updates.featuredBundleValue
          : current.featuredBundle.value,
    },
  }

  const stored = settingsToStoredValue(next)

  const { error: upsertError } = await supabase.from('system_settings').upsert(
    {
      key: SHOP_DISCOUNT_FLAGS_KEY,
      value: stored as unknown as Record<string, unknown>,
      description: 'Shop experience discount toggles and bundle pricing (admin-managed)',
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
    flags: next.flags,
    featuredBundle: next.featuredBundle,
    registry: SHOP_DISCOUNT_REGISTRY,
  })
}
