import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorProductAnalytics } from "@/lib/google-analytics"
import { GOOGLE_ANALYTICS_PROPERTY_ID } from "@/lib/env"

export async function GET(request: Request) {
  try {
    // Get vendor name from cookie
    const cookieStore = cookies()
    const vendorName = cookieStore.get("vendor_session")?.value

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const days = Number.parseInt(url.searchParams.get("days") || "30", 10)

    // Check if Google Analytics is configured
    if (!GOOGLE_ANALYTICS_PROPERTY_ID) {
      return NextResponse.json(
        {
          error: "Google Analytics is not configured",
          isConfigured: false,
        },
        { status: 200 },
      )
    }

    // Fetch analytics data for this vendor
    const analyticsData = await getVendorProductAnalytics(vendorName, days)

    if ("error" in analyticsData) {
      return NextResponse.json(
        {
          error: analyticsData.error,
          isConfigured: false,
        },
        { status: 200 },
      )
    }

    // Process the data into a more usable format for the frontend
    const processedData = {
      isConfigured: true,
      productViews: processProductViewsData(analyticsData.productViews),
      traffic: processTrafficData(analyticsData.traffic),
      geography: processGeographyData(analyticsData.geography),
    }

    return NextResponse.json(processedData)
  } catch (error: any) {
    console.error("Error in Google Analytics API:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred",
        isConfigured: false,
      },
      { status: 500 },
    )
  }
}

// Helper functions to process the raw GA4 data into more usable formats
function processProductViewsData(data: any) {
  if (!data || !data.rows) return []

  return data.rows.map((row: any) => {
    const pagePath = row.dimensionValues[0].value
    const pageTitle = row.dimensionValues[1].value
    const pageViews = Number.parseInt(row.metricValues[0].value, 10)
    const users = Number.parseInt(row.metricValues[1].value, 10)
    const engagementRate = Number.parseFloat(row.metricValues[2].value)

    // Extract product handle from path
    const productHandle = pagePath.split("/products/")[1]?.split("?")[0] || pagePath

    return {
      productHandle,
      pageTitle,
      pageViews,
      users,
      engagementRate,
    }
  })
}

function processTrafficData(data: any) {
  if (!data || !data.rows) return []

  return data.rows.map((row: any) => {
    const date = row.dimensionValues[0].value
    const pageViews = Number.parseInt(row.metricValues[0].value, 10)
    const users = Number.parseInt(row.metricValues[1].value, 10)
    const sessions = Number.parseInt(row.metricValues[2].value, 10)
    const bounceRate = Number.parseFloat(row.metricValues[3].value)

    return {
      date,
      pageViews,
      users,
      sessions,
      bounceRate,
    }
  })
}

function processGeographyData(data: any) {
  if (!data || !data.rows) return []

  return data.rows.map((row: any) => {
    const country = row.dimensionValues[0].value
    const users = Number.parseInt(row.metricValues[0].value, 10)
    const sessions = Number.parseInt(row.metricValues[1].value, 10)

    return {
      country,
      users,
      sessions,
    }
  })
}
