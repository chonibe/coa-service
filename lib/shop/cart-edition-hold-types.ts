export type CartEditionHold = {
  /** Numeric Shopify product id string. */
  shopifyProductId: string
  /** Projected edition number held for checkout (soft hold). */
  editionNumber: number | null
  /** Ladder price frozen at hold time (USD). */
  lockedPriceUsd: number | null
  expiresAt: string
}
