/**
 * Prefilled “country not on list” outreach email for checkout / shipping UX.
 * Override with `NEXT_PUBLIC_ORDER_OUTREACH_EMAIL` (falls back to contact / collector support).
 */
export function getOrderOutreachEmail(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ORDER_OUTREACH_EMAIL?.trim()) {
    return process.env.NEXT_PUBLIC_ORDER_OUTREACH_EMAIL.trim()
  }
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()) {
    return process.env.NEXT_PUBLIC_CONTACT_EMAIL.trim()
  }
  return 'support@thestreetcollector.com'
}

export type ShippingOutreachMailtoParams = {
  customerEmail?: string
  orderSummary?: string
}

export function buildShippingOutreachMailtoHref(params: ShippingOutreachMailtoParams = {}): string {
  const to = getOrderOutreachEmail()
  const subject = encodeURIComponent('Shipping inquiry — country not on checkout list')
  const lines = [
    'Hello,',
    '',
    "I'd like to request shipping to a country that is not on your checkout country list.",
    '',
    'Country (please write the full country name): ',
    '',
    'Order / items:',
    params.orderSummary?.trim() || '(describe what you want to order, or paste your cart here)',
    '',
    params.customerEmail?.trim()
      ? `My email: ${params.customerEmail.trim()}`
      : 'My email: (please add the email you will use for this order)',
    '',
    'Thank you!',
  ]
  const body = encodeURIComponent(lines.join('\n'))
  return `mailto:${to}?subject=${subject}&body=${body}`
}
