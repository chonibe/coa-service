import { NextResponse } from 'next/server'
import { getProduct } from '@/lib/shopify/storefront-client'

/**
 * GET /api/gift-cards/lamp-price
 *
 * Returns the current Street Lamp product price from Shopify.
 */
export async function GET() {
  try {
    const lamp = await getProduct('street_lamp')
    if (!lamp?.priceRange?.minVariantPrice?.amount) {
      return NextResponse.json({ price: null }, { status: 200 })
    }
    const price = parseFloat(lamp.priceRange.minVariantPrice.amount)
    return NextResponse.json({ price: isNaN(price) ? null : price })
  } catch {
    return NextResponse.json({ price: null }, { status: 200 })
  }
}
