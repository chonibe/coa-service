import type Stripe from 'stripe'

/** Merchandise subtotal must be at least this (cents) for free standard when tiered shipping is enabled. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7000

export const FREE_SHIPPING_THRESHOLD_USD = 70

/** Standard shipping below threshold when tiered shipping is enabled (USD). */
export const STANDARD_SHIPPING_UNDER_THRESHOLD_USD = 10

export const STANDARD_SHIPPING_UNDER_THRESHOLD_CENTS = 1000

const EXPRESS_SHIPPING_CENTS = 1500

const STANDARD_DELIVERY_ESTIMATE: NonNullable<
  Stripe.Checkout.SessionCreateParams.ShippingOption['shipping_rate_data']['delivery_estimate']
> = {
  minimum: { unit: 'business_day', value: 5 },
  maximum: { unit: 'business_day', value: 10 },
}

const EXPRESS_DELIVERY_ESTIMATE: NonNullable<
  Stripe.Checkout.SessionCreateParams.ShippingOption['shipping_rate_data']['delivery_estimate']
> = {
  minimum: { unit: 'business_day', value: 2 },
  maximum: { unit: 'business_day', value: 5 },
}

function expressOption(): Stripe.Checkout.SessionCreateParams.ShippingOption {
  return {
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: EXPRESS_SHIPPING_CENTS, currency: 'usd' },
      display_name: 'Express shipping',
      delivery_estimate: EXPRESS_DELIVERY_ESTIMATE,
    },
  }
}

/**
 * Stripe Checkout shipping rates for headless checkout.
 * When `shippingFreeOver70` is false: free standard ($0) + express ($15).
 * When true: standard is $10 below $70 subtotal, free at/above $70; express unchanged.
 */
export function buildStripeCheckoutShippingOptions(
  subtotalCents: number,
  shippingFreeOver70: boolean
): NonNullable<Stripe.Checkout.SessionCreateParams['shipping_options']> {
  const subtotal = Number.isFinite(subtotalCents) ? Math.max(0, subtotalCents) : 0

  let standard: Stripe.Checkout.SessionCreateParams.ShippingOption

  if (!shippingFreeOver70) {
    standard = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 0, currency: 'usd' },
        display_name: 'Free shipping',
        delivery_estimate: STANDARD_DELIVERY_ESTIMATE,
      },
    }
  } else if (subtotal < FREE_SHIPPING_THRESHOLD_CENTS) {
    standard = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: STANDARD_SHIPPING_UNDER_THRESHOLD_CENTS, currency: 'usd' },
        display_name: 'Standard shipping',
        delivery_estimate: STANDARD_DELIVERY_ESTIMATE,
      },
    }
  } else {
    standard = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 0, currency: 'usd' },
        display_name: 'Free shipping',
        delivery_estimate: STANDARD_DELIVERY_ESTIMATE,
      },
    }
  }

  return [standard, expressOption()]
}
