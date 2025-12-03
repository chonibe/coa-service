import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { merged_into_customer_id, merged_from_customer_id, merge_reason, conflict_resolution } = body

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

    // Merge data with conflict resolution support
    // conflict_resolution is an object like: { email: "keep_target", first_name: "keep_source" }
    const mergedData: any = {
      updated_at: new Date().toISOString(),
    }

    // Helper to resolve conflicts
    const resolveConflict = (field: string, targetValue: any, sourceValue: any) => {
      if (conflict_resolution && conflict_resolution[field]) {
        const resolution = conflict_resolution[field]
        if (resolution === "keep_source") return sourceValue
        if (resolution === "keep_target") return targetValue
        if (resolution === "merge") {
          // For text fields, merge with separator
          if (typeof targetValue === "string" && typeof sourceValue === "string") {
            return [targetValue, sourceValue].filter(Boolean).join("\n\n---\n\n")
          }
          // For arrays, combine
          if (Array.isArray(targetValue) || Array.isArray(sourceValue)) {
            return [...(targetValue || []), ...(sourceValue || [])]
          }
        }
      }
      // Default: prefer target, fallback to source
      return targetValue || sourceValue
    }

    mergedData.email = resolveConflict("email", toCustomer.email, fromCustomer.email)
    mergedData.first_name = resolveConflict("first_name", toCustomer.first_name, fromCustomer.first_name)
    mergedData.last_name = resolveConflict("last_name", toCustomer.last_name, fromCustomer.last_name)
    mergedData.phone = resolveConflict("phone", toCustomer.phone, fromCustomer.phone)
    mergedData.notes = resolveConflict("notes", toCustomer.notes, fromCustomer.notes)
    mergedData.tags = [...new Set([...(toCustomer.tags || []), ...(fromCustomer.tags || [])])] // Remove duplicates
    mergedData.instagram_id = resolveConflict("instagram_id", toCustomer.instagram_id, fromCustomer.instagram_id)
    mergedData.facebook_id = resolveConflict("facebook_id", toCustomer.facebook_id, fromCustomer.facebook_id)
    mergedData.whatsapp_id = resolveConflict("whatsapp_id", toCustomer.whatsapp_id, fromCustomer.whatsapp_id)

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

    // Emit webhook event for record merge
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "record.merged",
          payload: {
            object: "person",
            merged_record_id: merged_into_customer_id,
            duplicate_record_id: merged_from_customer_id,
            merge_reason: merge_reason || "User-initiated merge",
            conflict_resolution: conflict_resolution || {},
            merged_data: mergedData,
            actor: {
              type: "user",
              id: (await supabase.auth.getUser()).data.user?.id || null,
            },
          },
        }),
      })
    } catch (webhookError) {
      // Don't fail the merge if webhook fails
      console.error("[Deduplication] Error emitting webhook:", webhookError)
    }

    // Fetch updated merged record
    const { data: mergedRecord } = await supabase
      .from("crm_customers")
      .select("*")
      .eq("id", merged_into_customer_id)
      .single()

    return NextResponse.json({
      success: true,
      message: "Contacts merged successfully",
      merged_record: mergedRecord,
    })
  } catch (err: any) {
    console.error("[Deduplication] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
