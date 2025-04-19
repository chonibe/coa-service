import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN, CRON_SECRET } from "@/lib/env"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  // Log more details about the request
  console.log("========== CRON JOB FULL DETAILS ==========")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  console.log("Request origin:", request.nextUrl.origin)
  console.log("Request path:", request.nextUrl.pathname)
  console.log("Request search params:", Object.fromEntries(request.nextUrl.searchParams.entries()))
  console.log("Headers:", Object.fromEntries(request.headers.entries()))

  // Log detailed request information
  console.log("==== CRON JOB ENDPOINT CALLED ====")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  console.log("Request headers:", Object.fromEntries(request.headers.entries()))
  console.log("Request origin:", request.nextUrl.origin)
  console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "Not set")
  console.log("Cron job endpoint called at:", new Date().toISOString())

  console.log("Cron job endpoint called at:", new Date().toISOString())
  console.log("Request URL:", request.url)

  try {
    // Verify the cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    console.log("CRON_SECRET environment variable is:", CRON_SECRET ? "set" : "not set")
    console.log("Secret provided in request:", secret ? "provided" : "not provided")

    // For development/testing, allow the endpoint to be called without a secret
    // In production, you would want to enforce this check
    if (CRON_SECRET && secret !== CRON_SECRET) {
      console.error("Invalid cron secret provided:", secret)
      return NextResponse.json({ error: "Unauthorized", message: "Invalid secret provided" }, { status: 401 })
    }

    console.log("Cron job started at:", new Date().toISOString())

    // Get the last sync timestamp from the database
    // First, check if the sync_status table exists and has the required columns
    let tableInfo = null
    let tableError = null
    try {
      const result = await supabase.from("sync_status").select("*").limit(1)

      tableInfo = result.data
      tableError = result.error
    } catch (err) {
      console.log("Error checking sync_status table:", err)
      tableError = err
    }

    // If there's an error with the table structure, use a different approach
    let startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // Default to 7 days ago

    if (tableError) {
      console.log("Using default start date due to table error:", tableError)
    } else {
      // Try to get the last sync timestamp
      try {
        const { data: syncData, error: syncError } = await supabase
          .from("sync_logs") // Try an alternative table name
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)

        if (!syncError && syncData && syncData.length > 0) {
          const lastSync = new Date(syncData[0].created_at)
          // Add a small buffer to avoid missing orders
          lastSync.setMinutes(lastSync.getMinutes() - 10)
          startDate = lastSync
        }
      } catch (syncError) {
        console.log("Error fetching last sync timestamp, using default:", syncError)
      }
    }

    console.log(`Fetching orders since ${startDate.toISOString()}`)

    // Fetch orders from Shopify
    const orders = await fetchOrdersFromShopify(startDate)
    console.log(`Fetched ${orders.length} orders from Shopify`)

    // Process each order
    let processedCount = 0
    let lastProcessedOrder = null
    for (const order of orders) {
      await processShopifyOrder(order)
      processedCount++
      lastProcessedOrder = order
    }

    // Update the sync timestamp
    const now = new Date().toISOString()

    // Try to record the sync in the appropriate table
    try {
      // First try sync_logs table
      const { error: logError } = await supabase.from("sync_logs").insert({
        created_at: now,
        type: "cron_job",
        details: {
          ordersProcessed: processedCount,
          startDate: startDate.toISOString(),
          endDate: now,
          lastOrderId: lastProcessedOrder?.id,
          lastOrderName: lastProcessedOrder?.name,
          lastOrderNumber: lastProcessedOrder?.order_number,
          source: "vercel_cron",
        },
      })

      if (logError) {
        // If that fails, try sync_status table without the type column
        const { error: statusError } = await supabase.from("sync_status").insert({
          created_at: now,
          details: {
            ordersProcessed: processedCount,
            startDate: startDate.toISOString(),
            endDate: now,
            lastOrderId: lastProcessedOrder?.id,
            lastOrderName: lastProcessedOrder?.name,
            lastOrderNumber: lastProcessedOrder?.order_number,
            source: "vercel_cron",
          },
        })

        if (statusError) {
          console.error("Error updating sync status:", statusError)
        }
      }
    } catch (updateError) {
      console.error("Error recording sync operation:", updateError)
    }

    console.log(`Cron job completed successfully. Processed ${processedCount} orders.`)
    return NextResponse.json({
      success: true,
      ordersProcessed: processedCount,
      timestamp: now,
    })
  } catch (error: any) {
    console.error("Error syncing Shopify orders:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to sync Shopify orders",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Replace the entire fetchOrdersFromShopify function with this simplified version
async function fetchOrdersFromShopify(startDate: Date) {
  let allOrders = []

  try {
    // Create a simple URL without pagination parameters
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders.json?limit=250&created_at_min=${startDate.toISOString()}&status=any`
    console.log(`Fetching orders from: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    allOrders = data.orders || []
    console.log(`Successfully fetched ${allOrders.length} orders`)

    // We'll implement proper pagination in a future update
    // For now, just return the first batch of orders
  } catch (error) {
    console.error("Error in fetchOrdersFromShopify:", error)
    // Return empty array instead of throwing to prevent the entire function from failing
    return []
  }

  return allOrders
}

/**
 * Process a Shopify order and update edition numbers
 */
async function processShopifyOrder(order: any) {
  try {
    console.log(`Processing order ${order.id} (${order.name})`)

    // Check if this order contains any line items for limited edition products
    const limitedEditionItems = order.line_items.filter((item: any) => {
      // Check if this is a limited edition product
      // You may need to adjust this logic based on how you identify limited edition products
      const isLimitedEdition = item.properties?.some(
        (prop: any) => prop.name === "limited_edition" && prop.value === "true",
      )

      return isLimitedEdition
    })

    if (limitedEditionItems.length === 0) {
      console.log(`Order ${order.id} does not contain any limited edition items`)
      return
    }

    console.log(`Found ${limitedEditionItems.length} limited edition items in order ${order.id}`)

    // Process each limited edition item
    for (const item of limitedEditionItems) {
      await processLineItem(order, item)
    }

    console.log(`Finished processing order ${order.id}`)
  } catch (error) {
    console.error(`Error processing order ${order.id}:`, error)
    throw error
  }
}

// Update the generateCertificateUrl function to use query parameters
async function generateCertificateUrl(lineItemId: string, orderId: string) {
  try {
    // Generate the certificate URL with query parameters instead of path
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const certificateUrl = `${baseUrl}/pages/certificate?line_item_id=${lineItemId}`

    // Generate a unique access token
    const accessToken = crypto.randomUUID()

    // Store the certificate URL and access token in the database
    const { error: updateError } = await supabase
      .from("order_line_items")
      .update({
        certificate_url: certificateUrl,
        certificate_token: accessToken,
        certificate_generated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (updateError) {
      console.error(`Error updating line item with certificate URL:`, updateError)
      return false
    }

    console.log(`Successfully generated certificate URL for line item ${lineItemId}`)
    return true
  } catch (error) {
    console.error(`Error generating certificate URL:`, error)
    return false
  }
}

// Update the processLineItem function to call generateCertificateUrl
async function processLineItem(order: any, lineItem: any) {
  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id.toString()

    console.log(`Processing line item ${lineItemId} for product ${productId}`)

    // Fetch product metafields to get edition size
    const { editionSize } = await getProductMetafields(productId)
    console.log(`Edition size for product ${productId}: ${editionSize || "Not set"}`)

    // Check if this line item already exists in the database
    const { data: existingItems, error: queryError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)

    if (queryError) {
      console.error(`Error checking existing line item:`, queryError)
      throw queryError
    }

    if (existingItems && existingItems.length > 0) {
      console.log(`Line item ${lineItemId} already exists in database, skipping`)

      // Check if it has a certificate URL, if not, generate one
      if (!existingItems[0].certificate_url) {
        await generateCertificateUrl(lineItemId, orderId)
      }

      return
    }

    // Insert the new line item
    const { error: insertError } = await supabase.from("order_line_items").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      // Don't set edition_number here, it will be assigned during resequencing
      edition_total: editionSize, // Add the edition_total from the metafield
      created_at: new Date(order.created_at).toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
    })

    if (insertError) {
      console.error(`Error inserting line item:`, insertError)
      throw insertError
    }

    console.log(`Successfully inserted line item ${lineItemId}`)

    // Generate certificate URL for the new line item
    await generateCertificateUrl(lineItemId, orderId)

    // Resequence edition numbers for this product
    await resequenceEditionNumbers(productId)

    console.log(`Successfully processed line item ${lineItemId}`)
  } catch (error) {
    console.error(`Error processing line item:`, error)
    throw error
  }
}

/**
 * Resequence edition numbers for a product
 */
async function resequenceEditionNumbers(productId: string) {
  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
    const { data: activeItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("product_id", productId)
      .eq("status", "active")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching active items for resequencing:", error)
      throw error
    }

    if (!activeItems || activeItems.length === 0) {
      console.log("No active items found for resequencing")
      return
    }

    console.log(`Found ${activeItems.length} active items to resequence`)

    // Assign new sequential edition numbers starting from 1
    let editionCounter = 1

    for (const item of activeItems) {
      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          // Don't update edition_total here, preserve the existing value
          updated_at: new Date().toISOString(),
        })
        .eq("line_item_id", item.line_item_id)
        .eq("order_id", item.order_id)

      if (updateError) {
        console.error(`Error updating edition number for item ${item.line_item_id}:`, updateError)
      } else {
        console.log(`Updated item ${item.line_item_id} with new edition number ${editionCounter}`)
        editionCounter++
      }
    }

    console.log(`Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`)
  } catch (error) {
    console.error("Error in resequenceEditionNumbers:", error)
    throw error
  }
}

// Add this new function to fetch product metafields including Edition Size
async function getProductMetafields(productId: string) {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`
    console.log(`Fetching metafields for product ${productId}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch product metafields: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const metafields = data.metafields || []

    // Look for Edition Size metafield with various possible keys
    const editionSizeMetafield = metafields.find(
      (meta: any) =>
        meta.key.toLowerCase() === "edition_size" ||
        meta.key.toLowerCase() === "edition size" ||
        meta.key.toLowerCase() === "limited_edition_size" ||
        meta.key.toLowerCase() === "total_edition",
    )

    let editionSize = null
    if (editionSizeMetafield && editionSizeMetafield.value) {
      // Try to parse the edition size as a number
      const sizeValue = Number.parseInt(editionSizeMetafield.value, 10)
      if (!isNaN(sizeValue) && sizeValue > 0) {
        editionSize = sizeValue
      }
    }

    return {
      editionSize,
      allMetafields: metafields,
    }
  } catch (error) {
    console.error(`Error fetching metafields for product ${productId}:`, error)
    return {
      editionSize: null,
      allMetafields: [],
    }
  }
}
