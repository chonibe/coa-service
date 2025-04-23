import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify the vendor is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id

    // Get vendor's payout history
    const { data: payouts, error } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("requested_at", { ascending: false })

    if (error) {
      console.error("Error fetching payout history:", error)
      return NextResponse.json({ error: "Failed to fetch payout history" }, { status: 500 })
    }

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error("Error in payout history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
