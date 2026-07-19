import { stripeLineItemDescription } from './stripe-line-item-description'

describe('stripeLineItemDescription', () => {
  it('returns undefined for empty / Default Title', () => {
    expect(stripeLineItemDescription(undefined)).toBeUndefined()
    expect(stripeLineItemDescription('')).toBeUndefined()
    expect(stripeLineItemDescription('   ')).toBeUndefined()
    expect(stripeLineItemDescription('Default Title')).toBeUndefined()
    expect(stripeLineItemDescription('default title')).toBeUndefined()
  })

  it('keeps real variant titles', () => {
    expect(stripeLineItemDescription('Large')).toBe('Large')
    expect(stripeLineItemDescription(' Matte ')).toBe('Matte')
  })
})
