import {
  ARTWORKS_PER_FREE_LAMP,
  DISCOUNT_PER_ARTWORK_PCT,
  lampVolumeDiscountPercentForAllocated,
  lampVolumeProgressPercentForAllocated,
} from './lamp-artwork-volume-discount'

describe('lamp-artwork-volume-discount', () => {
  it('exports ladder constants', () => {
    expect(ARTWORKS_PER_FREE_LAMP).toBe(14)
    expect(DISCOUNT_PER_ARTWORK_PCT).toBe(7.5)
  })

  it('applies no discount or progress when disabled', () => {
    expect(lampVolumeDiscountPercentForAllocated(1, false)).toBe(0)
    expect(lampVolumeDiscountPercentForAllocated(14, false)).toBe(0)
    expect(lampVolumeProgressPercentForAllocated(7, false)).toBe(0)
  })

  it('applies ladder when enabled', () => {
    expect(lampVolumeDiscountPercentForAllocated(1, true)).toBe(7.5)
    expect(lampVolumeDiscountPercentForAllocated(2, true)).toBe(15)
    expect(lampVolumeDiscountPercentForAllocated(14, true)).toBe(100)
    expect(lampVolumeDiscountPercentForAllocated(20, true)).toBe(100)
    expect(lampVolumeProgressPercentForAllocated(7, true)).toBe(50)
    expect(lampVolumeProgressPercentForAllocated(14, true)).toBe(100)
  })
})
