import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import { resolveRefToVendorId, AFFILIATE_REF_COOKIE } from '@/lib/affiliate'
import { getEarlyAccessCouponCookie } from '@/lib/early-access'
import { applyStreetLadderUsdToLineItems } from '@/lib/shop/street-ladder-line-pricing'
import { fetchStreetLadderUsdByNumericProductIds } from '@/lib/shop/resolve-street-ladder-prices-server'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

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

interface CreateCheckoutSessionRequest {
  items: CartLineItem[]
  customerEmail?: string
  shippingAddress?: {
    email?: string
    fullName?: string
    country?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    phoneNumber?: string
  }
  /** Promo code to pre-apply (e.g. WELCOME10). Looked up in Stripe and applied via discounts. */
  promoCode?: string
}

const CHECKOUT_SESSION_RATE_LIMIT = 20 // requests per minute per IP

/**
 * POST /api/checkout/create-checkout-session
 *
 * Creates a Checkout Session with ui_mode: "custom" for embedded Payment Element.
 * Returns clientSecret for CheckoutProvider (Stripe Elements with Checkout Sessions API).
 *
 * @see https://docs.stripe.com/payments/quickstart-checkout-sessions
 */
export async function POST(request: NextRequest) {
  const id = getClientIdentifier(request)
  const rate = checkRateLimit(id, CHECKOUT_SESSION_RATE_LIMIT)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment is not configured' },
      { status: 503 }
    )
  }

  try {
    const supabase = createClient()
    const cookieStore = await cookies()
    const affiliateRef = cookieStore.get(AFFILIATE_REF_COOKIE)?.value
    const affiliateVendorId = await resolveRefToVendorId(affiliateRef, supabase)
    const metaFbp = cookieStore.get('_fbp')?.value
    const metaFbc = cookieStore.get('_fbc')?.value || cookieStore.get('sc_fbc')?.value
    const metaFbclid = cookieStore.get('sc_fbclid')?.value

    const body: CreateCheckoutSessionRequest = await request.json()
    const { items, customerEmail, shippingAddress, promoCode } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const ladderIds = items
      .map((i) => normalizeShopifyProductId(i.productId))
      .filter((x): x is string => !!x)
    const ladderUsd = await fetchStreetLadderUsdByNumericProductIds(supabase, ladderIds)
    const checkoutItems = applyStreetLadderUsdToLineItems(items, ladderUsd)

    const totalCents = checkoutItems.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    )

    if (totalCents <= 0) {
      return NextResponse.json(
        { error: 'Order total must be greater than zero' },
        { status: 400 }
      )
    }

    const shopifyVariantsCompact = checkoutItems
      .map((i) => `${i.variantId.replace('gid://shopify/ProductVariant/', '')}:${i.quantity}`)
      .join(',')
    const email = customerEmail || shippingAddress?.email || ''
    
    // PayPal requires email - validate before creating session
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'Email address is required for checkout. Please add your email address.' },
        { status: 400 }
      )
    }

    const metadata: Record<string, string> = {
      source: 'experience_checkout',
      shopify_variant_ids: shopifyVariantsCompact,
      collector_email: email,
      collector_identifier: email,
      ...(metaFbp && { meta_fbp: metaFbp }),
      ...(metaFbc && { meta_fbc: metaFbc }),
      ...(metaFbclid && { meta_fbclid: metaFbclid }),
      ...(affiliateVendorId && { affiliate_vendor_id: affiliateVendorId.toString() }),
      items_json: JSON.stringify(
        checkoutItems.map((i) => ({
          variantId: i.variantId,
          variantGid: i.variantGid,
          handle: i.handle,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
        }))
      ).slice(0, 500),
    }
    if (shippingAddress) {
      // Stripe metadata values are limited to 500 chars; truncate fields to ensure valid JSON
      const addr: Record<string, string> = {
        fullName: (shippingAddress.fullName || '').slice(0, 60),
        addressLine1: (shippingAddress.addressLine1 || '').slice(0, 80),
        addressLine2: (shippingAddress.addressLine2 || '').slice(0, 60),
        city: (shippingAddress.city || '').slice(0, 40),
        state: (shippingAddress.state || '').slice(0, 40),
        postalCode: (shippingAddress.postalCode || '').slice(0, 20),
        country: (shippingAddress.country || 'US').slice(0, 2),
        phoneNumber: (shippingAddress.phoneNumber || '').slice(0, 25),
      }
      metadata.shipping_address = JSON.stringify(addr)
    }

    // Look up existing Stripe customer so returning users can reuse saved payment methods
    let stripeCustomerId: string | undefined
    if (email?.trim()) {
      const normalizedEmail = email.toLowerCase().trim()
      const { data: profile } = await supabase
        .from('collector_profiles')
        .select('stripe_customer_id')
        .ilike('email', normalizedEmail)
        .maybeSingle()
      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id
      } else {
        const { data: collector } = await supabase
          .from('collectors')
          .select('stripe_customer_id')
          .ilike('email', normalizedEmail)
          .maybeSingle()
        if (collector?.stripe_customer_id) {
          stripeCustomerId = collector.stripe_customer_id
        }
      }
    }

    // Look up and pre-apply promo code if provided
    let discounts: Array<{ promotion_code: string }> | undefined
    if (promoCode?.trim()) {
      const trimmed = promoCode.trim().toUpperCase()
      const { data: promoCodes } = await stripe.promotionCodes.list({ code: trimmed, active: true })
      const promo = promoCodes?.[0]
      if (promo?.coupon?.valid) {
        discounts = [{ promotion_code: promo.id }]
      }
    } else {
      // Check for early access coupon cookie
      const { couponCode: earlyAccessCoupon } = getEarlyAccessCouponCookie()
      if (earlyAccessCoupon?.trim()) {
        const trimmed = earlyAccessCoupon.trim().toUpperCase()
        const { data: promoCodes } = await stripe.promotionCodes.list({ code: trimmed, active: true })
        const promo = promoCodes?.[0]
        if (promo?.coupon?.valid) {
          discounts = [{ promotion_code: promo.id }]
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'custom',
      mode: 'payment',
      return_url: `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      // Always set customer_email for PayPal compatibility (required by Stripe)
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: email.trim().toLowerCase() }),
      payment_method_types: ['card', 'link', 'paypal'],
      automatic_tax: { enabled: false },
      ...(discounts?.length
        ? { discounts }
        : { allow_promotion_codes: true }),
      billing_address_collection: 'auto',
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      // Save shipping address to the Stripe Customer for pre-fill on future sessions
      ...(stripeCustomerId && { customer_update: { shipping: 'auto', address: 'auto' } }),
      metadata,
      line_items: checkoutItems.map((item) => ({
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.title,
            images: item.image ? [item.image] : undefined,
            metadata: {
              shopify_variant_id: item.variantId.replace('gid://shopify/ProductVariant/', ''),
              product_handle: item.handle,
            },
          },
        },
        quantity: item.quantity,
      })),
    })

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error('[checkout/create-checkout-session] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
