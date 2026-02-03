import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getProduct, extractVariantId } from '@/lib/shopify/storefront-client'

/**
 * Stripe Checkout API
 * 
 * Creates a Stripe Checkout session for product purchases.
 * Stores Shopify variant ID in metadata for order sync.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
})

// =============================================================================
// TYPES
// =============================================================================

interface CheckoutLineItem {
  variantId: string // Shopify variant GID
  quantity: number
  productHandle?: string
  productTitle?: string
  variantTitle?: string
  price: number // Price in cents
  compareAtPrice?: number // Compare at price in cents
  imageUrl?: string
}

interface CreateCheckoutRequest {
  lineItems: CheckoutLineItem[]
  customerEmail?: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
  allowPromotionCodes?: boolean
  mode?: 'payment' | 'subscription'
  shippingAddressCollection?: boolean
  billingAddressCollection?: 'required' | 'auto'
}

// =============================================================================
// POST - Create Checkout Session
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json()
    
    const {
      lineItems,
      customerEmail,
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop`,
      metadata = {},
      allowPromotionCodes = true,
      mode = 'payment',
      shippingAddressCollection = true,
      billingAddressCollection = 'auto',
    } = body
    
    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No line items provided' },
        { status: 400 }
      )
    }
    
    // Build Stripe line items
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lineItems.map((item) => ({
      price_data: {
        currency: 'usd',
        unit_amount: item.price,
        product_data: {
          name: item.productTitle || 'Product',
          description: item.variantTitle || undefined,
          images: item.imageUrl ? [item.imageUrl] : undefined,
          metadata: {
            shopify_variant_id: extractVariantId(item.variantId),
            shopify_variant_gid: item.variantId,
            product_handle: item.productHandle || '',
          },
        },
      },
      quantity: item.quantity,
    }))
    
    // Build metadata with all Shopify variant IDs for order sync
    const sessionMetadata: Record<string, string> = {
      ...metadata,
      shopify_variant_ids: JSON.stringify(
        lineItems.map(item => ({
          variantId: extractVariantId(item.variantId),
          variantGid: item.variantId,
          quantity: item.quantity,
          productHandle: item.productHandle || '',
        }))
      ),
      source: 'headless_storefront',
    }
    
    // Create Stripe Checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: sessionMetadata,
      allow_promotion_codes: allowPromotionCodes,
      billing_address_collection: billingAddressCollection,
      ...(customerEmail && { customer_email: customerEmail }),
      ...(shippingAddressCollection && {
        shipping_address_collection: {
          allowed_countries: [
            'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
            'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'PL',
            'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE',
            'LU', 'MT', 'CY', 'NZ', 'SG', 'HK', 'JP', 'KR', 'IL', 'AE',
          ],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 0,
                currency: 'usd',
              },
              display_name: 'Free shipping',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 5,
                },
                maximum: {
                  unit: 'business_day',
                  value: 10,
                },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 1500,
                currency: 'usd',
              },
              display_name: 'Express shipping',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 2,
                },
                maximum: {
                  unit: 'business_day',
                  value: 5,
                },
              },
            },
          },
        ],
      }),
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams)
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - Get Checkout Session (for success page)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent'],
    })
    
    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
        lineItems: session.line_items?.data.map(item => ({
          description: item.description,
          quantity: item.quantity,
          amount: item.amount_total,
        })),
        shippingDetails: session.shipping_details,
        metadata: session.metadata,
      },
    })
  } catch (error: any) {
    console.error('Error retrieving Stripe checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
