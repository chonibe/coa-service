import type { ShopifyProduct } from '../shopify/storefront-client'
import {
  allocateUsdByWeights,
  computeFeaturedBundleCheckoutPrices,
  computeFeaturedBundleRegularSubtotalUsd,
  FEATURED_ARTIST_BUNDLE_USD,
  getFeaturedBundleConsumedCartIndices,
  getSpotlightPairProducts,
  isFeaturedArtistBundleActive,
  isFeaturedBundleSpotlightPrintsPurchasable,
} from './experience-featured-bundle'

function mockProduct(
  id: string,
  opts: Partial<{ price: number; available: boolean }> = {}
): ShopifyProduct {
  const price = String(opts.price ?? 40)
  const z = { amount: price, currencyCode: 'USD' as const }
  return {
    id,
    handle: 'h',
    title: 'T',
    description: '',
    descriptionHtml: '',
    vendor: 'V',
    productType: '',
    tags: [],
    availableForSale: opts.available !== false,
    priceRange: { minVariantPrice: z, maxVariantPrice: z },
    compareAtPriceRange: { minVariantPrice: z, maxVariantPrice: z },
    featuredImage: null,
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
    metafields: null,
  }
}

describe('allocateUsdByWeights', () => {
  it('sums to target USD in cents', () => {
    const out = allocateUsdByWeights([100, 40, 40], 159)
    const cents = out.map((x) => Math.round(x * 100))
    expect(cents.reduce((a, b) => a + b, 0)).toBe(15900)
  })

  it('handles zero weights with equal split', () => {
    const out = allocateUsdByWeights([0, 0, 0], 159)
    expect(out.length).toBe(3)
    const cents = out.map((x) => Math.round(x * 100))
    expect(cents.reduce((a, b) => a + b, 0)).toBe(15900)
  })
})

describe('computeFeaturedBundleCheckoutPrices', () => {
  it('totals exactly targetBundleUsd', () => {
    const lampLines = [99]
    const art: [ShopifyProduct, ShopifyProduct] = [
      mockProduct('gid://shopify/Product/1', { price: 40 }),
      mockProduct('gid://shopify/Product/2', { price: 40 }),
    ]
    const r = computeFeaturedBundleCheckoutPrices({
      lampNaturalLines: lampLines,
      artProducts: art,
      targetBundleUsd: FEATURED_ARTIST_BUNDLE_USD,
    })
    const sum =
      r.lampLineUsd.reduce((a, b) => a + b, 0) +
      r.artworkUnitUsdByNumericId['1']! +
      r.artworkUnitUsdByNumericId['2']!
    expect(Math.round(sum * 100)).toBe(Math.round(FEATURED_ARTIST_BUNDLE_USD * 100))
  })
})

describe('computeFeaturedBundleRegularSubtotalUsd', () => {
  it('adds lamp lines and artwork units', () => {
    const total = computeFeaturedBundleRegularSubtotalUsd({
      lampNaturalLines: [99],
      artProducts: [
        mockProduct('gid://shopify/Product/1', { price: 40 }),
        mockProduct('gid://shopify/Product/2', { price: 40 }),
      ],
    })
    expect(total).toBe(179)
  })
})

describe('getSpotlightPairProducts', () => {
  it('returns null when fewer than two ids', () => {
    expect(getSpotlightPairProducts({ productIds: ['1'] }, [], [])).toBeNull()
  })

  it('resolves from allProducts', () => {
    const p1 = mockProduct('gid://shopify/Product/10')
    const p2 = mockProduct('gid://shopify/Product/20')
    const pair = getSpotlightPairProducts({ productIds: ['10', '20'] }, [], [p2, p1])
    expect(pair?.[0].id).toBe(p1.id)
    expect(pair?.[1].id).toBe(p2.id)
  })

  it('falls back to productsFromApi', () => {
    const p1 = mockProduct('gid://shopify/Product/10')
    const p2 = mockProduct('gid://shopify/Product/20')
    const pair = getSpotlightPairProducts({ productIds: ['10', '20'] }, [p1, p2], [])
    expect(pair).not.toBeNull()
  })
})

