import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
import { cookies } from "next/headers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const cookieStore = cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminSessionToken)

  if (!payload?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const purchaseId = params.id
    const body = await request.json()
    const { status } = body

    if (!status || !["pending", "processing", "fulfilled", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be pending, processing, fulfilled, or cancelled" },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Set fulfilled_at if status is fulfilled
    if (status === "fulfilled") {
      updateData.fulfilled_at = new Date().toISOString()
    }

    const { data: purchase, error: updateError } = await supabase
      .from("vendor_store_purchases")
      .update(updateData)
      .eq("id", purchaseId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating purchase:", updateError)
      return NextResponse.json(
        { error: "Failed to update purchase", message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      purchase,
    })
  } catch (error: any) {
    console.error("Error updating purchase status:", error)
    return NextResponse.json(
      { error: "Failed to update purchase status", message: error.message },
      { status: 500 }
    )
  }
}

