/**
 * Fetches promo validation and discount from /api/checkout/validate-promo.
 * Use when applying a promo code to get the discount amount for cart display.
 */
export async function validatePromo(
  code: string,
  subtotalCents?: number
): Promise<{ valid: boolean; discountCents: number; percentOff?: number }> {
  const res = await fetch('/api/checkout/validate-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: code.trim().toUpperCase(),
      ...(typeof subtotalCents === 'number' && subtotalCents > 0 ? { subtotalCents } : {}),
    }),
  })
  const data = await res.json()
  return {
    valid: !!data.valid,
    discountCents: typeof data.discountCents === 'number' ? data.discountCents : 0,
    percentOff: data.percentOff,
  }
}
