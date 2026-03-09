/**
 * Affiliate program utilities
 * Resolves artist ref (slug or vendor_id) to vendor_id for attribution.
 */

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Cookie name for storing affiliate ref (14 days TTL) */
export const AFFILIATE_REF_COOKIE = 'affiliate_ref'
export const AFFILIATE_REF_MAX_AGE_DAYS = 14

/** Commission rate for lamp sales via affiliate link */
export const AFFILIATE_COMMISSION_RATE = 0.1

/** Lamp SKUs that qualify for affiliate commission */
export const LAMP_SKUS = ['streetlamp001', 'streetlamp002'] as const

/** Lamp product handles (fallback if SKU not available) */
export const LAMP_HANDLES = ['a-street-lamp', 'street_lamp'] as const

/**
 * Resolve ref (slug or vendor id string) to vendor_id (integer).
 * Used server-side when creating checkout to attribute an order to an affiliate.
 *
 * @param ref - Artist slug (e.g. "john-doe") or vendor id as string
 * @param supabase - Optional client (creates one if not provided)
 * @returns vendor_id (number) or null if not found
 */
export async function resolveRefToVendorId(
  ref: string | null | undefined,
  supabase?: SupabaseClient
): Promise<number | null> {
  if (!ref?.trim()) return null

  const client = supabase || createClient()
  const trimmed = ref.trim()

  // If ref looks like a numeric ID, try direct lookup
  const numericId = parseInt(trimmed, 10)
  if (!isNaN(numericId) && numericId > 0) {
    const { data: vendor } = await client
      .from('vendors')
      .select('id')
      .eq('id', numericId)
      .maybeSingle()
    return vendor?.id ?? null
  }

  // Try vendor_collections by shopify_collection_handle (slug)
  const handlesToTry = [trimmed, trimmed.replace(/-\d+$/, '')].filter(Boolean)
  for (const h of [...new Set(handlesToTry)]) {
    const { data: vc } = await client
      .from('vendor_collections')
      .select('vendor_id')
      .eq('shopify_collection_handle', h)
      .maybeSingle()
    if (vc?.vendor_id) return vc.vendor_id
  }

  // Fallback: vendors by vendor_name ilike
  const artistNameForMatch = trimmed.replace(/-/g, ' ').trim()
  const artistNameBase = trimmed.replace(/-\d+$/, '').replace(/-/g, ' ').trim()
  for (const nameToTry of [artistNameForMatch, artistNameBase]) {
    if (!nameToTry) continue
    const { data: vendor } = await client
      .from('vendors')
      .select('id')
      .ilike('vendor_name', nameToTry)
      .maybeSingle()
    if (vendor) return vendor.id
  }

  return null
}

/**
 * Check if a line item is a lamp (eligible for affiliate commission).
 * Uses SKU from order_line_items_v2 or raw_shopify_order_data.
 */
export function isLampLineItem(
  lineItem: { sku?: string | null; name?: string | null },
  rawOrderData?: { line_items?: Array<{ sku?: string; product_id?: string; name?: string }> } | null,
  lineItemId?: string
): boolean {
  // Check line item SKU
  const sku = (lineItem.sku || '').toLowerCase().trim()
  if (LAMP_SKUS.some((l) => sku === l.toLowerCase())) return true
  if (sku.startsWith('streetlamp')) return true

  // Check line item name for lamp keywords
  const name = (lineItem.name || '').toLowerCase()
  if (name.includes('street lamp') || name.includes('streetlamp')) return true

  // Fallback: check raw Shopify order line items
  if (rawOrderData?.line_items && lineItemId) {
    const shopifyLine = rawOrderData.line_items.find(
      (li: { id?: string | number }) => li.id?.toString() === lineItemId.toString()
    )
    if (shopifyLine) {
      const sl = shopifyLine as { sku?: string; name?: string }
      const liSku = (sl.sku || '').toLowerCase()
      if (LAMP_SKUS.some((l) => liSku === l.toLowerCase()) || liSku.startsWith('streetlamp'))
        return true
      const liName = (sl.name || '').toLowerCase()
      if (liName.includes('street lamp') || liName.includes('streetlamp')) return true
    }
  }

  return false
}
