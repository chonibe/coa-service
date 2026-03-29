export type StreetReserveTierId = 'collector' | 'curator' | 'patron'

export const STREET_RESERVE_TIER_LOCK_DAYS: Record<StreetReserveTierId, number> = {
  collector: 30,
  curator: 60,
  patron: 90,
}

export function streetReserveStripePriceIdEnvKey(tier: StreetReserveTierId): string {
  const map: Record<StreetReserveTierId, string> = {
    collector: 'STREET_RESERVE_STRIPE_PRICE_COLLECTOR',
    curator: 'STREET_RESERVE_STRIPE_PRICE_CURATOR',
    patron: 'STREET_RESERVE_STRIPE_PRICE_PATRON',
  }
  return map[tier]
}
