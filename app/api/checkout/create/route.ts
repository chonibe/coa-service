import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, isCollector, hasPermission } from '@/lib/rbac'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { resolveRefToVendorId, AFFILIATE_REF_COOKIE } from '@/lib/affiliate'
import { getEarlyAccessCouponCookie } from '@/lib/early-access'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' }) : null

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

interface ShippingAddressInput {
  email?: string
  fullName?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  phoneCountryCode?: string
  phoneNumber?: string
}

interface CreateCheckoutRequest {
  items: CartLineItem[]
  creditsToUse?: number
  shippingRequired?: boolean
  customerEmail?: string
  orderNotes?: string
  cancelUrl?: string
  /** Address from pre-checkout UI (email used for customer_email) */
  shippingAddress?: ShippingAddressInput
  /** User-selected payment method: 'link' | 'paypal' | 'card' */
  paymentMethodPreference?: 'link' | 'paypal' | 'card'
  /** Promo code (Stripe validates on redirect; stored for metadata) */
  promoCode?: string
}

/**
 * POST /api/checkout/create
 * 
 * Creates a checkout session that supports:
 * - Full Stripe payment (guest or non-member)
 * - Partial credit + Stripe payment (member with credits)
 * - Full credit payment (member with enough credits)
 */
const CHECKOUT_RATE_LIMIT = 20 // requests per minute per IP

export async function POST(request: NextRequest) {
  const id = getClientIdentifier(request)
  const rate = checkRateLimit(id, CHECKOUT_RATE_LIMIT)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  if (!stripe) {
    console.error('[checkout/create] STRIPE_SECRET_KEY not configured')
    return NextResponse.json(
      { error: 'Checkout is not configured. Please contact support.' },
      { status: 503 }
    )
  }
  try {
    const supabase = createClient()
    const ctx = await getUserContext(supabase)

    // Resolve affiliate from cookie (for referral attribution)
    const cookieStore = await cookies()
    const affiliateRef = cookieStore.get(AFFILIATE_REF_COOKIE)?.value
    const affiliateVendorId = await resolveRefToVendorId(affiliateRef, supabase)
    const metaFbp = cookieStore.get('_fbp')?.value
    const metaFbc = cookieStore.get('_fbc')?.value || cookieStore.get('sc_fbc')?.value
    const metaFbclid = cookieStore.get('sc_fbclid')?.value

    // Parse request body
    const body: CreateCheckoutRequest = await request.json()
    const {
      items,
      creditsToUse = 0,
      shippingRequired = true,
      customerEmail,
      orderNotes,
      cancelUrl,
      shippingAddress,
      paymentMethodPreference,
      promoCode,
    } = body

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
    const email = ctx?.email || customerEmail || shippingAddress?.email?.trim()

    // Zero-dollar flow: $0 total (for testing order creation in Shopify)
    if (stripeChargeCents === 0) {
      // Create checkout session record for credit-only purchase
      const sessionPrefix = actualCreditsToUse > 0 ? 'credit_only' : 'zero_dollar'
      const { data: checkoutSession, error: sessionError } = await supabase
        .from('checkout_sessions')
        .insert({
          session_id: `${sessionPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          collector_id: collectorId,
          collector_identifier: email || '',
          session_type: 'one_time',
          status: 'pending',
          line_items: items,
          credits_used: actualCreditsToUse,
          subtotal_cents: subtotalCents,
          credits_discount_cents: creditDiscountCents,
          stripe_charge_cents: 0,
          metadata: {
        ...(actualCreditsToUse > 0 ? { credit_only: true } : { zero_dollar_test: true }),
        ...(affiliateVendorId && { affiliate_vendor_id: affiliateVendorId.toString() }),
      },
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
        type: actualCreditsToUse > 0 ? 'credit_only' : 'zero_dollar',
        sessionId: checkoutSession.session_id,
        creditsToUse: actualCreditsToUse,
        subtotal: subtotalCents / 100,
        creditDiscount: creditDiscountCents / 100,
        total: 0,
        completeUrl: `/shop/checkout/zero-order?session_id=${checkoutSession.session_id}`,
      })
    }

    // Create Stripe Checkout session for partial or full payment
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const successUrl = `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const finalCancelUrl = cancelUrl || `${baseUrl}/shop/cart?cancelled=true`

    // Build Shopify variant metadata for webhook (Stripe metadata values max 500 chars — use compact format)
    const shopifyVariantsCompact = items
      .map(item => `${item.variantId}:${item.quantity}`)
      .join(',')

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

    // Look up and pre-apply promo code if provided
    let discounts: Array<{ promotion_code: string }> | undefined
    if (promoCode?.trim()) {
      const trimmed = promoCode.trim().toUpperCase()
      const { data: promoCodes } = await stripe!.promotionCodes.list({ code: trimmed, active: true })
      const promo = promoCodes?.[0]
      if (promo?.coupon?.valid) {
        discounts = [{ promotion_code: promo.id }]
      }
    } else {
      // Check for early access coupon cookie
      const { couponCode: earlyAccessCoupon } = getEarlyAccessCouponCookie()
      if (earlyAccessCoupon?.trim()) {
        const trimmed = earlyAccessCoupon.trim().toUpperCase()
        const { data: promoCodes } = await stripe!.promotionCodes.list({ code: trimmed, active: true })
        const promo = promoCodes?.[0]
        if (promo?.coupon?.valid) {
          discounts = [{ promotion_code: promo.id }]
        }
      }
    }

    // Restrict payment method if user selected one
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams['payment_method_types'] =
      paymentMethodPreference ? [paymentMethodPreference] : ['card', 'paypal', 'link']

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: stripeLineItems,
      success_url: successUrl,
      cancel_url: finalCancelUrl,
      payment_method_types: paymentMethodTypes,
      metadata: {
        source: 'headless_storefront',
        shopify_variant_ids: shopifyVariantsCompact,
        credits_used: actualCreditsToUse.toString(),
        credits_discount_cents: creditDiscountCents.toString(),
        collector_identifier: email || '',
        ...(metaFbp && { meta_fbp: metaFbp }),
        ...(metaFbc && { meta_fbc: metaFbc }),
        ...(metaFbclid && { meta_fbclid: metaFbclid }),
        ...(orderNotes && { order_notes: orderNotes }),
        ...(promoCode && { promo_code: promoCode }),
        ...(affiliateVendorId && { affiliate_vendor_id: affiliateVendorId.toString() }),
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
      ...(discounts?.length ? { discounts } : {}),
    }

    const stripeSession = await stripe!.checkout.sessions.create(sessionParams)

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
      metadata: {
        shopify_variants: items.map(i => ({ variantId: i.variantId, variantGid: i.variantGid, quantity: i.quantity, productHandle: i.handle })),
        ...(affiliateVendorId && { affiliate_vendor_id: affiliateVendorId.toString() }),
      },
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
