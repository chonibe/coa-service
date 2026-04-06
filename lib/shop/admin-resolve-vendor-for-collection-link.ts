import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getVendorCollectionHandle } from '@/lib/shopify/collections'

type AppSupabase = SupabaseClient<Database>

/**
 * Find a vendors row for linking a Shopify collection in admin.
 * Shopify product vendor names do not always exist in `vendors` yet; this tries several strategies.
 */
export async function resolveVendorForCollectionLink(
  supabase: AppSupabase,
  options: {
    /** Display name from Shopify (e.g. artist list) */
    vendorName: string
    /** Slug from artists API (often matches collection handle after pairing) */
    artistSlug?: string | null
    /** Resolved collection handle from Shopify */
    collectionHandle?: string | null
  },
): Promise<{ id: number; vendor_name: string } | null> {
  const name = options.vendorName.trim()
  if (!name) return null

  const { data: eq1 } = await supabase.from('vendors').select('id, vendor_name').eq('vendor_name', name).maybeSingle()
  if (eq1) return eq1

  const { data: il1 } = await supabase.from('vendors').select('id, vendor_name').ilike('vendor_name', name).maybeSingle()
  if (il1) return il1

  const handles = [...new Set([options.artistSlug, options.collectionHandle].filter(Boolean) as string[])]

  for (const h of handles) {
    const { data: vc } = await supabase
      .from('vendor_collections')
      .select('vendor_id')
      .eq('shopify_collection_handle', h)
      .maybeSingle()
    if (vc?.vendor_id != null) {
      const { data: v } = await supabase.from('vendors').select('id, vendor_name').eq('id', vc.vendor_id).maybeSingle()
      if (v) return v
    }
  }

  const { data: slugCandidates, error: listErr } = await supabase
    .from('vendors')
    .select('id, vendor_name')
    .limit(4000)

  if (!listErr && slugCandidates?.length) {
    for (const v of slugCandidates) {
      const slugified = getVendorCollectionHandle(v.vendor_name)
      for (const h of handles) {
        if (h && slugified === h) return v
      }
    }
  }

  return null
}

/**
 * Insert a minimal vendors row so vendor_collections FK can be satisfied.
 * Idempotent if vendor_name already exists (unique) — caller should re-select.
 */
export async function ensureVendorRowForShopifyArtist(
  supabase: AppSupabase,
  vendorName: string,
): Promise<{ id: number; vendor_name: string } | null> {
  const name = vendorName.trim()
  if (!name) return null

  const existing = await resolveVendorForCollectionLink(supabase, {
    vendorName: name,
    artistSlug: getVendorCollectionHandle(name),
  })
  if (existing) return existing

  const { data: inserted, error } = await supabase
    .from('vendors')
    .insert({
      vendor_name: name,
      status: 'active',
      notes: 'Created automatically when linking a Shopify collection (admin → Artist Experience Links).',
    })
    .select('id, vendor_name')
    .maybeSingle()

  if (!error && inserted) return inserted

  const { data: again } = await supabase.from('vendors').select('id, vendor_name').ilike('vendor_name', name).maybeSingle()
  return again ?? null
}
