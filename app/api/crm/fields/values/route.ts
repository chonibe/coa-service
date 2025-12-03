import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Custom Field Values API
 * Get and update field values for records
 */

// GET: Fetch field values for a record
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type")
    const entityId = searchParams.get("entity_id")
    const showHistoric = searchParams.get("show_historic") === "true"
    const atTimestamp = searchParams.get("at") // ISO timestamp to query value at specific time

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entity_type and entity_id are required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("crm_custom_field_values")
      .select(`
        *,
        crm_custom_fields (
          id,
          field_name,
          display_name,
          field_type,
          options,
          validation_rules
        )
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)

    if (showHistoric) {
      // Return all historical values, sorted by active_from
      query = query.order("active_from", { ascending: false })
    } else if (atTimestamp) {
      // Query values at specific timestamp
      const atDate = new Date(atTimestamp)
      query = query
        .lte("active_from", atDate.toISOString())
        .or(`active_until.is.null,active_until.gt.${atDate.toISOString()}`)
        .order("active_from", { ascending: false })
    } else {
      // Return only current values (active_until is NULL)
      query = query
        .is("active_until", null)
        .order("active_from", { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      field_values: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching field values:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH: Append to multi-select values (prepend new values)
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { entity_type, entity_id, field_values } = body

    if (!entity_type || !entity_id || !field_values) {
      return NextResponse.json(
        { error: "entity_type, entity_id, and field_values are required" },
        { status: 400 }
      )
    }

    const created_by_actor_id = null
    const now = new Date().toISOString()

    // For each field, append values to existing multi-select
    for (const [fieldId, newValues] of Object.entries(field_values)) {
      // Get field type
      const { data: field } = await supabase
        .from("crm_custom_fields")
        .select("field_type, options")
        .eq("id", fieldId)
        .single()

      if (!field) continue

      // Get current value
      const { data: currentValue } = await supabase
        .from("crm_custom_field_values")
        .select("field_value_json, value")
        .eq("field_id", fieldId)
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .is("active_until", null)
        .single()

      let currentValues: any[] = []
      if (currentValue) {
        if (currentValue.field_value_json && Array.isArray(currentValue.field_value_json)) {
          currentValues = currentValue.field_value_json
        } else if (currentValue.value) {
          try {
            currentValues = JSON.parse(currentValue.value)
          } catch {
            currentValues = [currentValue.value]
          }
        }
      }

      // Merge with new values
      const newValuesArray = Array.isArray(newValues) ? newValues : [newValues]
      const mergedValues = [...new Set([...currentValues, ...newValuesArray])]

      // Set active_until on current value
      if (currentValue) {
        await supabase
          .from("crm_custom_field_values")
          .update({ active_until: now })
          .eq("field_id", fieldId)
          .eq("entity_type", entity_type)
          .eq("entity_id", entity_id)
          .is("active_until", null)
      }

      // Insert new value
      await supabase
        .from("crm_custom_field_values")
        .insert({
          field_id: fieldId,
          entity_type,
          entity_id,
          field_value: null,
          field_value_json: mergedValues,
          active_from: now,
          active_until: null,
          created_by_actor_id,
        })
    }

    // Fetch updated values
    const { data: updatedValues } = await supabase
      .from("crm_custom_field_values")
      .select(`
        *,
        crm_custom_fields (
          id,
          field_name,
          display_name,
          field_type
        )
      `)
      .eq("entity_type", entity_type)
      .eq("entity_id", entity_id)
      .is("active_until", null)

    return NextResponse.json({
      field_values: updatedValues || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error appending field values:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT: Update field values for a record (overwrite multi-select)
export async function PUT(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { entity_type, entity_id, field_values } = body

    if (!entity_type || !entity_id || !field_values) {
      return NextResponse.json(
        { error: "entity_type, entity_id, and field_values are required" },
        { status: 400 }
      )
    }

    // Get current user ID (TODO: implement from session)
    const created_by_actor_id = null

    // For each field value, set active_until on current value and insert new one
    const now = new Date().toISOString()
    const valuesToInsert: any[] = []

    for (const [fieldId, value] of Object.entries(field_values)) {
      // Set active_until on current value (if exists)
      await supabase
        .from("crm_custom_field_values")
        .update({ active_until: now })
        .eq("field_id", fieldId)
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .is("active_until", null)

      // Prepare new value
      const fieldValue = typeof value === "object" ? JSON.stringify(value) : String(value)
      valuesToInsert.push({
        field_id: fieldId,
        entity_type,
        entity_id,
        field_value: typeof value === "object" ? null : fieldValue,
        field_value_json: typeof value === "object" ? value : null,
        active_from: now,
        active_until: null,
        created_by_actor_id,
      })
    }

    const { data, error } = await supabase
      .from("crm_custom_field_values")
      .insert(valuesToInsert)
      .select(`
        *,
        crm_custom_fields (
          id,
          field_name,
          display_name,
          field_type
        )
      `)

    if (error) {
      throw error
    }

    return NextResponse.json({
      field_values: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error updating field values:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

