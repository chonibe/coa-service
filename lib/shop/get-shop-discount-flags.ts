import { createClient } from '@/lib/supabase/server'
import {
  mergeShopDiscountFlagsWithDefaults,
  parseStoredShopDiscountFlags,
  SHOP_DISCOUNT_FLAGS_KEY,
  type ShopDiscountFlags,
} from '@/lib/shop/shop-discount-flags'

/**
 * Load merged shop discount flags from `system_settings` (service role).
 * On error or missing row, returns {@link DEFAULT_SHOP_DISCOUNT_FLAGS} via merge.
 */
export async function getShopDiscountFlags(): Promise<ShopDiscountFlags> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SHOP_DISCOUNT_FLAGS_KEY)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('[getShopDiscountFlags] query error:', error.message)
      return mergeShopDiscountFlagsWithDefaults(null)
    }

    const parsed = parseStoredShopDiscountFlags(data?.value ?? null)
    return mergeShopDiscountFlagsWithDefaults(parsed)
  } catch (e) {
    console.warn('[getShopDiscountFlags] failed:', e)
    return mergeShopDiscountFlagsWithDefaults(null)
  }
}
