import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET: Retrieve untracked purchases for a specific order or user
 * POST: Mark purchases as tracked after sending to GA4
 */

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ error: "orderId parameter required" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('ga4_purchase_tracking')
      .select('purchase_data')
      .eq('order_id', orderId)
      .is('tracked_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No untracked purchase found - already tracked or doesn't exist
        return NextResponse.json({ tracked: true })
      }
      throw error
    }

    return NextResponse.json({
      needsTracking: true,
      purchaseData: data.purchase_data
    })
  } catch (error) {
    console.error('Error fetching purchase tracking data:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 })
    }

    // Mark as tracked
    const { error } = await supabase
      .from('ga4_purchase_tracking')
      .update({ tracked_at: new Date().toISOString() })
      .eq('order_id', orderId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking purchase as tracked:', error)
    return NextResponse.json({ error: 'Failed to mark purchase as tracked' }, { status: 500 })
  }
}