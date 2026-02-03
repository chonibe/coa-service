import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

/**
 * GET /api/admin/orders/[orderId]/notes
 * Fetches all status notes for a specific order
 * Returns a timeline of shipping status changes
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { orderId: string } }
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  
  try {
    const { orderId } = params

    // Fetch notes by order_id or order_name (supports both Shopify IDs and order names like #1234)
    const { data: notes, error } = await supabase
      .from("order_status_notes")
      .select("*")
      .or(`order_id.eq.${orderId},order_name.eq.${orderId},order_name.eq.#${orderId}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching order notes:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch order notes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notes: notes || [],
      count: notes?.length || 0,
    })
  } catch (error: any) {
    console.error("Error in order notes API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

/**
 * POST /api/admin/orders/[orderId]/notes
 * Allows admin to manually add a note to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const { orderId } = params
    const body = await request.json()
    const { note, orderName } = body

    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Note content is required" }, { status: 400 })
    }

    const { data: newNote, error } = await supabase
      .from("order_status_notes")
      .insert({
        order_id: orderId,
        order_name: orderName || null,
        note: note.trim(),
        source: 'manual',
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order note:", error)
      return NextResponse.json({ success: false, message: "Failed to create note" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      note: newNote,
    })
  } catch (error: any) {
    console.error("Error in order notes POST API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
