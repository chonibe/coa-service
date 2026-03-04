/**
 * Vendor bio lookup by collection handle
 *
 * Fetches vendor bio from Supabase using vendor_collections.shopify_collection_handle.
 * Handles slugs like "jerome-masi" or "antonia-lev-1" (strips trailing -N for lookup).
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get vendor bio and name by collection handle.
 * Tries exact handle first, then handle with trailing -N stripped (e.g. "antonia-lev-1" -> "antonia-lev").
 */
export async function getVendorBioByHandle(handle: string): Promise<{
  bio?: string
  vendorName?: string
} | null> {
  const supabase = createClient()

  const handleBase = handle.replace(/-\d+$/, '')
  const handlesToTry = [...new Set([handle, handleBase].filter(Boolean))]

  for (const h of handlesToTry) {
    const { data: vc } = await supabase
      .from('vendor_collections')
      .select('vendor_id, vendor_name')
      .eq('shopify_collection_handle', h)
      .maybeSingle()

    if (vc?.vendor_id) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('bio, vendor_name')
        .eq('id', vc.vendor_id)
        .maybeSingle()

      if (vendor?.bio?.trim()) {
        return {
          bio: vendor.bio.trim(),
          vendorName: vendor.vendor_name ?? vc.vendor_name,
        }
      }
      if (vendor?.vendor_name) {
        return { vendorName: vendor.vendor_name }
      }
      return { vendorName: vc.vendor_name }
    }
  }

  return null
}
