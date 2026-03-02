'use client'

/**
 * Shared payment button visuals imported from official brand assets.
 * Used by CheckoutButton and kept consistent with PaymentIcons.
 */

/** Official PayPal logo (local SVG) */
export const PAYPAL_LOGO_URL = '/paypal.svg'

/** Stripe's official Google Pay logo (dark style for light-on-dark buttons) */
const GOOGLE_PAY_LOGO_URL =
  'https://js.stripe.com/v3/fingerprinted/img/dark-8191afec51483e108a2dc5f17fb0efd0.svg'

export function GooglePayMark({ className }: { className?: string }) {
  return (
    <div
      className={className ?? 'h-6 w-20'}
      role="img"
      aria-label="Google Pay"
      style={{
        backgroundImage: `url("${GOOGLE_PAY_LOGO_URL}")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}

/** PayPal logo - uses local SVG from public/paypal.svg */
export function PayPalMark({ className }: { className?: string }) {
  return (
    <img
      src={PAYPAL_LOGO_URL}
      alt="PayPal"
      role="img"
      aria-label="PayPal"
      className={className ?? 'h-6 w-auto object-contain'}
    />
  )
}
