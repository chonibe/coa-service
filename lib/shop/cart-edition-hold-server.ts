import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getStreetPricingStage,
  streetSeasonFromTotalEditions,
} from '@/lib/shop/street-collector-pricing-stages'
import {
  computeReservedEditionNumber,
  isCartEditionHoldActive,
  resolveCartEditionHoldEditionNumber,
  resolveCartEditionHoldExpiresAt,
} from '@/lib/shop/compute-cart-edition-reserve'
import type { CartEditionHold } from '@/lib/shop/cart-edition-hold-types'

type HoldRow = {
  shopify_product_id: string
  edition_number: number | null
  locked_price_cents: number | null
  expires_at: string
}

function rowToHold(row: HoldRow): CartEditionHold | null {
  if (!isCartEditionHoldActive(row.expires_at)) return null
  const lockedPriceUsd =
    row.locked_price_cents != null && row.locked_price_cents > 0
      ? Math.round((row.locked_price_cents / 100) * 100) / 100
      : null
  return {
    shopifyProductId: row.shopify_product_id,
    editionNumber: row.edition_number,
    lockedPriceUsd,
    expiresAt: row.expires_at,
  }
}

export function isExperienceCartEditionHoldsTableMissing(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || !!error.message?.includes('does not exist')
}

export async function listActiveCartEditionHoldsForHolder(
  supabase: SupabaseClient,
  holderKey: string
): Promise<CartEditionHold[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('experience_cart_edition_holds')
    .select('shopify_product_id, edition_number, locked_price_cents, expires_at')
    .eq('holder_key', holderKey)
    .gt('expires_at', now)

  if (error) {
    if (isExperienceCartEditionHoldsTableMissing(error)) return []
    throw error
  }

  return (data as HoldRow[] | null)?.map(rowToHold).filter((h): h is CartEditionHold => h != null) ?? []
}

export async function getActiveCartEditionHoldForHolderProduct(
  supabase: SupabaseClient,
  holderKey: string,
  shopifyProductId: string
): Promise<CartEditionHold | null> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('experience_cart_edition_holds')
    .select('shopify_product_id, edition_number, locked_price_cents, expires_at')
    .eq('holder_key', holderKey)
    .eq('shopify_product_id', shopifyProductId)
    .gt('expires_at', now)
    .maybeSingle()

  if (error) {
    if (isExperienceCartEditionHoldsTableMissing(error)) return null
    throw error
  }

  if (!data) return null
  return rowToHold(data as HoldRow)
}

export async function countActiveCartEditionHoldsForProduct(
  supabase: SupabaseClient,
  shopifyProductId: string,
  excludeHolderKey?: string
): Promise<number> {
  const now = new Date().toISOString()
  let q = supabase
    .from('experience_cart_edition_holds')
    .select('holder_key', { count: 'exact', head: true })
    .eq('shopify_product_id', shopifyProductId)
    .gt('expires_at', now)

  if (excludeHolderKey) {
    q = q.neq('holder_key', excludeHolderKey)
  }

  const { count, error } = await q
  if (error) {
    if (isExperienceCartEditionHoldsTableMissing(error)) return 0
    throw error
  }
  return count ?? 0
}

