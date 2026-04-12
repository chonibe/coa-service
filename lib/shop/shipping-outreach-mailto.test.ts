import { buildShippingOutreachMailtoHref } from './shipping-outreach-mailto'

describe('buildShippingOutreachMailtoHref', () => {
  it('returns a mailto with encoded subject and body', () => {
    const href = buildShippingOutreachMailtoHref({
      customerEmail: 'buyer@example.com',
      orderSummary: '2× Test Print',
    })
    expect(href.startsWith('mailto:')).toBe(true)
    expect(href).toMatch(/^mailto:[^?]+\?/)
    expect(href).toContain('subject=')
    expect(href).toContain('body=')
    expect(decodeURIComponent(href)).toContain('buyer@example.com')
    expect(decodeURIComponent(href)).toContain('2× Test Print')
  })
})
