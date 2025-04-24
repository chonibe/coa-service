/**
 * Client-side Supabase helpers that use the API proxy
 * Use these functions in client components instead of direct Supabase access
 */

import { getSupabaseClient } from "@/lib/supabase"

export async function getEditionInfo(orderId: string, lineItemId: string) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const { data, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("line_item_id", lineItemId)
      .single()

    if (error) {
      throw new Error(error.message || "Failed to fetch edition information")
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching edition info:", error)
    throw error
  }
}

export async function fetchOrderLineItems(limit = 20) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const { data, error, count } = await supabase
      .from("order_line_items")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message || "Failed to fetch order line items")
    }

    return { success: true, data, pagination: { total: count || 0, limit } }
  } catch (error: any) {
    console.error("Error fetching order line items:", error)
    throw error
  }
}
