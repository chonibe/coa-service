import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
import {
  getOrderInvoicePayEligibility,
  validateShopifyHostedOrderPaymentUrl,
} from '@/lib/shopify/order-invoice-stripe'
import stripe from '@/lib/stripe'

export const runtime = 'nodejs'

const RATE = 30 // per minute per IP

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'

/** Optional: restrict to the legacy segment Shopify puts in invoice URLs (e.g. 65979252963) */
const EXPECTED_SHOP_SEGMENT = process.env.SHOPIFY_INVOICE_PAY_SHOP_SEGMENT?.trim()

/**
 * GET /{shopKey}/order_payment/{orderId}?secret=...
 * Shopify invoice / payment-collection links hit the storefront domain; this app handles them by
 * validating the link on the myshopify host, then redirecting to Stripe Checkout for the
 * outstanding balance. Webhook completes the flow with orderMarkAsPaid.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shopKey: string; orderId: string }> }
) {
  const id = getClientIdentifier(request)
  const rate = checkRateLimit(id, RATE)
  if (!rate.success) {
    return NextResponse.redirect(new URL('/?invoice_error=rate', request.url), 302)
  }

  const { shopKey, orderId: orderIdParam } = await context.params
  const orderId = orderIdParam?.replace(/\D/g, '') || ''
  if (!orderId) {
    return NextResponse.redirect(new URL('/?invoice_error=invalid', request.url), 302)
  }

  if (EXPECTED_SHOP_SEGMENT && shopKey !== EXPECTED_SHOP_SEGMENT) {
    return NextResponse.redirect(new URL('/?invoice_error=invalid', request.url), 302)
  }

  const secret = request.nextUrl.searchParams.get('secret')?.trim()
  if (!secret || secret.length < 16) {
    return NextResponse.redirect(new URL('/?invoice_error=invalid', request.url), 302)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL('/?invoice_error=config', request.url), 302)
  }

  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  const linkOk = await validateShopifyHostedOrderPaymentUrl(pathname, search)
  if (!linkOk) {
    return NextResponse.redirect(new URL('/?invoice_error=link', request.url), 302)
  }

  let eligibility
  try {
    eligibility = await getOrderInvoicePayEligibility(orderId)
  } catch (e) {
    console.error('[order_payment] eligibility error:', e)
    return NextResponse.redirect(new URL('/?invoice_error=lookup', request.url), 302)
  }

  if (!eligibility || eligibility.outstandingCents <= 0) {
    return NextResponse.redirect(new URL('/?invoice_error=balance', request.url), 302)
  }

  const successUrl = `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${baseUrl}/?invoice_cancelled=1`

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: ['card', 'paypal', 'link'],
    line_items: [
      {
        price_data: {
          currency: eligibility.currencyCode,
          unit_amount: eligibility.outstandingCents,
          product_data: {
            name: `Pay invoice ${eligibility.name}`,
            description: `Shopify order ${eligibility.name} — outstanding balance`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      source: 'shopify_order_invoice',
      shopify_order_id: eligibility.numericOrderId,
      shopify_order_gid: eligibility.orderGid,
      shopify_order_name: eligibility.name,
      invoice_outstanding_cents: String(eligibility.outstandingCents),
      invoice_currency: eligibility.currencyCode,
    },
    billing_address_collection: 'required',
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create(sessionParams)
  } catch (e) {
    console.error('[order_payment] Stripe session error:', e)
    return NextResponse.redirect(new URL('/?invoice_error=stripe', request.url), 302)
  }

  if (!session.url) {
    return NextResponse.redirect(new URL('/?invoice_error=stripe', request.url), 302)
  }

  return NextResponse.redirect(session.url, 303)
}
