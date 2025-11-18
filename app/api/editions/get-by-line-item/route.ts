import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)

    if (!adminSession?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: lineItems, error } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    return NextResponse.json(lineItems || [])
  } catch (error) {
    console.error("Error in get-by-line-item route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
