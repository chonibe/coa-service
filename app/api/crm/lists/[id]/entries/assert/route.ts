import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Assert List Entry Endpoint
 * Creates or updates a list entry for a given parent record
 * Similar to Attio's assert pattern
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const {
      record_id,
      record_type,
      position,
      attribute_values,
    } = body

    if (!record_id || !record_type) {
      return NextResponse.json(
        { error: "record_id and record_type are required" },
        { status: 400 }
      )
    }

    // Verify list exists
    const { data: list } = await supabase
      .from("crm_lists")
      .select("object_type")
      .eq("id", params.id)
      .single()

    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404 }
      )
    }

    if (list.object_type !== record_type) {
      return NextResponse.json(
        { error: `List is for ${list.object_type} records, not ${record_type}` },
        { status: 400 }
      )
    }

    // Check if entry exists
    const { data: existingEntry } = await supabase
      .from("crm_list_entries")
      .select("*")
      .eq("list_id", params.id)
      .eq("record_id", record_id)
      .eq("record_type", record_type)
      .single()

    if (existingEntry) {
      // Update existing entry
      const updateData: any = {}
      if (position !== undefined) updateData.position = position

      const { data: entry, error: updateError } = await supabase
        .from("crm_list_entries")
        .update(updateData)
        .eq("id", existingEntry.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update attribute values if provided
      if (attribute_values && typeof attribute_values === "object") {
        for (const [attributeId, value] of Object.entries(attribute_values)) {
          // Set active_until on current value
          await supabase
            .from("crm_list_entry_attribute_values")
            .update({ active_until: new Date().toISOString() })
            .eq("entry_id", existingEntry.id)
            .eq("attribute_id", attributeId)
            .is("active_until", null)

          // Insert new value
          const { data: attribute } = await supabase
            .from("crm_list_attributes")
            .select("field_type")
            .eq("id", attributeId)
            .single()

          if (attribute) {
            const valueText = typeof value === "object" ? null : String(value)
            const valueJson = typeof value === "object" ? value : null

            await supabase
              .from("crm_list_entry_attribute_values")
              .insert({
                entry_id: existingEntry.id,
                attribute_id: attributeId,
                value: valueText,
                value_json: valueJson,
              })
          }
        }
      }

      return NextResponse.json({
        entry,
        created: false,
      })
    } else {
      // Create new entry
      let finalPosition = position
      if (finalPosition === undefined) {
        const { data: maxEntry } = await supabase
          .from("crm_list_entries")
          .select("position")
          .eq("list_id", params.id)
          .order("position", { ascending: false })
          .limit(1)
          .single()

        finalPosition = maxEntry ? maxEntry.position + 1 : 0
      }

      const { data: entry, error: createError } = await supabase
        .from("crm_list_entries")
        .insert({
          list_id: params.id,
          record_id,
          record_type,
          position: finalPosition,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // Set attribute values if provided
      if (attribute_values && typeof attribute_values === "object") {
        for (const [attributeId, value] of Object.entries(attribute_values)) {
          const { data: attribute } = await supabase
            .from("crm_list_attributes")
            .select("field_type")
            .eq("id", attributeId)
            .single()

          if (attribute) {
            const valueText = typeof value === "object" ? null : String(value)
            const valueJson = typeof value === "object" ? value : null

            await supabase
              .from("crm_list_entry_attribute_values")
              .insert({
                entry_id: entry.id,
                attribute_id: attributeId,
                value: valueText,
                value_json: valueJson,
              })
          }
        }
      }

      return NextResponse.json({
        entry,
        created: true,
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error("[CRM] Error asserting list entry:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

