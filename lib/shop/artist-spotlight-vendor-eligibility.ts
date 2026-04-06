import type { createClient } from '@/lib/supabase/server'

type Supabase = ReturnType<typeof createClient>

/**
 * Map Shopify vendor_name → eligible for automatic spotlight (not ?artist= links).
 * Vendors with no row in public.vendors are treated as eligible (default on).
 */
export async function buildVendorSpotlightEligibilityMap(
  supabase: Supabase,
  vendorNames: string[]
): Promise<Map<string, boolean>> {
  const unique = [...new Set(vendorNames.filter(Boolean))]
  const map = new Map<string, boolean>()
  for (const n of unique) map.set(n, true)

  if (unique.length === 0) return map

  const { data } = await supabase
    .from('vendors')
    .select('vendor_name, artist_spotlight_enabled')
    .in('vendor_name', unique)

  for (const row of data ?? []) {
    const eligible = row.artist_spotlight_enabled !== false
    map.set(row.vendor_name, eligible)
  }
  return map
}

export function firstEligibleProductIndex(
  vendors: (string | null | undefined)[],
  eligibility: Map<string, boolean>,
  options?: { skipVendor?: (name: string) => boolean }
): number {
  for (let i = 0; i < vendors.length; i++) {
    const name = vendors[i]?.trim()
    if (!name) continue
    if (options?.skipVendor?.(name)) continue
    if (eligibility.get(name) === false) continue
    return i
  }
  return -1
}
