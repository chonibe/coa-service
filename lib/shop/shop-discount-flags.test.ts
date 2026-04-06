import {
  DEFAULT_SHOP_DISCOUNT_FLAGS,
  mergeShopDiscountFlagsWithDefaults,
  mergeShopDiscountSettingsWithDefaults,
  parseStoredShopDiscountFlags,
  parseStoredShopDiscountSettings,
  pickShopDiscountFlagUpdates,
  pickShopDiscountSettingsUpdates,
} from './shop-discount-flags'

describe('shop-discount-flags', () => {
  it('mergeShopDiscountFlagsWithDefaults fills missing keys', () => {
    expect(mergeShopDiscountFlagsWithDefaults(null)).toEqual(DEFAULT_SHOP_DISCOUNT_FLAGS)
    expect(mergeShopDiscountFlagsWithDefaults({})).toEqual(DEFAULT_SHOP_DISCOUNT_FLAGS)
    expect(mergeShopDiscountFlagsWithDefaults({ lampArtworkVolume: true })).toEqual({
      ...DEFAULT_SHOP_DISCOUNT_FLAGS,
      lampArtworkVolume: true,
    })
    expect(mergeShopDiscountFlagsWithDefaults({ shippingFreeOver70: true })).toEqual({
      ...DEFAULT_SHOP_DISCOUNT_FLAGS,
      shippingFreeOver70: true,
    })
  })

  it('mergeShopDiscountSettingsWithDefaults applies shippingFreeOver70 from stored JSON', () => {
    const parsed = parseStoredShopDiscountSettings({ shippingFreeOver70: true })
    expect(mergeShopDiscountSettingsWithDefaults(parsed).flags.shippingFreeOver70).toBe(true)
  })

  it('parseStoredShopDiscountFlags accepts JSON string or object', () => {
    expect(parseStoredShopDiscountFlags('{"lampArtworkVolume":true}')).toEqual({
      lampArtworkVolume: true,
    })
    expect(parseStoredShopDiscountFlags({ lampArtworkVolume: false })).toEqual({
      lampArtworkVolume: false,
    })
    expect(parseStoredShopDiscountFlags('{"shippingFreeOver70":true}')).toEqual({
      shippingFreeOver70: true,
    })
    expect(parseStoredShopDiscountFlags('not json')).toBeNull()
    expect(parseStoredShopDiscountFlags(null)).toBeNull()
  })

  it('pickShopDiscountFlagUpdates only returns known boolean keys', () => {
    expect(pickShopDiscountFlagUpdates({ lampArtworkVolume: true, unknown: true })).toEqual({
      lampArtworkVolume: true,
    })
    expect(pickShopDiscountFlagUpdates({ shippingFreeOver70: false })).toEqual({
      shippingFreeOver70: false,
    })
    expect(pickShopDiscountFlagUpdates({})).toBeNull()
    expect(pickShopDiscountFlagUpdates(null)).toBeNull()
  })

  it('pickShopDiscountSettingsUpdates accepts shippingFreeOver70', () => {
    expect(pickShopDiscountSettingsUpdates({ shippingFreeOver70: true })).toEqual({
      shippingFreeOver70: true,
    })
  })
})
