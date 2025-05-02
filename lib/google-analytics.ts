import { BetaAnalyticsDataClient } from "@google-analytics/data"
import {
  GOOGLE_ANALYTICS_PRIVATE_KEY,
  GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_ANALYTICS_PROPERTY_ID,
} from "./env"

// Initialize the Google Analytics Data API client
let analyticsDataClient: BetaAnalyticsDataClient | null = null

// Check if we have the required credentials
const hasCredentials =
  GOOGLE_ANALYTICS_PRIVATE_KEY && GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL && GOOGLE_ANALYTICS_PROPERTY_ID

if (hasCredentials) {
  try {
    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_ANALYTICS_PRIVATE_KEY,
      },
    })
  } catch (error) {
    console.error("Failed to initialize Google Analytics client:", error)
  }
}

export interface AnalyticsQueryOptions {
  startDate: string // Format: 'YYYY-MM-DD'
  endDate: string // Format: 'YYYY-MM-DD'
  dimensions?: string[]
  metrics?: string[]
  filters?: {
    fieldName: string
    stringFilter?: {
      value: string
      matchType: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS" | "FULL_REGEXP" | "PARTIAL_REGEXP"
    }
    inListFilter?: {
      values: string[]
    }
    numericFilter?: {
      operation: "EQUAL" | "LESS_THAN" | "LESS_THAN_OR_EQUAL" | "GREATER_THAN" | "GREATER_THAN_OR_EQUAL"
      value: {
        int64Value: string
      }
    }
  }[]
  limit?: number
}

export async function queryAnalytics(options: AnalyticsQueryOptions) {
  if (!analyticsDataClient || !GOOGLE_ANALYTICS_PROPERTY_ID) {
    throw new Error("Google Analytics client not initialized or property ID missing")
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GOOGLE_ANALYTICS_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: options.startDate,
          endDate: options.endDate,
        },
      ],
      dimensions: options.dimensions?.map((name) => ({ name })) || [],
      metrics: options.metrics?.map((name) => ({ name })) || [],
      dimensionFilter: options.filters
        ? {
            andGroup: {
              expressions: options.filters.map((filter) => ({
                filter: {
                  fieldName: filter.fieldName,
                  stringFilter: filter.stringFilter,
                  inListFilter: filter.inListFilter,
                  numericFilter: filter.numericFilter,
                },
              })),
            },
          }
        : undefined,
      limit: options.limit,
    })

    return response
  } catch (error) {
    console.error("Error querying Google Analytics:", error)
    throw error
  }
}

// Helper function to get product analytics for a specific vendor
export async function getVendorProductAnalytics(vendorName: string, days = 30) {
  if (!analyticsDataClient) {
    return { error: "Google Analytics not configured" }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const endDate = new Date()

  try {
    // Format dates as YYYY-MM-DD
    const formattedStartDate = startDate.toISOString().split("T")[0]
    const formattedEndDate = endDate.toISOString().split("T")[0]

    // Query for product views filtered by vendor name
    // Note: This assumes you have a custom dimension for vendor name
    // You may need to adjust this based on your actual GA4 setup
    const productViewsResponse = await queryAnalytics({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      dimensions: ["pagePath", "pageTitle"],
      metrics: ["screenPageViews", "totalUsers", "engagementRate"],
      filters: [
        {
          fieldName: "pagePath",
          stringFilter: {
            value: `/products/`,
            matchType: "CONTAINS",
          },
        },
        // If you have a custom dimension for vendor, you can filter by it
        // {
        //   fieldName: 'customEvent:vendor',
        //   stringFilter: {
        //     value: vendorName,
        //     matchType: 'EXACT',
        //   },
        // },
      ],
      limit: 20,
    })

    // Query for overall traffic metrics
    const trafficResponse = await queryAnalytics({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      dimensions: ["date"],
      metrics: ["screenPageViews", "totalUsers", "sessions", "bounceRate"],
    })

    // Query for geographic data
    const geoResponse = await queryAnalytics({
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      dimensions: ["country"],
      metrics: ["totalUsers", "sessions"],
      limit: 10,
    })

    return {
      productViews: productViewsResponse,
      traffic: trafficResponse,
      geography: geoResponse,
    }
  } catch (error) {
    console.error("Error fetching vendor analytics:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}
