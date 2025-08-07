import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CRON_SECRET } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      SHOPIFY_SHOP: SHOPIFY_SHOP ? "Set" : "Not set",
      SHOPIFY_ACCESS_TOKEN: SHOPIFY_ACCESS_TOKEN ? "Set" : "Not set",
      CRON_SECRET: CRON_SECRET ? "Set" : "Not set",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
    },
    shopify_api: {
      status: "Not tested",
      message: "",
      details: null,
    },
    supabase: {
      status: "Not tested",
      message: "",
      details: null,
    },
    cron_endpoint: {
      status: "Not tested",
      message: "",
      details: null,
    },
  }

  // Test Shopify API connection
  try {
    console.log("Testing Shopify API connection...")
    const shopifyUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/shop.json`

    const shopifyResponse = await fetch(shopifyUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (shopifyResponse.ok) {
      const shopData = await shopifyResponse.json()
      results.shopify_api = {
        status: "Success",
        message: "Successfully connected to Shopify API",
        details: {
          shop_name: shopData.shop?.name || "Unknown",
          shop_email: shopData.shop?.email || "Unknown",
          shop_domain: shopData.shop?.domain || "Unknown",
        },
      }
    } else {
      const errorText = await shopifyResponse.text()
      results.shopify_api = {
        status: "Error",
        message: `Failed to connect to Shopify API: ${shopifyResponse.status} ${shopifyResponse.statusText}`,
        details: {
          status: shopifyResponse.status,
          response: errorText.substring(0, 500),
        },
      }
    }
  } catch (error: any) {
    results.shopify_api = {
      status: "Error",
      message: `Exception when connecting to Shopify API: ${error.message}`,
      details: {
        error: error.toString(),
        stack: error.stack,
      },
    }
  }

  // Test Supabase connection
  try {
    console.log("Testing Supabase connection...")
    const { data, error, status } = await supabase
      .from("order_line_items")
      .select("count", { count: "exact", head: true })

    if (error) {
      results.supabase = {
        status: "Error",
        message: `Failed to connect to Supabase: ${error.message}`,
        details: {
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      }
    } else {
      results.supabase = {
        status: "Success",
        message: "Successfully connected to Supabase",
        details: {
          status,
          count: data,
        },
      }
    }
  } catch (error: any) {
    results.supabase = {
      status: "Error",
      message: `Exception when connecting to Supabase: ${error.message}`,
      details: {
        error: error.toString(),
        stack: error.stack,
      },
    }
  }

  // Test cron endpoint
  try {
    console.log("Testing cron endpoint...")
    // Build the correct URL for the cron job
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    // Make sure we're using the correct path without "/authenticate/"
    const cronUrl = `${baseUrl}/api/cron/sync-shopify-orders?secret=${CRON_SECRET}`

    console.log(`Testing cron endpoint at: ${cronUrl.replace(CRON_SECRET || "", "REDACTED")}`)

    const cronResponse = await fetch(cronUrl)

    if (cronResponse.ok) {
      const cronData = await cronResponse.json()
      results.cron_endpoint = {
        status: "Success",
        message: "Successfully connected to cron endpoint",
        details: cronData,
      }
    } else {
      let errorText = ""
      try {
        errorText = await cronResponse.text()
      } catch (e) {
        errorText = "Could not read response text"
      }

      results.cron_endpoint = {
        status: "Error",
        message: `Failed to connect to cron endpoint: ${cronResponse.status} ${cronResponse.statusText}`,
        details: {
          status: cronResponse.status,
          response: errorText.substring(0, 500),
          url: cronUrl.replace(CRON_SECRET || "", "REDACTED"),
        },
      }
    }
  } catch (error: any) {
    results.cron_endpoint = {
      status: "Error",
      message: `Exception when connecting to cron endpoint: ${error.message}`,
      details: {
        error: error.toString(),
        stack: error.stack,
      },
    }
  }

  return NextResponse.json(results)
}
