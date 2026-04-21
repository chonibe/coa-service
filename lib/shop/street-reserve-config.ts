/** Active subscription tier (single $20/mo product). Legacy tiers remain for existing Stripe rows. */
export type StreetReserveTierId = 'reserve' | 'collector' | 'curator' | 'patron'

export const STREET_RESERVE_TIER_LOCK_DAYS: Record<StreetReserveTierId, number> = {
  reserve: 30,
  collector: 30,
  curator: 60,
  patron: 90,
}

export function streetReserveStripePriceIdEnvKey(tier: StreetReserveTierId): string {
  if (tier === 'reserve') return 'STREET_RESERVE_STRIPE_PRICE_RESERVE'
  const map: Record<Exclude<StreetReserveTierId, 'reserve'>, string> = {
    collector: 'STREET_RESERVE_STRIPE_PRICE_COLLECTOR',
    curator: 'STREET_RESERVE_STRIPE_PRICE_CURATOR',
    patron: 'STREET_RESERVE_STRIPE_PRICE_PATRON',
  }
  return map[tier]
}

/** Tier id written to new Checkout sessions for The Reserve. */
export const STREET_RESERVE_CHECKOUT_TIER: StreetReserveTierId = 'reserve'
