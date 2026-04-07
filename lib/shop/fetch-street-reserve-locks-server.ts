import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Active Street reserve price locks for a Supabase auth user (`street_reserve_locks`).
 * Keys are numeric Shopify product id strings; values are USD (dollars).
 */
export async function fetchActiveStreetReserveLocksUsdByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('street_reserve_locks')
    .select('shopify_product_id, locked_price_cents')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return {}
    }
    console.error('[fetchActiveStreetReserveLocksUsdByUserId]', error)
    return {}
  }

  const out: Record<string, number> = {}
  for (const r of data || []) {
    const id = String((r as { shopify_product_id?: string }).shopify_product_id ?? '')
    const cents = Number((r as { locked_price_cents?: number }).locked_price_cents)
    if (!id || !Number.isFinite(cents)) continue
    const usd = Math.round((cents / 100) * 100) / 100
    if (usd > 0) out[id] = usd
  }
  return out
}
