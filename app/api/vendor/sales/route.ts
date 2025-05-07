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

    // Get vendor sales data from Supabase
    const { data: sales, error: salesError } = await supabase
      .from("order_line_items")
      .select(`
        id,
        created_at,
        product_title,
        price,
        quantity,
        order_id,
        orders (
          customer_email
        )
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })

    if (salesError) {
      console.error("Error fetching vendor sales:", salesError)
      return NextResponse.json(
        { error: "Failed to fetch sales data" },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const formattedSales = sales.map(sale => ({
      id: sale.id,
      date: sale.created_at,
      product: sale.product_title,
      amount: sale.price * sale.quantity,
      customer: sale.orders?.customer_email || "Unknown"
    }))

    return NextResponse.json({ sales: formattedSales })
  } catch (error) {
    console.error("Unexpected error in vendor sales API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
