import { NextRequest, NextResponse } from 'next/server'
import { createPayPalClient } from '@/lib/paypal/client'

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
  image?: string
}

interface CreatePayPalOrderRequest {
  items: CartLineItem[]
  returnUrl: string
  cancelUrl: string
  shippingAddress?: {
    fullName?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    postalCode?: string
    country?: string
  }
}

/**
 * POST /api/checkout/paypal/create-order
 * Creates a PayPal order for the Smart Payment Buttons flow.
 */
export async function POST(request: NextRequest) {
  let client
  try {
    client = createPayPalClient()
  } catch {
    return NextResponse.json(
      { error: 'PayPal is not configured' },
      { status: 503 }
    )
  }

  try {
    const body: CreatePayPalOrderRequest = await request.json()
    const { items, returnUrl, cancelUrl } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const value = total.toFixed(2)
    if (parseFloat(value) <= 0) {
      return NextResponse.json(
        { error: 'Order total must be greater than zero' },
        { status: 400 }
      )
    }

    const shopifyVariantsCompact = items
      .map((i) => `${i.variantId.replace('gid://shopify/ProductVariant/', '')}:${i.quantity}`)
      .join(',')

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value,
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value,
              },
            },
          },
          items: items.map((item) => ({
            name: item.title,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
          })),
          custom_id: shopifyVariantsCompact,
          description: items.length === 1 ? items[0].title : `Order (${items.length} items)`,
        },
      ],
      application_context: {
        return_url: returnUrl || `${baseUrl}/shop/checkout/success`,
        cancel_url: cancelUrl || `${baseUrl}/shop/experience`,
        brand_name: 'The Street Collector',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }

    const order = await client.request<{ id: string }>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    })

    return NextResponse.json({ orderId: order.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create PayPal order'
    console.error('[paypal/create-order] Error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
