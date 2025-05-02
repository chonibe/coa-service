import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_WEBHOOK_SECRET, SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"

/**
 * Shopify Order Webhook Handler
 * This endpoint receives webhook notifications from Shopify when orders are created or updated
 * It processes the orders and updates the edition numbers accordingly
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Shopify
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256")

    if (!hmacHeader || !SHOPIFY_WEBHOOK_SECRET) {
      console.error("Missing HMAC header or webhook secret")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the raw request body for HMAC verification
    const rawBody = await request.text()

    // Verify the HMAC signature
    const generatedHash = crypto.createHmac("sha256", SHOPIFY_WEBHOOK_SECRET).update(rawBody, "utf8").digest("base64")

    if (generatedHash !== hmacHeader) {
      console.error("HMAC verification failed")
      return NextResponse.json({ error: "HMAC verification failed" }, { status: 401 })
    }

    // Parse the webhook body
    const webhookData = JSON.parse(rawBody)
    console.log("Received Shopify order webhook:", webhookData.id)

    // Process the order
    await processShopifyOrder(webhookData)

    // Log the webhook event
    try {
      await supabase.from("webhook_logs").insert({
        type: "shopify_order",
        created_at: new Date().toISOString(),
        details: {
          orderId: webhookData.id,
          orderName: webhookData.name,
          orderNumber: webhookData.order_number,
          processedAt: webhookData.processed_at,
          lineItemsCount: webhookData.line_items?.length || 0,
        },
      })
    } catch (logError) {
      console.error("Error logging webhook event:", logError)
      // Continue even if logging fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing Shopify webhook:", error)
    return NextResponse.json({ error: error.message || "Failed to process webhook" }, { status: 500 })
  }
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

// Add the getProductMetafields function to this file as well
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

// Update the processLineItem function to include vendor_name from line items

async function processLineItem(order: any, lineItem: any) {
  try {
    const orderId = order.id.toString()
    const lineItemId = lineItem.id.toString()
    const productId = lineItem.product_id.toString()
    // Extract vendor name from line item properties or vendor field
    const vendorName =
      lineItem.vendor ||
      (lineItem.properties && lineItem.properties.find((p: any) => p.name === "vendor")?.value) ||
      null

    console.log(`Processing line item ${lineItemId} for product ${productId}, vendor: ${vendorName || "Unknown"}`)

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

      // Update vendor_name if it's available and not set previously
      if (vendorName && !existingItems[0].vendor_name) {
        const { error: updateError } = await supabase
          .from("order_line_items")
          .update({
            vendor_name: vendorName,
            updated_at: new Date().toISOString(),
          })
          .eq("line_item_id", lineItemId)
          .eq("order_id", orderId)

        if (updateError) {
          console.error(`Error updating vendor name:`, updateError)
        } else {
          console.log(`Updated vendor name to ${vendorName} for line item ${lineItemId}`)
        }
      }

      // Check if it has a certificate URL, if not, generate one
      if (!existingItems[0].certificate_url) {
        await generateCertificateUrl(lineItemId, orderId)
      }

      return
    }

    // Generate certificate URL with query parameters
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const certificateUrl = `${baseUrl}/pages/certificate?line_item_id=${lineItemId}`
    const certificateToken = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the new line item with certificate information and vendor_name
    const { error: insertError } = await supabase.from("order_line_items").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      vendor_name: vendorName, // Add vendor name to the insert
      // Don't set edition_number here, it will be assigned during resequencing
      edition_total: editionSize, // Add the edition_total from the metafield
      created_at: new Date(order.created_at).toISOString(),
      updated_at: now,
      status: "active",
      certificate_url: certificateUrl,
      certificate_token: certificateToken,
      certificate_generated_at: now,
    })

    if (insertError) {
      console.error(`Error inserting line item:`, insertError)
      throw insertError
    }

    console.log(
      `Successfully inserted line item ${lineItemId} with certificate URL and vendor ${vendorName || "Unknown"}`,
    )

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
      // Generate certificate URL if it doesn't exist
      const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
      const certificateUrl = item.certificate_url || `${baseUrl}/certificate/${item.line_item_id}`
      const certificateToken = item.certificate_token || crypto.randomUUID()
      const certificateGeneratedAt = item.certificate_generated_at || new Date().toISOString()

      const { error: updateError } = await supabase
        .from("order_line_items")
        .update({
          edition_number: editionCounter,
          updated_at: new Date().toISOString(),
          certificate_url: certificateUrl,
          certificate_token: certificateToken,
          certificate_generated_at: certificateGeneratedAt,
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

async function generateCertificateUrl(lineItemId: string, orderId: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const certificateUrl = `${baseUrl}/pages/certificate?line_item_id=${lineItemId}`
    const certificateToken = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from("order_line_items")
      .update({
        certificate_url: certificateUrl,
        certificate_token: certificateToken,
        certificate_generated_at: now,
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (updateError) {
      console.error(`Error updating certificate URL for item ${lineItemId}:`, updateError)
      throw updateError
    } else {
      console.log(`Updated item ${lineItemId} with certificate URL`)
    }
  } catch (error) {
    console.error("Error in generateCertificateUrl:", error)
    throw error
  }
}
