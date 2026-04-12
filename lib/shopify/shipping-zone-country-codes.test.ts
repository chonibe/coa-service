import {
  parseShippingZonesToCountries,
  resolveShipToCountriesForDisplay,
  STORE_SHIP_TO_COUNTRIES,
} from './shipping-zone-country-codes'

describe('parseShippingZonesToCountries', () => {
  it('returns empty for invalid payload', () => {
    expect(parseShippingZonesToCountries(null)).toEqual([])
    expect(parseShippingZonesToCountries({})).toEqual([])
    expect(parseShippingZonesToCountries({ shipping_zones: 'x' })).toEqual([])
  })

  it('dedupes by code, sorts by name, uppercases codes', () => {
    const parsed = parseShippingZonesToCountries({
      shipping_zones: [
        {
          countries: [
            { code: 'us', name: 'United States' },
            { code: 'US', name: 'United States' },
            { code: 'CA', name: 'Canada' },
          ],
        },
        {
          countries: [{ code: 'CA', name: 'Canada' }],
        },
      ],
    })
    expect(parsed).toEqual([
      { code: 'CA', name: 'Canada' },
      { code: 'US', name: 'United States' },
    ])
  })

  it('ignores rows missing name or code', () => {
    expect(
      parseShippingZonesToCountries({
        shipping_zones: [{ countries: [{ code: 'US' }, { name: 'Nada' }, { code: 'GB', name: 'United Kingdom' }] }],
      })
    ).toEqual([{ code: 'GB', name: 'United Kingdom' }])
  })
})

describe('STORE_SHIP_TO_COUNTRIES', () => {
  it('has 47 policy countries with unique codes', () => {
    expect(STORE_SHIP_TO_COUNTRIES).toHaveLength(47)
    const codes = new Set(STORE_SHIP_TO_COUNTRIES.map((c) => c.code))
    expect(codes.size).toBe(47)
  })
})

describe('resolveShipToCountriesForDisplay', () => {
  it('uses Shopify label when code matches', () => {
    const rows = resolveShipToCountriesForDisplay([{ code: 'US', name: 'USA (Shopify)' }])
    const us = rows.find((r) => r.code === 'US')
    expect(us?.name).toBe('USA (Shopify)')
  })

  it('falls back to canonical name when Shopify has no row', () => {
    const rows = resolveShipToCountriesForDisplay([])
    const vn = rows.find((r) => r.code === 'VN')
    expect(vn?.name).toBe('Vietnam')
  })

  it('drops Shopify-only codes not in canonical list', () => {
    const rows = resolveShipToCountriesForDisplay([{ code: 'BR', name: 'Brazil' }])
    expect(rows.some((r) => r.code === 'BR')).toBe(false)
    expect(rows).toHaveLength(47)
  })
})
