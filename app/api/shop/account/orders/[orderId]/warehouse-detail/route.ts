import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createRouteClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@/lib/supabase/server'
import { getShopAccountWarehouseDetail } from '@/lib/warehouse/shop-account-order-detail'

const MOCK_COOKIE = 'mock_user_email'

/**
 * GET /api/shop/account/orders/[orderId]/warehouse-detail
 * ChinaDivision packages + STONE3PL timeline for one order; Supabase session must own the order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } },
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const orderId = resolvedParams.orderId?.trim()
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const mockEmail = cookieStore.get(MOCK_COOKIE)?.value
    const isDev = process.env.NODE_ENV === 'development'
    const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'

    let email: string | null = null
    if (mockEmail && (isDev || mockEnabled)) {
      email = mockEmail.trim().toLowerCase()
    } else {
      const supabase = createRouteClient(cookieStore)
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      if (sessionError || !session?.user?.email) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
      }
      email = session.user.email.trim().toLowerCase()
    }

    const serviceClient = createServiceClient()
    const payload = await getShopAccountWarehouseDetail(serviceClient, email, orderId)

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (error: unknown) {
    console.error('[warehouse-detail] Error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to load warehouse detail' },
      { status: 500 },
    )
  }
}
