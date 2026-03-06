/**
 * POST /api/admin/register-payment-domains
 *
 * Registers web domains with Stripe for Google Pay, Apple Pay, Link, and PayPal.
 * Required for these payment methods to appear in Elements/Embedded Checkout.
 *
 * @see https://docs.stripe.com/payments/payment-methods/pmd-registration
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2025-03-31.basil' }) : null

/** Domains to register (without protocol). Add others if needed. */
function getDomainsToRegister(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  const domains = new Set<string>()

  for (const url of [appUrl, siteUrl]) {
    if (!url) continue
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      const host = parsed.hostname
      if (host && host !== 'localhost') {
        domains.add(host)
        // Register apex (e.g. app.thestreetcollector.com → thestreetcollector.com) and www
        const parts = host.split('.')
        if (parts.length >= 2) {
          const apex = parts.slice(-2).join('.')
          domains.add(apex)
          domains.add(`www.${apex}`)
        }
        if (host.startsWith('www.')) {
          domains.add(host.replace(/^www\./, ''))
        } else if (!host.includes('.') || parts.length === 2) {
          domains.add(`www.${host}`)
        }
      }
    } catch {
      // skip invalid URLs
    }
  }

  // Fallback for production
  if (domains.size === 0) {
    domains.add('app.thestreetcollector.com')
    domains.add('thestreetcollector.com')
    domains.add('www.thestreetcollector.com')
  }

  return [...domains]
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    )
  }

  try {
    const domainsToRegister = getDomainsToRegister()
    const { data: existing } = await stripe.paymentMethodDomains.list()
    const existingNames = new Set(existing.map((d) => d.domain_name))

    const results: Array<{
      domain: string
      action: 'created' | 'already_registered' | 'error'
      id?: string
      error?: string
    }> = []

    for (const domain of domainsToRegister) {
      if (existingNames.has(domain)) {
        results.push({ domain, action: 'already_registered' })
        continue
      }

      try {
        const pmd = await stripe.paymentMethodDomains.create({ domain_name: domain })
        existingNames.add(domain)
        results.push({ domain, action: 'created', id: pmd.id })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({ domain, action: 'error', error: message })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      dashboardUrl: 'https://dashboard.stripe.com/settings/payment_method_domains',
      nextSteps: [
        'Enable Google Pay in Stripe Dashboard → Settings → Payment methods',
        'Ensure your domains are registered (see results above)',
        'Google Pay requires HTTPS and a card saved to the customer\'s Google account',
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to register domains'
    console.error('[register-payment-domains] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** GET: list current payment method domains */
export async function GET() {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    )
  }

  try {
    const { data } = await stripe.paymentMethodDomains.list()
    return NextResponse.json({
      domains: data.map((d) => ({
        id: d.id,
        domain_name: d.domain_name,
        enabled: d.enabled,
        google_pay: d.google_pay?.status,
        link: d.link?.status,
        paypal: d.paypal?.status,
      })),
      dashboardUrl: 'https://dashboard.stripe.com/settings/payment_method_domains',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list domains'
    console.error('[register-payment-domains] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
