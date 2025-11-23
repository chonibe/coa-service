import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createChinaDivisionClient } from '@/lib/chinadivision/client'
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * GET /api/warehouse/orders
 * List warehouse orders within a date range (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    
    if (!adminSession?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    // Validate date parameters
    if (!start || !end) {
      return NextResponse.json(
        {
          success: false,
          message: 'Start and end dates are required (format: YYYY-MM-DD)',
        },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      )
    }

    // Create ChinaDivision client and fetch orders
    const client = createChinaDivisionClient()
    const orders = await client.getOrdersInfo(start, end)

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    })
  } catch (error: any) {
    console.error('Error fetching warehouse orders:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch warehouse orders',
      },
      { status: 500 }
    )
  }
}

