import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json()
    const supabase = getSupabaseAdmin()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 })
    }

    switch (action) {
      case "checkTableExists":
        return await checkTableExists(supabase, params.tableName)

      case "createInstagramVendorsTable":
        return await createInstagramVendorsTable(supabase)

      case "getInstagramVendors":
        return await getInstagramVendors(supabase)

      case "createInstagramVendor":
        return await createInstagramVendor(supabase, params)

      case "updateInstagramVendor":
        return await updateInstagramVendor(supabase, params)

      case "deleteInstagramVendor":
        return await deleteInstagramVendor(supabase, params.id)

      case "getEditionInfo":
        return await getEditionInfo(supabase, params)
      case "updateLineItemStatus":
        return await updateLineItemStatus(supabase, params)
      case "resequenceEditionNumbers":
        return await resequenceEditionNumbers(supabase, params)
      case "fetchOrderLineItems":
        return await fetchOrderLineItems(supabase, params)

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error in Supabase proxy:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

async function checkTableExists(supabase: any, tableName: string) {
  try {
    // Check if the table exists by querying the information schema
    const { data, error } = await supabase.rpc("check_table_exists", { table_name: tableName })

    if (error) throw error

    return NextResponse.json({ exists: data }, { status: 200 })
  } catch (error: any) {
    console.error("Error checking if table exists:", error)
    return NextResponse.json({ error: error.message, exists: false }, { status: 500 })
  }
}

async function createInstagramVendorsTable(supabase: any) {
  try {
    // SQL to create the instagram_vendors table
    const sql = `
      CREATE TABLE IF NOT EXISTS instagram_vendors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        instagram_username TEXT,
        instagram_account_id TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(vendor_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_instagram_vendors_vendor_id ON instagram_vendors(vendor_id);
    `

    const { error } = await supabase.rpc("run_sql", { sql })

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error creating instagram_vendors table:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function getInstagramVendors(supabase: any) {
  try {
    const { data, error } = await supabase
      .from("instagram_vendors")
      .select("*")
      .order("vendor_name", { ascending: true })

    if (error) throw error

    return NextResponse.json({ vendors: data }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching Instagram vendors:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function createInstagramVendor(supabase: any, vendor: any) {
  try {
    const { data, error } = await supabase
      .from("instagram_vendors")
      .insert({
        vendor_id: vendor.vendor_id,
        vendor_name: vendor.vendor_name,
        instagram_username: vendor.instagram_username,
        instagram_account_id: vendor.instagram_account_id,
        is_active: vendor.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) throw error

    return NextResponse.json({ vendor: data[0] }, { status: 200 })
  } catch (error: any) {
    console.error("Error creating Instagram vendor:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function updateInstagramVendor(supabase: any, vendor: any) {
  try {
    const { data, error } = await supabase
      .from("instagram_vendors")
      .update({
        vendor_id: vendor.vendor_id,
        vendor_name: vendor.vendor_name,
        instagram_username: vendor.instagram_username,
        instagram_account_id: vendor.instagram_account_id,
        is_active: vendor.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendor.id)
      .select()

    if (error) throw error

    return NextResponse.json({ vendor: data[0] }, { status: 200 })
  } catch (error: any) {
    console.error("Error updating Instagram vendor:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function deleteInstagramVendor(supabase: any, id: string) {
  try {
    const { error } = await supabase.from("instagram_vendors").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("Error deleting Instagram vendor:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get edition info for a line item
async function getEditionInfo(supabase: any, params: any) {
  const { orderId, lineItemId } = params

  if (!orderId || !lineItemId) {
    return NextResponse.json({ error: "Order ID and Line Item ID are required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("order_line_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("line_item_id", lineItemId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

// Update line item status
async function updateLineItemStatus(supabase: any, params: any) {
  const { lineItemId, orderId, status, reason } = params

  if (!lineItemId || !orderId || !status) {
    return NextResponse.json({ error: "Line item ID, order ID, and status are required" }, { status: 400 })
  }

  // Validate status
  if (status !== "active" && status !== "removed") {
    return NextResponse.json({ error: "Status must be either 'active' or 'removed'" }, { status: 400 })
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Add reason if provided
  if (reason) {
    updateData.removed_reason = reason
  }

  // If marking as removed, set edition_number to null
  if (status === "removed") {
    updateData.edition_number = null
  }

  // Update the line item
  const { error, data } = await supabase
    .from("order_line_items")
    .update(updateData)
    .eq("line_item_id", lineItemId)
    .eq("order_id", orderId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If we're marking an item as removed, resequence the edition numbers
  if (status === "removed") {
    // Get the product ID for this line item
    const { data: lineItemData, error: lineItemError } = await supabase
      .from("order_line_items")
      .select("product_id")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .single()

    if (!lineItemError && lineItemData && lineItemData.product_id) {
      // Resequence edition numbers for this product
      await resequenceEditionNumbers(supabase, { productId: lineItemData.product_id })
    }
  }

  return NextResponse.json({ success: true, updatedAt: new Date().toISOString() })
}

// Resequence edition numbers for a product
async function resequenceEditionNumbers(supabase: any, params: any) {
  const { productId } = params

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
  }

  // Get all active line items for this product, ordered by creation date
  const { data: activeItems, error } = await supabase
    .from("order_line_items")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "active")
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!activeItems || activeItems.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No active items found for resequencing",
      activeItems: 0,
      removedItems: 0,
    })
  }

  // Assign new sequential edition numbers starting from 1
  let editionCounter = 1
  let updatedCount = 0

  for (const item of activeItems) {
    const { error: updateError } = await supabase
      .from("order_line_items")
      .update({
        edition_number: editionCounter,
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", item.line_item_id)
      .eq("order_id", item.order_id)

    if (!updateError) {
      updatedCount++
      editionCounter++
    }
  }

  // Get count of removed items
  const { count: removedCount } = await supabase
    .from("order_line_items")
    .select("*", { count: "exact" })
    .eq("product_id", productId)
    .eq("status", "removed")

  return NextResponse.json({
    success: true,
    message: `Resequencing complete. Assigned edition numbers 1 through ${editionCounter - 1}`,
    activeItems: activeItems.length,
    updatedCount,
    removedItems: removedCount || 0,
  })
}

// Fetch order line items
async function fetchOrderLineItems(supabase: any, params: any) {
  const { limit = 20 } = params

  const { data, error, count } = await supabase
    .from("order_line_items")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total: count || 0,
      limit,
    },
  })
}
