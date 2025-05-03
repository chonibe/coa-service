import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get all vendors with pending payouts
    const { data: pendingPayouts, error } = await supabase.rpc("get_pending_vendor_payouts")

    if (error) {
      console.error("Error fetching pending payouts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    return NextResponse.json({
      payouts: pendingPayouts || [],
    })
  } catch (err) {
    console.error("Error in pending payouts API:", err)
    return NextResponse.json({ error: "Failed to fetch pending payouts" }, { status: 500 })
  }
}
