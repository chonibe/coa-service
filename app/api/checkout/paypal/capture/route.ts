import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayPalClient } from '@/lib/paypal/client'
import { createAndCompleteOrder } from '@/lib/stripe/fulfill-embedded-payment'

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

interface CapturePayPalOrderRequest {
  orderId: string
  shippingAddress: {
    email?: string
    fullName?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    postalCode?: string
    country?: string
    phoneNumber?: string
  }
  items?: Array<{
    variantId: string
    quantity: number
    productHandle?: string
  }>
}

/**
 * POST /api/checkout/paypal/capture
 * Captures a PayPal order after user approval, creates Shopify order, records purchase.
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
    const body: CapturePayPalOrderRequest = await request.json()
    const { orderId, shippingAddress, items } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      )
    }

    if (!shippingAddress?.email) {
      return NextResponse.json(
        { error: 'shippingAddress with email is required' },
        { status: 400 }
      )
    }

    // Capture the order (request full representation for capture details)
    const captureResponse = await client.request<{
      id: string
      status: string
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{
            id: string
            status: string
            amount: { currency_code: string; value: string }
          }>
        }
        custom_id?: string
      }>
    }>(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    })

    if (captureResponse.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'PayPal capture did not complete' },
        { status: 400 }
      )
    }

    const purchaseUnit = captureResponse.purchase_units?.[0]
    const capture = purchaseUnit?.payments?.captures?.[0]
    const customId = purchaseUnit?.custom_id || ''
    const amountStr = capture?.amount?.value || '0'
    const currency = capture?.amount?.currency_code || 'USD'
    const amountCents = Math.round(parseFloat(amountStr) * 100)
    const captureId = capture?.id || orderId

    let variants: Array<{ variantId: string; quantity: number; productHandle?: string }>

    if (items?.length) {
      variants = items.map((i) => ({
        variantId: i.variantId.replace('gid://shopify/ProductVariant/', ''),
        quantity: i.quantity,
        productHandle: i.productHandle,
      }))
    } else if (customId) {
      variants = customId.split(',').map((part: string) => {
        const [variantId, qty] = part.split(':')
        return {
          variantId: variantId?.trim() || '',
          quantity: parseInt(qty ?? '1', 10),
          productHandle: '',
        }
      }).filter((v) => v.variantId)
    } else {
      return NextResponse.json(
        { error: 'Could not determine order line items' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: existing } = await supabase
      .from('stripe_purchases')
      .select('id')
      .eq('stripe_payment_intent', `paypal_${orderId}`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        redirectUrl: `${baseUrl}/shop/checkout/success?paypal_order=${orderId}`,
      })
    }

    const { draftOrderId, orderId: shopifyOrderId } = await createAndCompleteOrder(
      variants,
      shippingAddress,
      `paypal_${captureId}`,
      amountCents,
      currency.toLowerCase()
    )

    const totalQty = variants.reduce((s, v) => s + v.quantity, 0) || 1
    const lineItems =
      items?.map((i) => ({
        description: i.productHandle || `Variant ${i.variantId}`,
        quantity: i.quantity,
        amount: Math.round((amountCents / totalQty) * i.quantity),
      })) ??
      variants.map((v) => ({
        description: v.productHandle || `Variant ${v.variantId}`,
        quantity: v.quantity,
        amount: Math.round((amountCents / totalQty) * v.quantity),
      }))

    await supabase.from('stripe_purchases').insert({
      stripe_session_id: `paypal_${orderId}`,
      stripe_payment_intent: `paypal_${orderId}`,
      shopify_draft_order_id: draftOrderId,
      shopify_order_id: shopifyOrderId,
      customer_email: shippingAddress.email,
      amount_total: amountCents,
      currency: currency.toLowerCase(),
      status: 'completed',
      metadata: {
        source: 'paypal_checkout',
        paypal_capture_id: captureId,
        line_items: lineItems,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      redirectUrl: `${baseUrl}/shop/checkout/success?paypal_order=${orderId}`,
    })
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Failed to capture PayPal order'
    console.error('[paypal/capture] Error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
