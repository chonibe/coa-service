import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_WEBHOOK_SECRET, SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseClient = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

/**
 * Verify Shopify webhook signature
 */
function verifyWebhook(body: string, hmac: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET) {
    console.error("Missing Shopify webhook secret")
    return false
  }

  const generatedHash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64")

  return generatedHash === hmac
}

/**
 * Shopify Order Webhook Handler
 * This endpoint receives webhook notifications from Shopify when orders are created or updated
 * It processes the orders and updates the edition numbers accordingly
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseClient) {
      throw new Error("Supabase client not initialized")
    }

    const body = await request.text()
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    const topic = request.headers.get("x-shopify-topic")
    const shop = request.headers.get("x-shopify-shop-domain")

    if (!hmac || !topic || !shop) {
      return new Response("Missing required headers", { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyWebhook(body, hmac)
    if (!isValid) {
      return new Response("Invalid webhook signature", { status: 401 })
    }

    // Parse the webhook data
    const data = JSON.parse(body) as {
      id: number
      name: string
      line_items: Array<{
        id: number
        product_id: number
        variant_id: number
        properties: Array<{ name: string; value: string }>
      }>
    }

    // Log the webhook event
    const { error: logError } = await supabaseClient.from("webhook_logs").insert({
      topic,
      shop,
      payload: data as unknown as Record<string, unknown>,
      processed: false,
      created_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("Error logging webhook:", logError)
    }

    // Process the order
    await processShopifyOrder(data)

    // Update webhook log as processed
    const { error: updateError } = await supabaseClient
      .from("webhook_logs")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("topic", topic)
      .eq("shop", shop)
      .eq("created_at", new Date().toISOString())

    if (updateError) {
      console.error("Error updating webhook log:", updateError)
    }

    return new Response("Webhook processed successfully", { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response("Error processing webhook", { status: 500 })
  }
}

/**
 * Process a Shopify order and update edition numbers
 */
async function processShopifyOrder(order: any) {
  try {
    console.log(`Processing order ${order.id} (${order.name})`)

    // Process all line items in the order
    const lineItems = order.line_items || []
    console.log(`Found ${lineItems.length} line items in order ${order.id}`)

    // Process each line item
    for (const item of lineItems) {
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
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized")
  }

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
    const { data: existingItems, error: queryError } = await supabaseClient
      .from("order_line_items_v2")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)

    if (queryError) {
      console.error(`Error checking existing line item:`, queryError)
      throw queryError
    }

    if (existingItems && existingItems.length > 0) {
      console.log(`Line item ${lineItemId} already exists in database, checking for updates`)

      // Update vendor_name if it's available and not set previously
      if (vendorName && !existingItems[0].vendor_name) {
        const { error: updateError } = await supabaseClient
          .from("order_line_items_v2")
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
    const certificateUrl = `${baseUrl}/certificate/${lineItemId}`
    const certificateToken = crypto.randomUUID()
    const now = new Date().toISOString()

    // Insert the new line item with certificate information and vendor_name
    const { error: insertError } = await supabaseClient.from("order_line_items_v2").insert({
      order_id: orderId,
      order_name: order.name,
      line_item_id: lineItemId,
      product_id: productId,
      variant_id: lineItem.variant_id?.toString(),
      vendor_name: vendorName,
      edition_total: editionSize,
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

    // Resequence edition numbers for this product if it's a limited edition
    const isLimitedEdition = lineItem.properties?.some(
      (prop: any) => prop.name === "limited_edition" && prop.value === "true",
    )
    if (isLimitedEdition) {
      await resequenceEditionNumbers(productId)
    }

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
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized")
  }

  try {
    console.log(`Resequencing edition numbers for product ${productId}`)

    // Get all active line items for this product, ordered by creation date
    const { data: activeItems, error } = await supabaseClient
      .from("order_line_items_v2")
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

      const { error: updateError } = await supabaseClient
        .from("order_line_items_v2")
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
    console.error(`Error resequencing edition numbers:`, error)
    throw error
  }
}

async function generateCertificateUrl(lineItemId: string, orderId: string) {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized")
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const certificateUrl = `${baseUrl}/certificate/${lineItemId}`
    const certificateToken = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error: updateError } = await supabaseClient
      .from("order_line_items_v2")
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
    console.error(`Error generating certificate URL:`, error)
    throw error
  }
}
