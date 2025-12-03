import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFilter, validateFilter } from "@/lib/crm/filter-parser"

/**
 * List Entries API - Manage entries in a list
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    // Attio-style filter
    const filterParam = searchParams.get("filter")
    let filter: any = null
    if (filterParam) {
      try {
        filter = typeof filterParam === "string" ? JSON.parse(filterParam) : filterParam
        const validation = validateFilter(filter)
        if (!validation.valid) {
          return NextResponse.json(
            { error: `Invalid filter: ${validation.error}` },
            { status: 400 }
          )
        }
      } catch (err) {
        return NextResponse.json(
          { error: "Invalid filter JSON format" },
          { status: 400 }
        )
      }
    }

    // Sort parameter
    const sortParam = searchParams.get("sort")
    let sortConfig: Array<{ field: string; direction: "asc" | "desc" }> = []
    if (sortParam) {
      try {
        sortConfig = typeof sortParam === "string" ? JSON.parse(sortParam) : sortParam
      } catch (err) {
        return NextResponse.json(
          { error: "Invalid sort JSON format" },
          { status: 400 }
        )
      }
    }

    // Get list to determine object type
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

    // Build query for entries
    let query = supabase
      .from("crm_list_entries")
      .select(`
        *,
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
      `, { count: "exact" })
      .eq("list_id", params.id)

    // Apply filter if provided
    if (filter) {
      query = parseFilter(filter, query)
    }

    // Apply sorting
    if (sortConfig && sortConfig.length > 0) {
      const firstSort = sortConfig[0]
      if (firstSort.field === "position") {
        query = query.order("position", { ascending: firstSort.direction === "asc" })
      } else {
        query = query.order("created_at", { ascending: firstSort.direction === "asc" })
      }
    } else {
      query = query.order("position", { ascending: true })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: entries, error: entriesError } = await query

    if (entriesError) {
      throw entriesError
    }

    // Fetch the actual records (people or companies) for each entry
    const recordIds = entries?.map(e => e.record_id) || []
    let records: any[] = []

    if (recordIds.length > 0) {
      const tableName = list.object_type === "person" ? "crm_customers" : "crm_companies"
      const { data: recordsData } = await supabase
        .from(tableName)
        .select("*")
        .in("id", recordIds)

      records = recordsData || []
    }

    // Combine entries with their records
    const entriesWithRecords = entries?.map(entry => {
      const record = records.find(r => r.id === entry.record_id)
      return {
        ...entry,
        record,
      }
    }) || []

    return NextResponse.json({
      entries: entriesWithRecords,
      total: entries?.length || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching list entries:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

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
      attribute_values, // Optional: { attribute_id: value }
    } = body

    if (!record_id || !record_type) {
      return NextResponse.json(
        { error: "record_id and record_type are required" },
        { status: 400 }
      )
    }

    if (!["person", "company"].includes(record_type)) {
      return NextResponse.json(
        { error: "record_type must be 'person' or 'company'" },
        { status: 400 }
      )
    }

    // Verify list exists and matches record type
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

    // Check if entry already exists
    const { data: existingEntry } = await supabase
      .from("crm_list_entries")
      .select("id")
      .eq("list_id", params.id)
      .eq("record_id", record_id)
      .eq("record_type", record_type)
      .single()

    if (existingEntry) {
      return NextResponse.json(
        { error: "Record already in this list" },
        { status: 409 }
      )
    }

    // Get max position if not provided
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

    // Create entry
    const { data: entry, error: entryError } = await supabase
      .from("crm_list_entries")
      .insert({
        list_id: params.id,
        record_id,
        record_type,
        position: finalPosition,
      })
      .select()
      .single()

    if (entryError) {
      throw entryError
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
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating list entry:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

