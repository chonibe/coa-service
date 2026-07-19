/**
 * Stripe Checkout product subtitle. Shopify single-variant products often use
 * "Default Title" — never surface that as a line-item description.
 */
export function stripeLineItemDescription(
  variantTitle: string | null | undefined
): string | undefined {
  const trimmed = variantTitle?.trim()
  if (!trimmed) return undefined
  if (trimmed.toLowerCase() === 'default title') return undefined
  return trimmed
}
