import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  console.log("Testing Supabase connection")

  try {
    // Log environment variables (without revealing full values)
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set")
    console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set")
    console.log("Supabase Service Role Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set")
    console.log("Shopify Shop:", SHOPIFY_SHOP ? "Set" : "Not set")
    console.log("Shopify Access Token:", SHOPIFY_ACCESS_TOKEN ? "Set" : "Not set")

    // Test database connection
    const { data, error } = await supabase.from("order_line_items").select("*").limit(1)

    if (error) {
      console.error("Database connection test failed:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to database",
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Test inserting a record with minimal required fields
    const testRecord = {
      order_id: "test-order",
      name: "Test Order",
      line_item_id: "test-line-item",
      product_id: "test-product",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active"
    }

    const { error: insertError } = await supabase.from("order_line_items").insert(testRecord)

    if (insertError) {
      console.error("Failed to insert test record:", insertError)
      return NextResponse.json(
        {
          success: false,
          message: "Connected to Supabase but cannot insert records",
          error: insertError.message,
        },
        { status: 500 },
      )
    }

    // Clean up test record
    await supabase.from("order_line_items").delete().eq("order_id", "test-order")

    // Test Shopify API connection
    let shopifyStatus = "Unknown"
    let shopifyError = null

    try {
      const shopifyResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/shop.json`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      })

      if (shopifyResponse.ok) {
        shopifyStatus = "Connected"
      } else {
        shopifyStatus = "Error"
        shopifyError = `Status ${shopifyResponse.status}: ${await shopifyResponse.text()}`
      }
    } catch (error) {
      shopifyStatus = "Error"
      shopifyError = error.message
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to database and verified write access",
      shopifyStatus,
      shopifyError,
      environmentVariables: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
        shopifyShop: SHOPIFY_SHOP ? "Set" : "Not set",
        shopifyAccessToken: SHOPIFY_ACCESS_TOKEN ? "Set" : "Not set",
      },
    })
  } catch (error: any) {
    console.error("Error testing Supabase connection:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing Supabase connection",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
