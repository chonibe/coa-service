import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "/dev/null-server"

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30days"

    // This would normally fetch data from Shopify Analytics API or your database
    // For now, we'll return mock data
    const recentDays = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90

    // Generate mock sales data for the specified time range
    const salesData = Array.from({ length: recentDays }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (recentDays - i))

      return {
        date: date.toISOString().split("T")[0],
        sales: Math.floor(Math.random() * 20) + 1,
        revenue: (Math.floor(Math.random() * 1000) + 100) * (Math.floor(Math.random() * 20) + 1),
      }
    })

    // Calculate totals
    const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0)
    const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0)

    // Generate mock top products
    const topProducts = [
      { title: "Product A", sales: 45, revenue: 2250 },
      { title: "Product B", sales: 32, revenue: 1600 },
      { title: "Product C", sales: 28, revenue: 1400 },
      { title: "Product D", sales: 22, revenue: 1100 },
      { title: "Product E", sales: 18, revenue: 900 },
    ]

    // Generate mock analytics data
    const analyticsData = {
      sessions: Array.from({ length: recentDays }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (recentDays - i))

        const totalSessionsCount = Math.floor(Math.random() * 150) + 50
        const mobileSessionsCount = Math.floor(totalSessionsCount * 0.6)
        const desktopSessionsCount = totalSessionsCount - mobileSessionsCount

        return {
          date: date.toISOString().split("T")[0],
          totalSessionsCount,
          mobileSessionsCount,
          desktopSessionsCount,
          conversionRate: `${(Math.random() * 5 + 1).toFixed(1)}%`,
        }
      }),
    }

    return NextResponse.json({
      timeRange,
      totalSales,
      totalRevenue,
      salesData,
      topProducts,
      analyticsData,
    })
  } catch (error) {
    console.error("Error in Shopify Analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
