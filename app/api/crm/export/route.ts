import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Errors } from "@/lib/crm/errors"
import { parseFilterAsync } from "@/lib/crm/filter-parser"

/**
 * CRM Export API
 * Export people, companies, conversations, or activities with filter support
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized(), { status: 401 })
    }

    const body = await request.json()
    const { entityType, format = "csv", filters, columns, limit = 10000 } = body

    if (!entityType || !["people", "companies", "conversations", "activities"].includes(entityType)) {
      return NextResponse.json(
        Errors.validation("Invalid entityType. Must be one of: people, companies, conversations, activities"),
        { status: 400 }
      )
    }

    if (!format || !["csv", "excel", "json"].includes(format)) {
      return NextResponse.json(
        Errors.validation("Invalid format. Must be one of: csv, excel, json"),
        { status: 400 }
      )
    }

    // Fetch data based on entity type
    let data: any[] = []
    let headers: string[] = []

    switch (entityType) {
      case "people":
        data = await exportPeople(supabase, filters, limit)
        headers = columns || [
          "id",
          "email",
          "first_name",
          "last_name",
          "phone",
          "instagram_username",
          "total_orders",
          "total_spent",
          "created_at",
        ]
        break

      case "companies":
        data = await exportCompanies(supabase, filters, limit)
        headers = columns || ["id", "name", "domain", "industry", "website", "created_at"]
        break

      case "conversations":
        data = await exportConversations(supabase, filters, limit)
        headers = columns || [
          "id",
          "customer_id",
          "platform",
          "status",
          "is_starred",
          "unread_count",
          "last_message_at",
          "created_at",
        ]
        break

      case "activities":
        data = await exportActivities(supabase, filters, limit)
        headers = columns || [
          "id",
          "entity_type",
          "entity_id",
          "activity_type",
          "description",
          "created_at",
        ]
        break
    }

    // Generate export based on format
    if (format === "csv") {
      const csv = generateCSV(data, headers)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${entityType}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else if (format === "excel") {
      // For Excel, we'll use CSV format with .xlsx extension
      // In production, use a library like exceljs for proper XLSX generation
      const csv = generateCSV(data, headers)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${entityType}-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    } else if (format === "json") {
      return NextResponse.json(
        {
          entityType,
          exportedAt: new Date().toISOString(),
          count: data.length,
          data,
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="${entityType}-export-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      )
    }

    return NextResponse.json(Errors.validation("Invalid format"), { status: 400 })
  } catch (error: any) {
    console.error("[CRM Export] Error:", error)
    return NextResponse.json(Errors.internal(error.message || "Export failed"), { status: 500 })
  }
}

// Export functions
async function exportPeople(supabase: any, filters: any, limit: number) {
  let query = supabase.from("crm_customers").select("*").limit(limit)

  // Apply filters if provided
  if (filters) {
    try {
      const filterConditions = await parseFilterAsync(filters)
      if (filterConditions) {
        query = filterConditions.reduce((q: any, condition: any) => {
          return q[condition.operator](condition.column, condition.value)
        }, query)
      }
    } catch (error: any) {
      throw new Error(`Filter parsing error: ${error.message}`)
    }
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

async function exportCompanies(supabase: any, filters: any, limit: number) {
  let query = supabase.from("crm_companies").select("*").limit(limit)

  // Apply filters if provided
  if (filters) {
    try {
      const filterConditions = await parseFilterAsync(filters)
      if (filterConditions) {
        query = filterConditions.reduce((q: any, condition: any) => {
          return q[condition.operator](condition.column, condition.value)
        }, query)
      }
    } catch (error: any) {
      throw new Error(`Filter parsing error: ${error.message}`)
    }
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

async function exportConversations(supabase: any, filters: any, limit: number) {
  let query = supabase
    .from("crm_conversations")
    .select(`
      *,
      crm_customers (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .limit(limit)

  // Apply basic filters
  if (filters) {
    if (filters.platform) {
      query = query.eq("platform", filters.platform)
    }
    if (filters.status) {
      query = query.eq("status", filters.status)
    }
    if (filters.isStarred !== undefined) {
      query = query.eq("is_starred", filters.isStarred)
    }
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

async function exportActivities(supabase: any, filters: any, limit: number) {
  let query = supabase.from("crm_activities").select("*").limit(limit)

  // Apply filters if provided
  if (filters) {
    if (filters.entityType) {
      query = query.eq("entity_type", filters.entityType)
    }
    if (filters.entityId) {
      query = query.eq("entity_id", filters.entityId)
    }
    if (filters.activityType) {
      query = query.eq("activity_type", filters.activityType)
    }
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

// CSV generation
function generateCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(",") + "\n"
  }

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return ""
    }
    const stringValue = String(value)
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Generate header row
  const headerRow = headers.map(escapeCSV).join(",")

  // Generate data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        // Handle nested properties (e.g., "customer.email")
        const value = header.split(".").reduce((obj: any, key: string) => obj?.[key], row)
        return escapeCSV(value)
      })
      .join(",")
  })

  return [headerRow, ...dataRows].join("\n")
}

