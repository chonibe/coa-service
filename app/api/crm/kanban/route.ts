import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFilterAsync, hasPathFilters, parseFilter } from "@/lib/crm/filter-parser"

/**
 * Kanban Board API
 * Returns records grouped by status attribute values for kanban board view
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type") || "person" // 'person' or 'company'
    const statusFieldId = searchParams.get("status_field_id") // UUID of the status custom field
    const filters = searchParams.get("filters") // Optional Attio-style filter JSON

    if (!statusFieldId) {
      return NextResponse.json(
        { error: "status_field_id is required" },
        { status: 400 }
      )
    }

    // Get the status field configuration
    const { data: statusField, error: fieldError } = await supabase
      .from("crm_custom_fields")
      .select("*")
      .eq("id", statusFieldId)
      .eq("attribute_type", "status")
      .single()

    if (fieldError || !statusField) {
      return NextResponse.json(
        { error: "Status field not found or is not a status type" },
        { status: 404 }
      )
    }

    // Get status workflow configuration to determine column order
    const statusWorkflow = (statusField.status_workflow as any) || {}
    const statusOptions = statusField.config?.options || []
    const transitions = statusWorkflow.transitions || []

    // Build a map of status values to their order
    const statusOrder = new Map<string, number>()
    statusOptions.forEach((option: any, index: number) => {
      statusOrder.set(option.value || option, index)
    })

    // Get all records with their current status value
    const tableName = entityType === "person" ? "crm_customers" : "crm_companies"

    // First, get all records
    let query = supabase
      .from(tableName)
      .select("*")
      .eq("is_archived", false)

    // Apply filters if provided
    if (filters) {
      try {
        const filterObj = JSON.parse(filters)
        if (hasPathFilters(filterObj)) {
          query = await parseFilterAsync(filterObj, query, supabase)
        } else {
          query = parseFilter(filterObj, query)
        }
      } catch (e) {
        console.error("[Kanban] Error parsing filters:", e)
      }
    }

    const { data: records, error: recordsError } = await query

    if (recordsError) {
      throw recordsError
    }

    if (!records || records.length === 0) {
      // Return empty columns
      const emptyColumns = statusOptions.map((option: any) => ({
        status: option.value || option,
        label: option.label || option.value || option,
        records: [],
        count: 0,
      }))

      return NextResponse.json({
        columns: emptyColumns,
        status_field: {
          id: statusField.id,
          name: statusField.field_name,
          workflow: statusWorkflow,
        },
      })
    }

    // Get status values for all records
    const recordIds = records.map((r: any) => r.id)
    const { data: statusValues, error: statusValuesError } = await supabase
      .from("crm_custom_field_values")
      .select("entity_id, value")
      .eq("field_id", statusFieldId)
      .eq("entity_type", entityType === "person" ? "person" : "company")
      .in("entity_id", recordIds)
      .is("active_until", null)

    if (statusValuesError) {
      console.error("[Kanban] Error fetching status values:", statusValuesError)
    }

    // Create a map of record ID to status value
    const recordStatusMap = new Map<string, any>()
    statusValues?.forEach((sv: any) => {
      // Handle JSONB value - extract string if it's wrapped
      let statusValue = sv.value
      if (typeof statusValue === "object" && statusValue !== null) {
        statusValue = statusValue.value || statusValue
      }
      recordStatusMap.set(sv.entity_id, statusValue)
    })

    // Group records by status value
    const kanbanColumns: Record<string, any[]> = {}

    // Initialize all status columns (even if empty)
    statusOptions.forEach((option: any) => {
      const statusValue = option.value || option
      kanbanColumns[statusValue] = []
    })

    // Group records by their status value
    records.forEach((record: any) => {
      const statusValue = recordStatusMap.get(record.id)
      if (statusValue && kanbanColumns.hasOwnProperty(statusValue)) {
        kanbanColumns[statusValue].push(record)
      }
    })

    // Sort columns by status order
    const sortedColumns = Object.entries(kanbanColumns)
      .sort(([a], [b]) => {
        const orderA = statusOrder.get(a) ?? 999
        const orderB = statusOrder.get(b) ?? 999
        return orderA - orderB
      })
      .map(([status, records]) => ({
        status,
        label: statusOptions.find((opt: any) => (opt.value || opt) === status)?.label || status,
        records,
        count: records.length,
      }))

    return NextResponse.json({
      columns: sortedColumns,
      status_field: {
        id: statusField.id,
        name: statusField.field_name,
        workflow: statusWorkflow,
      },
    })
  } catch (error: any) {
    console.error("[Kanban] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


