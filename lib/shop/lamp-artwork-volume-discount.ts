/**
 * Per-artwork discount ladder on the Street lamp in the shop experience.
 * Enable/disable is controlled by `lampArtworkVolume` in shop discount flags (admin / system_settings).
 *
 * When `enabled` is false, each lamp line uses full `lampPrice`; checkout line items match UI totals.
 * When true: `DISCOUNT_PER_ARTWORK_PCT` off the lamp per artwork allocated to that lamp, capped at 100%
 * after `ARTWORKS_PER_FREE_LAMP` artworks.
 */

/** Artworks allocated toward each lamp's discount ladder (when enabled). */
export const ARTWORKS_PER_FREE_LAMP = 14

/** Percent discount on the lamp per allocated artwork (when enabled). */
export const DISCOUNT_PER_ARTWORK_PCT = 7.5

export function lampVolumeDiscountPercentForAllocated(allocated: number, enabled: boolean): number {
  if (!enabled) return 0
  return Math.min(allocated * DISCOUNT_PER_ARTWORK_PCT, 100)
}

export function lampVolumeProgressPercentForAllocated(allocated: number, enabled: boolean): number {
  if (!enabled) return 0
  return Math.min(100, (allocated / ARTWORKS_PER_FREE_LAMP) * 100)
}
