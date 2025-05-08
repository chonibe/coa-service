import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

interface LineItem {
  id: string
  product_id: string
  price: number | string
  quantity?: number
  created_at: string
  vendor_name: string
  status: string
}

interface PayoutSetting {
  product_id: string
  payout_amount: number
  is_percentage: boolean
  vendor_name: string
}

export async function GET() {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Create Supabase client
    const supabase = createClient()

    // Get vendor ID from vendor name
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("name", vendorName)
      .single()

    if (vendorError || !vendor) {
      console.error("Error fetching vendor:", vendorError)
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get total products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor.id)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    const totalProducts = products?.length || 0

    // Get sales data and payout settings
    const { data: salesData, error: salesError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("vendor_name", vendorName)
      .eq("status", "active")

    if (salesError) {
      console.error("Error fetching sales:", salesError)
      return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
    }

    // Get payout settings for the vendor's products
    const { data: payouts, error: payoutsError } = await supabase
      .from("product_vendor_payouts")
      .select("*")
      .eq("vendor_name", vendorName)

    if (payoutsError) {
      console.error("Error fetching payouts:", payoutsError)
      return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
    }

    // Calculate totals
    let totalSales = 0
    let totalRevenue = 0
    let pendingPayout = 0

    (salesData as LineItem[] || []).forEach((item: LineItem) => {
      const payout = (payouts as PayoutSetting[] || []).find((p: PayoutSetting) => p.product_id === item.product_id)
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      const quantity = item.quantity || 1

      totalSales += 1
      totalRevenue += price * quantity

      if (payout) {
        if (payout.is_percentage) {
          pendingPayout += (price * payout.payout_amount / 100) * quantity
        } else {
          pendingPayout += payout.payout_amount * quantity
        }
      } else {
        // Default 10% payout if no specific setting
        pendingPayout += (price * 0.1) * quantity
      }
    })

    // Group sales by date
    const salesByDate = (salesData as LineItem[] || []).reduce((acc: Record<string, any>, item: LineItem) => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, sales: 0, revenue: 0 }
      }
      acc[date].sales += 1
      const price = typeof item.price === "string" ? Number.parseFloat(item.price || "0") : item.price || 0
      acc[date].revenue += price * (item.quantity || 1)
      return acc
    }, {})

    const salesByDateArray = Object.values(salesByDate || {})
    
    return NextResponse.json({
      totalProducts,
      totalSales,
      totalRevenue,
      pendingPayout,
      salesByDate: salesByDateArray,
    })

  } catch (error) {
    console.error("Error in vendor stats API:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor stats" },
      { status: 500 }
    )
  }
}
