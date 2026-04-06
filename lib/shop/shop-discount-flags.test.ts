import {
  DEFAULT_SHOP_DISCOUNT_FLAGS,
  mergeShopDiscountFlagsWithDefaults,
  parseStoredShopDiscountFlags,
  pickShopDiscountFlagUpdates,
} from './shop-discount-flags'

describe('shop-discount-flags', () => {
  it('mergeShopDiscountFlagsWithDefaults fills missing keys', () => {
    expect(mergeShopDiscountFlagsWithDefaults(null)).toEqual(DEFAULT_SHOP_DISCOUNT_FLAGS)
    expect(mergeShopDiscountFlagsWithDefaults({})).toEqual(DEFAULT_SHOP_DISCOUNT_FLAGS)
    expect(mergeShopDiscountFlagsWithDefaults({ lampArtworkVolume: true })).toEqual({
      ...DEFAULT_SHOP_DISCOUNT_FLAGS,
      lampArtworkVolume: true,
    })
  })

  it('parseStoredShopDiscountFlags accepts JSON string or object', () => {
    expect(parseStoredShopDiscountFlags('{"lampArtworkVolume":true}')).toEqual({
      lampArtworkVolume: true,
    })
    expect(parseStoredShopDiscountFlags({ lampArtworkVolume: false })).toEqual({
      lampArtworkVolume: false,
    })
    expect(parseStoredShopDiscountFlags('not json')).toBeNull()
    expect(parseStoredShopDiscountFlags(null)).toBeNull()
  })

  it('pickShopDiscountFlagUpdates only returns known boolean keys', () => {
    expect(pickShopDiscountFlagUpdates({ lampArtworkVolume: true, unknown: true })).toEqual({
      lampArtworkVolume: true,
    })
    expect(pickShopDiscountFlagUpdates({})).toBeNull()
    expect(pickShopDiscountFlagUpdates(null)).toBeNull()
  })
})
