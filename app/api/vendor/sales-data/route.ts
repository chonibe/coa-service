import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get the vendor name from the cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Fetch sales data from Supabase
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from("order_line_items")
      .select(`
        product_id,
        created_at,
        order_name
      `)
      .eq("product_vendor", vendorName)

    if (salesError) {
      console.error("Error fetching sales data from Supabase:", salesError)
      throw new Error("Failed to fetch sales data from Supabase")
    }

    // Transform the data into the desired format
    const transformedData = salesData.map((item) => ({
      date: item.created_at.substring(0, 10), // YYYY-MM-DD
      order_name: item.order_name,
      product_id: item.product_id,
    }))

    return NextResponse.json({ salesData: transformedData })
  } catch (error: any) {
    console.error("Error in vendor sales data API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
}
