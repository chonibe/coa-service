import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { logAdminAction } from "@/lib/audit-logger"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const cookieStore = request.cookies
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(adminToken)
  const adminEmail = adminSession?.email || "unknown"

  const vendorId = Number.parseInt(params.vendorId, 10)
  if (Number.isNaN(vendorId)) {
    return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  try {
    // Fetch vendor details
    const { data: vendor, error: vendorError } = await serviceClient
      .from("vendors")
      .select("vendor_name")
      .eq("id", vendorId)
      .maybeSingle()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Log admin view action
    await logAdminAction({
      adminEmail,
      actionType: "view",
      vendorId,
      details: { viewType: "orders" },
    })

    // Fetch vendor orders/line items
    const { data: lineItems, error: lineItemsError } = await serviceClient
      .from("order_line_items_v2")
      .select("id, product_id, name, created_at, price, quantity, status, order_id, order_name")
      .eq("vendor_name", vendor.vendor_name)
      .order("created_at", { ascending: false })
      .limit(100)

    if (lineItemsError) {
      console.error("Error fetching vendor orders:", lineItemsError)
      return NextResponse.json(
        { error: "Failed to fetch vendor orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vendor: {
        id: vendorId,
        vendor_name: vendor.vendor_name,
      },
      orders: lineItems || [],
    })
  } catch (error) {
    console.error("Error fetching vendor orders for admin:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor orders" },
      { status: 500 }
    )
  }
}

