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

    // Test the connection by querying a table
    const { data, error, status } = await supabase
      .from("order_line_items")
      .select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to Supabase",
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      )
    }

    console.log("Supabase connection test successful:", { status, count: data })

    // Test table permissions by attempting to insert a test record
    const testId = `test-${Date.now()}`
    const { error: insertError } = await supabase
      .from("order_line_items")
      .insert({
        order_id: testId,
        line_item_id: testId,
        product_id: testId,
        edition_number: 999,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    // Delete the test record regardless of whether insert succeeded
    try {
      await supabase.from("order_line_items").delete().eq("order_id", testId).eq("line_item_id", testId)
    } catch (deleteError) {
      console.log("Error deleting test record:", deleteError)
    }

    if (insertError) {
      console.error("Supabase insert test failed:", insertError)
      return NextResponse.json(
        {
          success: true,
          connectionStatus: "Connected but cannot insert",
          message: "Connected to Supabase but cannot insert records",
          error: insertError.message,
          code: insertError.code,
        },
        { status: 200 },
      )
    }

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
      connectionStatus: "Connected with full permissions",
      message: "Successfully connected to Supabase with read/write permissions",
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
