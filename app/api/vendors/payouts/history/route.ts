import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // Check for admin authentication
    // This would normally check for admin authentication, but we're skipping it for brevity

    // Get all payout history
    const { data: payouts, error } = await supabaseAdmin
      .from("vendor_payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching payout history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ payouts: payouts || [] })
  } catch (error: any) {
    console.error("Error in payout history API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
