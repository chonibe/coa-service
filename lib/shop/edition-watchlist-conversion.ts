import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { capturePostHogServerEvent } from '@/lib/posthog-server'

type ServiceClient = SupabaseClient<Database>

/**
 * On paid order, if the customer had this product on their edition watchlist, emit PostHog once per order+watch row.
 */
export async function processWatchlistConversionOnOrder(
  order: { id?: string | number; email?: string; customer?: { email?: string }; processed_at?: string; line_items?: Array<{ product_id?: string | number }> },
  supabase: ServiceClient
): Promise<void> {
  const email = (order.email || order.customer?.email)?.toLowerCase()?.trim()
  if (!email || !order.id) return

  const { data: profile } = await supabase
    .from('collector_profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()

  const userId = profile?.user_id
  if (!userId) return

  const orderId = order.id.toString()
  const processedAt = order.processed_at ? new Date(order.processed_at).getTime() : Date.now()

  const productIds = new Set<string>()
  for (const item of order.line_items || []) {
    const pid = item.product_id?.toString()
    if (pid) productIds.add(pid)
  }

  for (const productId of productIds) {
    const { data: wl } = await supabase
      .from('edition_watchlist')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('shopify_product_id', productId)
      .maybeSingle()

    if (!wl) continue

    const { error: insertErr } = await supabase.from('edition_watchlist_conversion_events').insert({
      order_id: orderId,
      watchlist_id: wl.id,
    })

    if (insertErr) continue

    const secondsSinceSave = Math.max(0, (processedAt - new Date(wl.created_at).getTime()) / 1000)
    await capturePostHogServerEvent('watchlist_converted', email, {
      artwork_id: productId,
      seconds_since_save: secondsSinceSave,
    })
  }
}
