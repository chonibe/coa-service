import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFilter, validateFilter } from "@/lib/crm/filter-parser"

/**
 * Activities API - Unified activity timeline
 * Supports Attio-style verbose filters
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    
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

    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Legacy parameters (for backward compatibility)
    const customerId = searchParams.get("customer_id")
    const companyId = searchParams.get("company_id")
    const conversationId = searchParams.get("conversation_id")
    const activityType = searchParams.get("activity_type")
    const platform = searchParams.get("platform")
    const isCompleted = searchParams.get("is_completed")

    // If using legacy params, require at least one parent ID
    if (!filter && !customerId && !companyId && !conversationId) {
      return NextResponse.json(
        { error: "filter parameter or customer_id, company_id, or conversation_id is required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("crm_activities")
      .select("*", { count: "exact" })

    // Apply Attio-style filter if provided
    if (filter) {
      query = parseFilter(filter, query)
    } else {
      // Legacy filter support
      if (customerId) {
        query = query.eq("customer_id", customerId)
      }

      if (companyId) {
        query = query.eq("company_id", companyId)
      }

      if (conversationId) {
        query = query.eq("conversation_id", conversationId)
      }

      if (activityType) {
        query = query.eq("activity_type", activityType)
      }

      if (platform) {
        query = query.eq("platform", platform)
      }

      if (isCompleted !== null) {
        query = query.eq("is_completed", isCompleted === "true")
      }
    }

    // Apply sorting
    if (sortConfig && sortConfig.length > 0) {
      const firstSort = sortConfig[0]
      query = query.order(firstSort.field, { 
        ascending: firstSort.direction === "asc" 
      })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      activities: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching activities:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
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
    const {
      activity_type,
      title,
      description,
      customer_id,
      company_id,
      conversation_id,
      order_id,
      platform,
      platform_account_id,
      assigned_to_user_id,
      due_date,
      priority,
      metadata,
      attachments,
    } = body

    if (!activity_type || !title) {
      return NextResponse.json(
        { error: "activity_type and title are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_activities")
      .insert({
        activity_type,
        title,
        description,
        customer_id,
        company_id,
        conversation_id,
        order_id,
        platform,
        platform_account_id,
        assigned_to_user_id,
        due_date,
        priority: priority || "normal",
        metadata: metadata || {},
        attachments: attachments || [],
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      activity: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating activity:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

