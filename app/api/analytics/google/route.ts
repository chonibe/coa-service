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

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30days"

    // This would normally fetch data from Google Analytics API
    // For now, we'll return mock data
    const mockData = {
      timeRange,
      pageViews: 12345,
      uniqueVisitors: 5678,
      bounceRate: "45.2%",
      avgSessionDuration: "2m 34s",
      topPages: [
        { path: "/", views: 5432, title: "Homepage" },
        { path: "/products", views: 2345, title: "Products" },
        { path: "/about", views: 1234, title: "About Us" },
        { path: "/contact", views: 987, title: "Contact" },
        { path: "/blog", views: 876, title: "Blog" },
      ],
      trafficSources: [
        { source: "Direct", percentage: 40 },
        { source: "Organic Search", percentage: 30 },
        { source: "Social Media", percentage: 20 },
        { source: "Referral", percentage: 10 },
      ],
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error("Error in Google Analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
