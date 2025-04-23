import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify admin is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Add admin role check here

    // Get all payout requests with vendor information
    const { data: payouts, error } = await supabase
      .from("vendor_payouts")
      .select(`
        *,
        vendors (
          name
        )
      `)
      .order("requested_at", { ascending: false })

    if (error) {
      console.error("Error fetching payouts:", error)
      return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
    }

    // Format the response
    const formattedPayouts = payouts.map((payout) => ({
      ...payout,
      vendor_name: payout.vendors?.name || "Unknown Vendor",
    }))

    return NextResponse.json({ payouts: formattedPayouts })
  } catch (error) {
    console.error("Error in admin payouts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
