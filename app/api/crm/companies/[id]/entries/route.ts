import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * List all list entries for a company record
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: entries, error } = await supabase
      .from("crm_list_entries")
      .select(`
        *,
        crm_lists (
          id,
          name,
          description,
          color,
          icon
        ),
        crm_list_entry_attribute_values (
          attribute_id,
          value,
          value_json,
          crm_list_attributes (
            field_name,
            display_name,
            field_type
          )
        )
      `)
      .eq("record_id", params.id)
      .eq("record_type", "company")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      entries: entries || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching company list entries:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

