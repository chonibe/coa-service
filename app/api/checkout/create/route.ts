import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector, hasPermission } from '@/lib/rbac'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string // Shopify GraphQL ID
  handle: string
  title: string
  variantTitle?: string
  price: number
  quantity: number
  image?: string
  artistName?: string
}

interface CreateCheckoutRequest {
  items: CartLineItem[]
  creditsToUse?: number
  shippingRequired?: boolean
  customerEmail?: string
}

/**
 * POST /api/checkout/create
 * 
 * Creates a checkout session that supports:
 * - Full Stripe payment (guest or non-member)
 * - Partial credit + Stripe payment (member with credits)
 * - Full credit payment (member with enough credits)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const ctx = await getUserContext(supabase)

    // Parse request body
    const body: CreateCheckoutRequest = await request.json()
    const { items, creditsToUse = 0, shippingRequired = true, customerEmail } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Calculate cart totals
    const subtotalCents = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    )

    // Validate credits usage
    let actualCreditsToUse = 0
    let creditDiscountCents = 0
    let collectorId: string | null = null

    if (creditsToUse > 0 && ctx && isCollector(ctx)) {
      // Check permission to use credits
      if (!hasPermission(ctx, 'credits:redeem')) {
        return NextResponse.json(
          { error: 'No permission to use credits' },
          { status: 403 }
        )
      }

      // Get collector's credit balance
      const { data: collector } = await supabase
        .from('collectors')
        .select('id, stripe_customer_id')
        .eq('email', ctx.email)
        .maybeSingle()

      if (collector) {
        collectorId = collector.id

        const { data: account } = await supabase
          .from('collector_accounts')
          .select('credits_balance')
          .eq('collector_id', collector.id)
          .maybeSingle()

        const availableCredits = account?.credits_balance || 0

        // Limit credits to available balance
        actualCreditsToUse = Math.min(creditsToUse, availableCredits)

        // Calculate credit discount (10 credits = $1)
        creditDiscountCents = Math.min(
          Math.round(actualCreditsToUse * 10), // 10 cents per credit
          subtotalCents // Can't exceed subtotal
        )
      }
    }

    const stripeChargeCents = subtotalCents - creditDiscountCents
    const email = ctx?.email || customerEmail

    // If fully covered by credits, create credit-only checkout
    if (stripeChargeCents === 0 && actualCreditsToUse > 0) {
      // Create checkout session record for credit-only purchase
      const { data: checkoutSession, error: sessionError } = await supabase
        .from('checkout_sessions')
        .insert({
          session_id: `credit_only_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          collector_id: collectorId,
          collector_identifier: email || '',
          session_type: 'one_time',
          status: 'pending',
          line_items: items,
          credits_used: actualCreditsToUse,
          subtotal_cents: subtotalCents,
          credits_discount_cents: creditDiscountCents,
          stripe_charge_cents: 0,
          metadata: { credit_only: true },
        })
        .select()
        .single()

      if (sessionError) {
        console.error('[checkout/create] Session creation error:', sessionError)
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        type: 'credit_only',
        sessionId: checkoutSession.session_id,
        creditsToUse: actualCreditsToUse,
        subtotal: subtotalCents / 100,
        creditDiscount: creditDiscountCents / 100,
        total: 0,
        // For credit-only, client should redirect to complete endpoint
        completeUrl: `/api/checkout/complete?session_id=${checkoutSession.session_id}`,
      })
    }

    // Create Stripe Checkout session for partial or full payment
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const successUrl = `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/shop/cart?cancelled=true`

    // Build Shopify variant metadata for webhook
    const shopifyVariants = items.map(item => ({
      variantId: item.variantId,
      variantGid: item.variantGid,
      quantity: item.quantity,
      productHandle: item.handle,
    }))

    // Create Stripe line items
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    // If using credits, show adjusted pricing
    if (creditDiscountCents > 0) {
      // Single line item showing total after credits
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: stripeChargeCents,
          product_data: {
            name: items.length === 1 
              ? items[0].title 
              : `Order (${items.length} items) - Credits Applied`,
            description: `Subtotal: $${(subtotalCents / 100).toFixed(2)}, Credits: -$${(creditDiscountCents / 100).toFixed(2)}`,
            images: items[0].image ? [items[0].image] : [],
          },
        },
        quantity: 1,
      })
    } else {
      // Show individual items
      for (const item of items) {
        stripeLineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(item.price * 100),
            product_data: {
              name: item.title,
              description: item.variantTitle || undefined,
              images: item.image ? [item.image] : [],
            },
          },
          quantity: item.quantity,
        })
      }
    }

    // Get or create Stripe customer for authenticated users
    let stripeCustomerId: string | undefined

    if (ctx && email) {
      const { data: collector } = await supabase
        .from('collectors')
        .select('stripe_customer_id')
        .eq('email', email)
        .maybeSingle()

      if (collector?.stripe_customer_id) {
        stripeCustomerId = collector.stripe_customer_id
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: 'headless_storefront',
        shopify_variant_ids: JSON.stringify(shopifyVariants),
        credits_used: actualCreditsToUse.toString(),
        credits_discount_cents: creditDiscountCents.toString(),
        collector_identifier: email || '',
      },
      ...(stripeCustomerId && { customer: stripeCustomerId }),
      ...(email && !stripeCustomerId && { customer_email: email }),
      ...(shippingRequired && {
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'JP'],
        },
      }),
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    }

    const stripeSession = await stripe.checkout.sessions.create(sessionParams)

    // Save checkout session for tracking
    await supabase.from('checkout_sessions').insert({
      session_id: stripeSession.id,
      collector_id: collectorId,
      collector_identifier: email || '',
      session_type: creditDiscountCents > 0 ? 'hybrid' : 'one_time',
      status: 'pending',
      line_items: items,
      credits_used: actualCreditsToUse,
      subtotal_cents: subtotalCents,
      credits_discount_cents: creditDiscountCents,
      stripe_charge_cents: stripeChargeCents,
      stripe_payment_intent_id: stripeSession.payment_intent as string | undefined,
      metadata: { shopify_variants: shopifyVariants },
    })

    return NextResponse.json({
      type: creditDiscountCents > 0 ? 'hybrid' : 'stripe',
      sessionId: stripeSession.id,
      url: stripeSession.url,
      creditsToUse: actualCreditsToUse,
      subtotal: subtotalCents / 100,
      creditDiscount: creditDiscountCents / 100,
      total: stripeChargeCents / 100,
    })
  } catch (error) {
    console.error('[checkout/create] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    )
  }
}
