/**
 * Shape of each item from `GET /api/shop/edition-states` used by the experience picker and cart pricing.
 */
export type StreetEditionStatesRow = {
  label: string
  priceUsd: number | null
  subcopy: string
  nextBump:
    | { kind: 'price_rise'; nextPriceUsd: number; afterSales: number }
    | { kind: 'edition_end'; afterSales: number }
    | null
}
