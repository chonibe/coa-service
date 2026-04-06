import { createClient } from '@/lib/supabase/server'
import {
  mergeShopDiscountSettingsWithDefaults,
  parseStoredShopDiscountSettings,
  SHOP_DISCOUNT_FLAGS_KEY,
  type ShopDiscountFlags,
  type ShopDiscountSettings,
} from '@/lib/shop/shop-discount-flags'

async function loadShopDiscountSettingsRow(): Promise<ShopDiscountSettings> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SHOP_DISCOUNT_FLAGS_KEY)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('[getShopDiscountSettings] query error:', error.message)
      return mergeShopDiscountSettingsWithDefaults(null)
    }

    const parsed = parseStoredShopDiscountSettings(data?.value ?? null)
    return mergeShopDiscountSettingsWithDefaults(parsed)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('fetch failed') || msg.includes('Failed to fetch')) {
      console.warn(
        '[getShopDiscountSettings] Supabase unreachable (fetch failed). For local dev: set NEXT_PUBLIC_SUPABASE_URL / keys (e.g. vercel env pull) and check VPN/firewall.',
        e
      )
    } else {
      console.warn('[getShopDiscountSettings] failed:', e)
    }
    return mergeShopDiscountSettingsWithDefaults(null)
  }
}

/**
 * Load merged shop discount settings from `system_settings` (service role).
 * On error or missing row, returns defaults via merge.
 */
export async function getShopDiscountSettings(): Promise<ShopDiscountSettings> {
  return loadShopDiscountSettingsRow()
}

/**
 * Load merged shop discount flags (lamp ladder toggle only).
 */
export async function getShopDiscountFlags(): Promise<ShopDiscountFlags> {
  const s = await loadShopDiscountSettingsRow()
  return s.flags
}
