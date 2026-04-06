import { NextResponse } from 'next/server'
import { getShopDiscountSettings } from '@/lib/shop/get-shop-discount-flags'
import {
  FREE_SHIPPING_THRESHOLD_USD,
  STANDARD_SHIPPING_UNDER_THRESHOLD_USD,
} from '@/lib/shop/stripe-checkout-shipping'

/**
 * Public read-only shipping promo rules for storefront copy and cart UI.
 */
export async function GET() {
  const settings = await getShopDiscountSettings()
  return NextResponse.json(
    {
      shippingFreeOver70: settings.flags.shippingFreeOver70,
      freeOverUsd: FREE_SHIPPING_THRESHOLD_USD,
      standardUnderUsd: STANDARD_SHIPPING_UNDER_THRESHOLD_USD,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  )
}