export async function upsertCartEditionHold(
  supabase: SupabaseClient,
  holderKey: string,
  shopifyProductId: string
): Promise<CartEditionHold | { error: 'sold_out' | 'not_found' | 'table_missing' }> {
  const existingHold = await getActiveCartEditionHoldForHolderProduct(
    supabase,
    holderKey,
    shopifyProductId
  )
  if (existingHold) {
    return existingHold
  }

  const productIdNum = parseInt(shopifyProductId, 10)
  if (!Number.isFinite(productIdNum)) {
    return { error: 'not_found' }
  }

  const { data: productRow, error: prodErr } = await supabase
    .from('products')
    .select('edition_counter, edition_size, first_edition_reserved')
    .eq('product_id', productIdNum)
    .maybeSingle()

  if (prodErr) {
    if (isExperienceCartEditionHoldsTableMissing(prodErr)) return { error: 'table_missing' }
    throw prodErr
  }
  if (!productRow) return { error: 'not_found' }

  const sold = Math.max(0, Math.floor(Number(productRow.edition_counter ?? 0)))
  const totalParsed =
    productRow.edition_size != null ? parseInt(String(productRow.edition_size), 10) : NaN
  const season = streetSeasonFromTotalEditions(Number.isFinite(totalParsed) ? totalParsed : 90)
  const stage = getStreetPricingStage(season, sold)
  if (stage.priceUsd == null) {
    return { error: 'sold_out' }
  }

  const { data: existingRow, error: existingErr } = await supabase
    .from('experience_cart_edition_holds')
    .select('edition_number, locked_price_cents, expires_at')
    .eq('holder_key', holderKey)
    .eq('shopify_product_id', shopifyProductId)
    .maybeSingle()

  if (existingErr) {
    if (isExperienceCartEditionHoldsTableMissing(existingErr)) return { error: 'table_missing' }
    throw existingErr
  }

  const priorRow = existingRow as HoldRow | null
  const existingActive =
    !!priorRow && isCartEditionHoldActive(priorRow.expires_at)

  const otherHolds = await countActiveCartEditionHoldsForProduct(supabase, shopifyProductId, holderKey)
  const computedEditionNumber = computeReservedEditionNumber(sold, otherHolds, {
    firstEditionReserved: !!productRow.first_edition_reserved,
  })
  const computedLockedPriceCents = Math.round(stage.priceUsd * 100)

  const expires_at = resolveCartEditionHoldExpiresAt(priorRow?.expires_at)
  const edition_number = resolveCartEditionHoldEditionNumber(
    priorRow?.edition_number,
    computedEditionNumber,
    priorRow?.expires_at
  )
  const locked_price_cents =
    existingActive && priorRow?.locked_price_cents != null
      ? priorRow.locked_price_cents
      : computedLockedPriceCents

  const { data, error } = await supabase
    .from('experience_cart_edition_holds')
    .upsert(
      {
        holder_key: holderKey,
        shopify_product_id: shopifyProductId,
        edition_number: edition_number,
        locked_price_cents,
        expires_at,
      },
      { onConflict: 'holder_key,shopify_product_id' }
    )
    .select('shopify_product_id, edition_number, locked_price_cents, expires_at')
    .single()

  if (error) {
    if (isExperienceCartEditionHoldsTableMissing(error)) return { error: 'table_missing' }
    throw error
  }

  const hold = rowToHold(data as HoldRow)
  if (!hold) return { error: 'sold_out' }
  return hold
}

export async function deleteCartEditionHold(
  supabase: SupabaseClient,
  holderKey: string,
  shopifyProductId: string
): Promise<void> {
  const { error } = await supabase
    .from('experience_cart_edition_holds')
    .delete()
    .eq('holder_key', holderKey)
    .eq('shopify_product_id', shopifyProductId)

  if (error && !isExperienceCartEditionHoldsTableMissing(error)) {
    throw error
  }
}

export async function deleteCartEditionHoldsNotInProducts(
  supabase: SupabaseClient,
  holderKey: string,
  shopifyProductIds: string[]
): Promise<void> {
  const keep = new Set(shopifyProductIds.filter(Boolean))
  const { data: existing, error: fetchErr } = await supabase
    .from('experience_cart_edition_holds')
    .select('shopify_product_id')
    .eq('holder_key', holderKey)

  if (fetchErr) {
    if (isExperienceCartEditionHoldsTableMissing(fetchErr)) return
    throw fetchErr
  }

  const toRemove = (existing || [])
    .map((row) => String((row as { shopify_product_id?: string }).shopify_product_id ?? ''))
    .filter((id) => id && !keep.has(id))

  if (toRemove.length === 0) return

  const { error } = await supabase
    .from('experience_cart_edition_holds')
    .delete()
    .eq('holder_key', holderKey)
    .in('shopify_product_id', toRemove)

  if (error && !isExperienceCartEditionHoldsTableMissing(error)) {
    throw error
  }
}
