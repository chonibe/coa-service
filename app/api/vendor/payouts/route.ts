import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the current vendor's session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vendorId = session.user.id

    // Get vendor payouts
    const { data: payouts, error } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vendor payouts:", error)
      return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
    }

    // Format the payouts data
    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      date: payout.payout_date,
      products: payout.product_count || 0,
      reference: payout.reference,
    }))

    return NextResponse.json({ payouts: formattedPayouts })
  } catch (error) {
    console.error("Unexpected error in vendor payouts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
