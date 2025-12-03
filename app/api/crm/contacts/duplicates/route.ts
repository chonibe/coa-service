import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customer_id")

    let query = supabase.rpc("find_duplicate_contacts")
    
    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Deduplication] Error finding duplicates:", error)
      return NextResponse.json(
        { error: "Failed to find duplicate contacts" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      duplicates: data || [],
    })
  } catch (err: any) {
    console.error("[Deduplication] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merged_into_customer_id, merged_from_customer_id, merge_reason } = body

    if (!merged_into_customer_id || !merged_from_customer_id) {
      return NextResponse.json(
        { error: "Both customer IDs are required" },
        { status: 400 }
      )
    }

    // Get data from the customer being merged
    const { data: fromCustomer, error: fromError } = await supabase
      .from("crm_customers")
      .select("*")
      .eq("id", merged_from_customer_id)
      .single()

    if (fromError || !fromCustomer) {
      return NextResponse.json(
        { error: "Source customer not found" },
        { status: 404 }
      )
    }

    // Get data from the customer being merged into
    const { data: toCustomer, error: toError } = await supabase
      .from("crm_customers")
      .select("*")
      .eq("id", merged_into_customer_id)
      .single()

    if (toError || !toCustomer) {
      return NextResponse.json(
        { error: "Target customer not found" },
        { status: 404 }
      )
    }

    // Merge data (prefer non-null values from both)
    const mergedData: any = {
      email: toCustomer.email || fromCustomer.email,
      first_name: toCustomer.first_name || fromCustomer.first_name,
      last_name: toCustomer.last_name || fromCustomer.last_name,
      phone: toCustomer.phone || fromCustomer.phone,
      notes: [toCustomer.notes, fromCustomer.notes].filter(Boolean).join("\n\n---\n\n"),
      tags: [...(toCustomer.tags || []), ...(fromCustomer.tags || [])],
      instagram_id: toCustomer.instagram_id || fromCustomer.instagram_id,
      facebook_id: toCustomer.facebook_id || fromCustomer.facebook_id,
      whatsapp_id: toCustomer.whatsapp_id || fromCustomer.whatsapp_id,
      updated_at: new Date().toISOString(),
    }

    // Merge arrays
    if (fromCustomer.chinadivision_order_ids) {
      mergedData.chinadivision_order_ids = [
        ...(toCustomer.chinadivision_order_ids || []),
        ...fromCustomer.chinadivision_order_ids,
      ]
    }
    if (fromCustomer.shopify_order_ids) {
      mergedData.shopify_order_ids = [
        ...(toCustomer.shopify_order_ids || []),
        ...fromCustomer.shopify_order_ids,
      ]
    }

    // Update the target customer with merged data
    const { error: updateError } = await supabase
      .from("crm_customers")
      .update(mergedData)
      .eq("id", merged_into_customer_id)

    if (updateError) {
      console.error("[Deduplication] Error updating merged customer:", updateError)
      return NextResponse.json(
        { error: "Failed to merge customer data" },
        { status: 500 }
      )
    }

    // Update all conversations to point to the merged customer
    const { error: convError } = await supabase
      .from("crm_conversations")
      .update({ customer_id: merged_into_customer_id })
      .eq("customer_id", merged_from_customer_id)

    if (convError) {
      console.error("[Deduplication] Error updating conversations:", convError)
    }

    // Update all activities to point to the merged customer
    const { error: activityError } = await supabase
      .from("crm_activities")
      .update({ customer_id: merged_into_customer_id })
      .eq("customer_id", merged_from_customer_id)

    if (activityError) {
      console.error("[Deduplication] Error updating activities:", activityError)
    }

    // Record merge history
    const { error: historyError } = await supabase
      .from("crm_contact_merge_history")
      .insert({
        merged_into_customer_id,
        merged_from_customer_id,
        merge_reason: merge_reason || "User-initiated merge",
        merged_data: fromCustomer,
      })

    if (historyError) {
      console.error("[Deduplication] Error recording merge history:", historyError)
    }

    // Delete the duplicate customer
    const { error: deleteError } = await supabase
      .from("crm_customers")
      .delete()
      .eq("id", merged_from_customer_id)

    if (deleteError) {
      console.error("[Deduplication] Error deleting duplicate customer:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete duplicate customer" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Contacts merged successfully",
    })
  } catch (err: any) {
    console.error("[Deduplication] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
