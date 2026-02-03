import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"

// Admin Analytics API Route
// Provides comprehensive platform-wide analytics for admin dashboard

export async function GET(request: NextRequest) {
  try {
    // Verify admin access using admin session cookie
    const adminEmail = getAdminEmailFromCookieStore(request.cookies)
    if (!adminEmail) {
      return NextResponse.json({ error: "Unauthorized - Admin login required" }, { status: 401 })
    }

    const supabase = createClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("range") || "30d"
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()

    if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
    } else {
      startDate = new Date()
      switch (timeRange) {
        case "7d":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(startDate.getDate() - 90)
          break
        case "1y":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        default:
          startDate.setDate(startDate.getDate() - 30)
      }
    }

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime()
    const prevStartDate = new Date(startDate.getTime() - periodLength)
    const prevEndDate = new Date(startDate.getTime())

    // Fetch all line items for current period (excluding test data)
    const { data: currentLineItems, error: currentError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("status", "active")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .neq("vendor_name", "Test Artisan") // Exclude test vendor
      .not("line_item_id", "ilike", "TEST-%") // Exclude any remaining test line items

    if (currentError) {
      console.error("Error fetching current line items:", currentError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Fetch line items for previous period (excluding test data)
    const { data: previousLineItems, error: previousError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("status", "active")
      .gte("created_at", prevStartDate.toISOString())
      .lte("created_at", prevEndDate.toISOString())
      .neq("vendor_name", "Test Artisan") // Exclude test vendor
      .not("line_item_id", "ilike", "TEST-%") // Exclude any remaining test line items

    if (previousError) {
      console.error("Error fetching previous line items:", previousError)
    }

    // Fetch all vendors (excluding test vendors)
    const { data: vendors, error: vendorsError } = await supabase
      .from("vendors")
      .select("vendor_name")
      .neq("vendor_name", "Test Artisan") // Exclude test vendor

    if (vendorsError) {
      console.error("Error fetching vendors:", vendorsError)
    }

    // Fetch all collectors count (excluding test accounts)
    const { count: collectorsCount, error: collectorsError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "collector")
      .neq("email", "beigelbills@gmail.com") // Exclude test collector

    if (collectorsError) {
      console.error("Error fetching collectors count:", collectorsError)
    }

    // Calculate platform stats
    const currentItems = currentLineItems || []
    const previousItems = previousLineItems || []

    const currentRevenue = currentItems.reduce((sum, item) => {
      const price = parseFloat(item.price?.toString() || "0")
      const quantity = parseInt(item.quantity?.toString() || "1")
      return sum + price * quantity
    }, 0)

    const previousRevenue = previousItems.reduce((sum, item) => {
      const price = parseFloat(item.price?.toString() || "0")
      const quantity = parseInt(item.quantity?.toString() || "1")
      return sum + price * quantity
    }, 0)

    const currentOrders = new Set(currentItems.map((item) => item.order_id)).size
    const previousOrders = new Set(previousItems.map((item) => item.order_id)).size

    const revenueGrowth =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0

    const platformStats = {
      totalRevenue: currentRevenue,
      totalOrders: currentOrders,
      totalVendors: vendors?.length || 0,
      totalCollectors: collectorsCount || 0,
      totalProducts: new Set(currentItems.map((item) => item.product_id)).size,
      revenueGrowth,
      ordersGrowth,
      averageOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
    }

    // Calculate vendor analytics
    const vendorMap = new Map()

    currentItems.forEach((item) => {
      const vendorName = item.vendor_name || "Unknown"
      const price = parseFloat(item.price?.toString() || "0")
      const quantity = parseInt(item.quantity?.toString() || "1")
      const revenue = price * quantity

      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, {
          vendorName,
          totalRevenue: 0,
          totalOrders: new Set(),
          products: new Set(),
        })
      }

      const vendor = vendorMap.get(vendorName)
      vendor.totalRevenue += revenue
      vendor.totalOrders.add(item.order_id)
      vendor.products.add(item.product_id)
    })

    const vendorAnalytics = Array.from(vendorMap.values())
      .map((vendor) => ({
        vendorName: vendor.vendorName,
        totalRevenue: vendor.totalRevenue,
        totalOrders: vendor.totalOrders.size,
        totalProducts: vendor.products.size,
        averageOrderValue: vendor.totalOrders.size > 0 ? vendor.totalRevenue / vendor.totalOrders.size : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Calculate product analytics
    const productMap = new Map()

    currentItems.forEach((item) => {
      const productId = item.product_id || "unknown"
      const productName = item.name || "Unknown Product"
      const vendorName = item.vendor_name || "Unknown"
      const price = parseFloat(item.price?.toString() || "0")
      const quantity = parseInt(item.quantity?.toString() || "1")
      const revenue = price * quantity

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productName,
          vendorName,
          revenue: 0,
          units: 0,
        })
      }

      const product = productMap.get(productId)
      product.revenue += revenue
      product.units += quantity
    })

    const productAnalytics = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

    // Calculate sales by date
    const salesByDateMap = new Map()

    currentItems.forEach((item) => {
      const date = new Date(item.created_at)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const price = parseFloat(item.price?.toString() || "0")
      const quantity = parseInt(item.quantity?.toString() || "1")
      const revenue = price * quantity

      if (!salesByDateMap.has(month)) {
        salesByDateMap.set(month, {
          month,
          revenue: 0,
          sales: 0,
        })
      }

      const monthData = salesByDateMap.get(month)
      monthData.revenue += revenue
      monthData.sales += quantity
    })

    const salesByDate = Array.from(salesByDateMap.values()).sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      platformStats,
      vendorAnalytics,
      productAnalytics,
      salesByDate,
    })
  } catch (error) {
    console.error("Error in admin analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
