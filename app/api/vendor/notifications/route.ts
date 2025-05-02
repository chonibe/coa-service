import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get the session to identify the vendor
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("auth_id", session.user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // In a real application, you would fetch actual notification counts from your database
    // For example:
    // const { count: messageCount } = await supabase
    //   .from('messages')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('vendor_id', vendor.id)
    //   .eq('read', false)

    // For demo purposes, we'll return some sample data
    const notifications = {
      Messages: 3,
      Benefits: 1,
      Settings: 0,
      Analytics: 0,
      Dashboard: 0,
      // You could also include counts for submenu items
      Products: 2,
      Sales: 0,
      Payouts: 1,
      Overview: 0,
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
