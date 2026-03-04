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

async function getUserId(cookieStore: ReturnType<typeof cookies>) {
  const supabase = createRouteClient(cookieStore)
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.user?.id) return null
  return session.user.id
}

/**
 * GET /api/shop/account/addresses
 * Returns all saved addresses from collector_addresses.
 * Response: { addresses: [{ id, address, label?, createdAt }] }
 * Also includes shippingAddress, billingAddress (first of each) for backward compat.
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const mockEmail = cookieStore.get(MOCK_COOKIE)?.value
    const isDev = process.env.NODE_ENV === 'development'
    const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'

    if (mockEmail && (isDev || mockEnabled)) {
      return NextResponse.json({ addresses: [], shippingAddress: null, billingAddress: null })
    }

    const userId = await getUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: rows, error } = await serviceClient
      .from('collector_addresses')
      .select('id, address, label, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Addresses GET error:', error)
      return NextResponse.json({ addresses: [], shippingAddress: null, billingAddress: null })
    }

    const addresses = (rows || []).map((r) => ({
      id: r.id,
      address: r.address as CheckoutAddress,
      label: r.label as string | null,
      createdAt: r.created_at,
    })).filter((a) => isValidAddress(a.address))

    const first = addresses[0]?.address ?? null
    return NextResponse.json({
      addresses,
      shippingAddress: first,
      billingAddress: addresses.length > 1 ? addresses[1].address : first,
    })
  } catch (error: any) {
    console.error('Addresses GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

/**
 * POST /api/shop/account/addresses
 * Add a new address. Body: { address: CheckoutAddress, label?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const mockEmail = cookieStore.get(MOCK_COOKIE)?.value
    const isDev = process.env.NODE_ENV === 'development'
    const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'

    if (mockEmail && (isDev || mockEnabled)) {
      return NextResponse.json({ success: true, id: 'mock-id' })
    }

    const userId = await getUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const address = body.address
    const label = body.label ?? null

    if (!isValidAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { data: inserted, error } = await serviceClient
      .from('collector_addresses')
      .insert({ user_id: userId, address, label })
      .select('id')
      .single()

    if (error) {
      console.error('Addresses POST error:', error)
      return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: inserted?.id })
  } catch (error: any) {
    console.error('Addresses POST error:', error)
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
  }
}

/**
 * PUT /api/shop/account/addresses
 * Backward compat: adds address(es) via POST. Body: { shippingAddress?, billingAddress? }
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

    const userId = await getUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const toAdd: CheckoutAddress[] = []
    if (isValidAddress(body.shippingAddress)) toAdd.push(body.shippingAddress)
    if (isValidAddress(body.billingAddress)) toAdd.push(body.billingAddress)

    if (toAdd.length === 0) return NextResponse.json({ success: true })

    const serviceClient = createServiceClient()
    for (const addr of toAdd) {
      await serviceClient.from('collector_addresses').insert({ user_id: userId, address: addr })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Addresses PUT error:', error)
    return NextResponse.json({ error: 'Failed to save addresses' }, { status: 500 })
  }
}

/**
 * PATCH /api/shop/account/addresses
 * Update an address. Body: { id: string, address?: CheckoutAddress, label?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = await getUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const id = body.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (body.address !== undefined) {
      if (!isValidAddress(body.address)) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
      }
      updates.address = body.address
    }
    if (body.label !== undefined) updates.label = body.label

    if (Object.keys(updates).length === 0) return NextResponse.json({ success: true })

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('collector_addresses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Addresses PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Addresses PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}

/**
 * DELETE /api/shop/account/addresses?id=uuid
 * Remove an address.
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userId = await getUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('collector_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Addresses DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Addresses DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
