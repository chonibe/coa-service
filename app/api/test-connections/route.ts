import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CRON_SECRET } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { guardAdminRequest } from "@/lib/auth-guards"

export async function GET(request: NextRequest) {
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
        message: "Test failed",
        details: { status: shopifyResponse.status },
      }
    }
  } catch (error: any) {
    results.shopify_api = {
      status: "Error",
      message: "Test failed",
      details: null,
    }
  }

  // Test Supabase connection
  try {
    console.log("Testing Supabase connection...")
    const { data, error, status } = await supabase
      .from("order_line_items_v2")
      .select("count", { count: "exact", head: true })

    if (error) {
      results.supabase = {
        status: "Error",
        message: "Test failed",
        details: null,
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
      message: "Test failed",
      details: null,
    }
  }

  // Test cron endpoint (uses Authorization Bearer, not query param)
  try {
    console.log("Testing cron endpoint...")
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const cronUrl = `${baseUrl}/api/cron/sync-shopify-orders`

    const cronResponse = await fetch(cronUrl, {
      headers: CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {},
    })

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
        },
      }
    }
  } catch (error: any) {
    results.cron_endpoint = {
      status: "Error",
      message: "Test failed",
      details: null,
    }
  }

  return NextResponse.json(results)
}
