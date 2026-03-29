import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'

async function getSessionUserId(cookieStore: ReturnType<typeof cookies>) {
  const supabase = createRouteClient(cookieStore)
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session?.user?.id) return null
  return session.user.id
}

/**
 * GET /api/shop/reserve/locks — active price locks for the signed-in shop user.
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const userId = await getSessionUserId(cookieStore)
    if (!userId) {
      return NextResponse.json({ locks: [] })
    }

    const supabase = createServiceClient() as any
    const { data, error } = await supabase
      .from('street_reserve_locks')
      .select('shopify_product_id, locked_price_cents, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())

    if (error) {
      // Table may not exist until migration applied
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ locks: [] })
      }
      console.error('[reserve/locks]', error)
      return NextResponse.json({ error: 'Failed to load locks' }, { status: 500 })
    }

    const rows = (data || []) as unknown as Array<{
      shopify_product_id: string
      locked_price_cents: number
      expires_at: string
    }>

    const locks = rows.map((r) => ({
      shopify_product_id: r.shopify_product_id,
      locked_price_usd: Math.round((r.locked_price_cents / 100) * 100) / 100,
      expires_at: r.expires_at,
    }))

    return NextResponse.json({ locks })
  } catch (e) {
    console.error('[reserve/locks]', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
