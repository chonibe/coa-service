import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/client'
import { capturePostHogServerEvent } from '@/lib/posthog-server'
import {
  getEditionStageCopy,
  type EditionStageKey,
} from '@/lib/shop/edition-stages'
import { fetchAdminProductEditionState } from '@/lib/shop/admin-product-edition-state'
import { getStreetPricingStageDisplay, streetSeasonFromTotalEditions } from '@/lib/shop/street-collector-pricing-stages'

function shopProductUrl(handle: string | null | undefined): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SHOP_URL || ''
  if (handle && base) {
    return `${base.replace(/\/$/, '')}/shop/${handle}`
  }
  return base || 'https://thestreetcollector.com'
}

function interpolateCtx(
  stage: EditionStageKey,
  artist: string,
  editionSold: number,
  total: number
) {
  const remaining = Math.max(0, total - editionSold)
  const x = editionSold
  const n = Math.min(total, editionSold + 1)
  return { artist: artist.trim() || 'this artist', x, n, total, remaining }
}

/**
 * After a product update webhook, refresh edition stage from Admin API; if stage changed,
 * email watchers who have not yet been notified for the new stage.
 */
export async function processEditionWatchlistStageChange(shopifyProductId: string): Promise<void> {
  const state = await fetchAdminProductEditionState(shopifyProductId)
  if (!state) return

  const supabase = createClient()

  const { data: prevRow } = await supabase
    .from('edition_product_edition_stage_state')
    .select('stage_key, edition_sold')
    .eq('shopify_product_id', shopifyProductId)
    .maybeSingle()

  const prevStage = prevRow?.stage_key as EditionStageKey | undefined

  await supabase.from('edition_product_edition_stage_state').upsert(
    {
      shopify_product_id: shopifyProductId,
      stage_key: state.stage,
      edition_sold: state.editionSold,
      total_editions: state.totalEditions,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'shopify_product_id' }
  )

  // First snapshot only — do not email all watchers on cold start.
  if (prevStage == null || prevStage === state.stage) return

  const { data: watchers, error: wErr } = await supabase
    .from('edition_watchlist')
    .select('id, user_id, product_title, product_handle, artist_name')
    .eq('shopify_product_id', shopifyProductId)

  if (wErr || !watchers?.length) return

  for (const row of watchers) {
    const { data: existing } = await supabase
      .from('edition_watchlist_stage_notifications')
      .select('id')
      .eq('watchlist_id', row.id)
      .eq('stage_key', state.stage)
      .maybeSingle()

    if (existing) continue

    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(row.user_id)
    if (userErr || !userData?.user?.email) continue
    const email = userData.user.email

    const ctx = interpolateCtx(
      state.stage,
      row.artist_name || 'the artist',
      state.editionSold,
      state.totalEditions
    )
    const copy = getEditionStageCopy(state.stage, ctx)

    const te = state.totalEditions
    let streetLine = ''
    let streetStageKey: string | undefined
    let streetStagePriceUsd: number | undefined
    if (te === 90 || te === 44) {
      const season = streetSeasonFromTotalEditions(te)
      const disp = getStreetPricingStageDisplay(season, state.editionSold)
      streetStageKey = disp.stageKey
      if (disp.priceUsd != null) {
        streetStagePriceUsd = disp.priceUsd
        streetLine = `${disp.label} — $${disp.priceUsd}`
      }
    }

    const productUrl = shopProductUrl(row.product_handle)
    const title = row.product_title || 'An edition you are watching'
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
        <h1 style="font-size: 18px;">${copy.emailSubject}</h1>
        <p style="color: #444; line-height: 1.5;">${copy.emailBody}</p>
        ${streetLine ? `<p style="color: #222; font-weight: 600; margin-top: 12px;">Street Collector ladder: ${streetLine}</p>` : ''}
        <p style="margin-top: 20px;"><strong>${title}</strong></p>
        <p style="margin-top: 16px;">
          <a href="${productUrl}" style="display: inline-block; padding: 12px 20px; background: #047AFF; color: #fff; text-decoration: none; border-radius: 8px;">View edition</a>
        </p>
        <p style="font-size: 12px; color: #888; margin-top: 24px;">You received this because you are watching this edition on Street Collector.</p>
      </div>
    `

    const sendRes = await sendEmail({
      to: email,
      subject: `${copy.emailSubject} — ${title}`,
      html,
    })

    if (!sendRes.success) {
      console.error('[edition-watchlist] Email failed:', sendRes.error)
      continue
    }

    await supabase.from('edition_watchlist_stage_notifications').insert({
      watchlist_id: row.id,
      stage_key: state.stage,
    })

    await capturePostHogServerEvent('watchlist_notification_sent', email, {
      artwork_id: shopifyProductId,
      trigger_type: 'edition_stage_change',
      stage: state.stage,
      street_stage_key: streetStageKey,
      street_stage_price_usd: streetStagePriceUsd,
      street_pricing_line: streetLine || undefined,
    })
  }
}
