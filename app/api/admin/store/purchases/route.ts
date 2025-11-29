import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminSessionToken)

  if (!payload?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")

    let query = supabase.from("vendor_store_purchases").select("*").order("created_at", { ascending: false })

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data: purchases, error: purchasesError } = await query

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError)
      return NextResponse.json(
        { error: "Failed to fetch purchases", message: purchasesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      purchases: purchases || [],
    })
  } catch (error: any) {
    console.error("Error fetching purchases:", error)
    return NextResponse.json(
      { error: "Failed to fetch purchases", message: error.message },
      { status: 500 }
    )
  }
}