describe('isFeaturedBundleSpotlightPrintsPurchasable', () => {
  const pAvail = mockProduct('gid://shopify/Product/1')
  const pUnavail = mockProduct('gid://shopify/Product/2', { available: false })

  it('is true when both are availableForSale', () => {
    expect(
      isFeaturedBundleSpotlightPrintsPurchasable(pAvail, pAvail, {})
    ).toBe(true)
  })

  it('is false when either is not for sale and no early-access context', () => {
    expect(
      isFeaturedBundleSpotlightPrintsPurchasable(pAvail, pUnavail, {})
    ).toBe(false)
  })

  it('is true when unlisted spotlight even if storefront says not for sale', () => {
    expect(
      isFeaturedBundleSpotlightPrintsPurchasable(pUnavail, pUnavail, { spotlightUnlisted: true })
    ).toBe(true)
  })

  it('is true when early-access token is present in URL', () => {
    expect(
      isFeaturedBundleSpotlightPrintsPurchasable(pAvail, pUnavail, { earlyAccessTokenInUrl: true })
    ).toBe(true)
  })
})

describe('getFeaturedBundleConsumedCartIndices', () => {
  it('returns first occurrence of each spotlight print', () => {
    const idx = getFeaturedBundleConsumedCartIndices(
      [
        'gid://shopify/Product/2',
        'gid://shopify/Product/1',
        'gid://shopify/Product/3',
      ],
      ['1', '2']
    )
    expect(idx).toEqual([0, 1])
  })
})

describe('isFeaturedArtistBundleActive', () => {
  const p1 = mockProduct('gid://shopify/Product/1')
  const p2 = mockProduct('gid://shopify/Product/2')
  const resolve = (gid: string) =>
    gid.includes('1') ? p1 : gid.includes('2') ? p2 : undefined

  it('is false when cart order differs from spotlight set', () => {
    const p3 = mockProduct('gid://shopify/Product/3')
    expect(
      isFeaturedArtistBundleActive({
        lampQuantity: 1,
        cartOrder: ['gid://shopify/Product/1', 'gid://shopify/Product/3'],
        spotlightProductIds: ['1', '2'],
        resolveProduct: (g) => (g.includes('3') ? p3 : resolve(g)),
      })
    ).toBe(false)
  })

  it('is true when cart matches spotlight pair (order swapped)', () => {
    expect(
      isFeaturedArtistBundleActive({
        lampQuantity: 1,
        cartOrder: ['gid://shopify/Product/2', 'gid://shopify/Product/1'],
        spotlightProductIds: ['1', '2'],
        resolveProduct: resolve,
      })
    ).toBe(true)
  })

  it('is false when not two lines', () => {
    expect(
      isFeaturedArtistBundleActive({
        lampQuantity: 1,
        cartOrder: ['gid://shopify/Product/1'],
        spotlightProductIds: ['1', '2'],
        resolveProduct: resolve,
      })
    ).toBe(false)
  })

  it('is false when duplicate ids in cart cannot cover both spotlight prints', () => {
    expect(
      isFeaturedArtistBundleActive({
        lampQuantity: 1,
        cartOrder: ['gid://shopify/Product/1', 'gid://shopify/Product/1'],
        spotlightProductIds: ['1', '2'],
        resolveProduct: resolve,
      })
    ).toBe(false)
  })

  it('is true when spotlight pair is present plus extra artworks', () => {
    const p3 = mockProduct('gid://shopify/Product/3')
    expect(
      isFeaturedArtistBundleActive({
        lampQuantity: 1,
        cartOrder: [
          'gid://shopify/Product/1',
          'gid://shopify/Product/2',
          'gid://shopify/Product/3',
        ],
        spotlightProductIds: ['1', '2'],
        resolveProduct: (g) => (g.includes('3') ? p3 : resolve(g)),
      })
    ).toBe(true)
  })
})
