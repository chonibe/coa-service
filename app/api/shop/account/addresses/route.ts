import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import type { CheckoutAddress } from '@/lib/shop/CheckoutContext'

const MOCK_COOKIE = 'mock_user_email'

/** Validate CheckoutAddress-like object has required fields */
function isValidAddress(obj: unknown): obj is CheckoutAddress {
  if (!obj || typeof obj !== 'object') return false
  const a = obj as Record<string, unknown>
  return (
    typeof a.fullName === 'string' && a.fullName.trim().length >= 2 &&
    typeof a.addressLine1 === 'string' && a.addressLine1.trim().length > 0 &&
    typeof a.city === 'string' && a.city.trim().length > 0 &&
    typeof a.postalCode === 'string' && a.postalCode.trim().length > 0 &&
    typeof a.country === 'string' && a.country.trim().length > 0 &&
    typeof a.phoneNumber === 'string' && a.phoneNumber.trim().length > 0 &&
    typeof a.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((a.email as string).trim())
  )
}

/**
 * GET /api/shop/account/addresses
 * Returns saved shipping and billing addresses from collector_profiles.
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const mockEmail = cookieStore.get(MOCK_COOKIE)?.value
    const isDev = process.env.NODE_ENV === 'development'
    const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'

    if (mockEmail && (isDev || mockEnabled)) {
      return NextResponse.json({ shippingAddress: null, billingAddress: null })
    }

    const supabase = createRouteClient(cookieStore)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('collector_profiles')
      .select('default_shipping_address, default_billing_address')
      .eq('user_id', session.user.id)
      .maybeSingle()

    const shipping = (profile?.default_shipping_address as CheckoutAddress | null) ?? null
    const billing = (profile?.default_billing_address as CheckoutAddress | null) ?? null

    return NextResponse.json({
      shippingAddress: isValidAddress(shipping) ? shipping : null,
      billingAddress: isValidAddress(billing) ? billing : null,
    })
  } catch (error: any) {
    console.error('Addresses GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

/**
 * PUT /api/shop/account/addresses
 * Save shipping and/or billing address to collector_profiles.
 * Body: { shippingAddress?: CheckoutAddress, billingAddress?: CheckoutAddress }
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const mockEmail = cookieStore.get(MOCK_COOKIE)?.value
    const isDev = process.env.NODE_ENV === 'development'
    const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'

    if (mockEmail && (isDev || mockEnabled)) {
      return NextResponse.json({ success: true })
    }

    const supabase = createRouteClient(cookieStore)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const shippingAddress = body.shippingAddress
    const billingAddress = body.billingAddress

    const updates: Record<string, unknown> = {}
    if (shippingAddress !== undefined) {
      updates.default_shipping_address = isValidAddress(shippingAddress) ? shippingAddress : null
    }
    if (billingAddress !== undefined) {
      updates.default_billing_address = isValidAddress(billingAddress) ? billingAddress : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true })
    }

    const serviceClient = createServiceClient()
    const { error: updateError } = await serviceClient
      .from('collector_profiles')
      .update(updates)
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Addresses PUT error:', updateError)
      return NextResponse.json({ error: 'Failed to save addresses' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Addresses PUT error:', error)
    return NextResponse.json({ error: 'Failed to save addresses' }, { status: 500 })
  }
}
