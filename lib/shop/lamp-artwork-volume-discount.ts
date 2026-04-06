/**
 * Per-artwork discount ladder on the Street lamp in the shop experience.
 * When disabled, each lamp line uses full `lampPrice`; checkout line items match UI totals.
 *
 * Set `LAMP_ARTWORK_VOLUME_DISCOUNT_ENABLED` to `true` to restore:
 * `DISCOUNT_PER_ARTWORK_PCT` off the lamp per artwork allocated to that lamp, capped at 100%
 * after `ARTWORKS_PER_FREE_LAMP` artworks.
 */
export const LAMP_ARTWORK_VOLUME_DISCOUNT_ENABLED = false

/** Artworks allocated toward each lamp's discount ladder (when enabled). */
export const ARTWORKS_PER_FREE_LAMP = 14

/** Percent discount on the lamp per allocated artwork (when enabled). */
export const DISCOUNT_PER_ARTWORK_PCT = 7.5

export function lampVolumeDiscountPercentForAllocated(allocated: number): number {
  if (!LAMP_ARTWORK_VOLUME_DISCOUNT_ENABLED) return 0
  return Math.min(allocated * DISCOUNT_PER_ARTWORK_PCT, 100)
}

export function lampVolumeProgressPercentForAllocated(allocated: number): number {
  if (!LAMP_ARTWORK_VOLUME_DISCOUNT_ENABLED) return 0
  return Math.min(100, (allocated / ARTWORKS_PER_FREE_LAMP) * 100)
}
