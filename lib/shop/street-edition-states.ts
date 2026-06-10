import type { StreetPricingStageKey } from '@/lib/shop/street-collector-pricing-stages'

/**
 * Max product ids accepted per `GET /api/shop/edition-states` request.
 * The experience client batches larger catalogs into multiple requests.
 */
export const EDITION_STATES_MAX_IDS_PER_REQUEST = 120

/**
 * Shape of each item from `GET /api/shop/edition-states` used by the experience picker and cart pricing.
 */
export type StreetEditionStatesRow = {
  /** Ladder stage for badges and UI (added for artist-led storefront). */
  stageKey: StreetPricingStageKey
  label: string
  priceUsd: number | null
  subcopy: string
  nextBump:
    | { kind: 'price_rise'; nextPriceUsd: number; afterSales: number }
    | { kind: 'edition_end'; afterSales: number }
    | null
}
