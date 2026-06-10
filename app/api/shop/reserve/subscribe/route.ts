import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import {
  streetReserveStripePriceIdEnvKey,
  type StreetReserveTierId,
} from '@/lib/shop/street-reserve-config'
import { capturePostHogServerEvent } from '@/lib/posthog-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil',
})

const TIERS = new Set<string>(['reserve'])

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession()
    if (sessErr || !session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as { tier?: string }
    const tier = body.tier as StreetReserveTierId | undefined
    if (!tier || !TIERS.has(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const envKey = streetReserveStripePriceIdEnvKey(tier)
    const priceId = process.env[envKey]
    if (!priceId) {
      return NextResponse.json(
        { error: 'Reserve billing is not configured yet. Set Stripe price env vars.' },
        { status: 503 }
      )
    }

    const origin = request.nextUrl.origin
    const successUrl = `${origin}/shop/reserve?subscribed=1`
    const cancelUrl = `${origin}/shop/reserve?canceled=1`

    await capturePostHogServerEvent('reserve_subscribe_started', session.user.email, {
      tier,
      user_id: session.user.id,
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      phone_number_collection: { enabled: true },
      metadata: {
        checkout_kind: 'street_reserve',
      },
      subscription_data: {
        metadata: {
          subscription_product: 'street_reserve',
          reserve_tier: tier,
          supabase_user_id: session.user.id,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (e) {
    console.error('[reserve/subscribe]', e)
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 })
  }
}
