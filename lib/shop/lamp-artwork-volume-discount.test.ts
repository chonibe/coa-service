import {
  ARTWORKS_PER_FREE_LAMP,
  DISCOUNT_PER_ARTWORK_PCT,
  LAMP_ARTWORK_VOLUME_DISCOUNT_ENABLED,
  lampVolumeDiscountPercentForAllocated,
  lampVolumeProgressPercentForAllocated,
} from './lamp-artwork-volume-discount'

describe('lamp-artwork-volume-discount', () => {
  it('keeps ladder constants for when the promo is re-enabled', () => {
    expect(ARTWORKS_PER_FREE_LAMP).toBe(14)
    expect(DISCOUNT_PER_ARTWORK_PCT).toBe(7.5)
  })

  it('applies no discount or progress while the feature flag is off', () => {
    expect(LAMP_ARTWORK_VOLUME_DISCOUNT_ENABLED).toBe(false)
    expect(lampVolumeDiscountPercentForAllocated(1)).toBe(0)
    expect(lampVolumeDiscountPercentForAllocated(14)).toBe(0)
    expect(lampVolumeProgressPercentForAllocated(7)).toBe(0)
  })
})
