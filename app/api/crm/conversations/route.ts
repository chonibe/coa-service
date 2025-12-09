import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { parseFilter, validateFilter } from "@/lib/crm/filter-parser"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get("platform")
    const status = searchParams.get("status")
    const customerId = searchParams.get("customer_id")
    const search = searchParams.get("search")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const isStarred = searchParams.get("is_starred")
    const unreadOnly = searchParams.get("unread_only") === "true"
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

    // Build query with tags and enrichment data
    let query = supabase
      .from("crm_conversations")
      .select(`
        *,
        crm_customers (
          id,
          email,
          first_name,
          last_name,
          instagram_username,
          enrichment_data,
          total_orders,
          total_spent
        ),
        crm_conversation_tags (
          tag:crm_tags (
            id,
            name,
            color
          )
        )
      `)
      .order("last_message_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add filters
    if (platform) {
      query = query.eq("platform", platform)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (customerId) {
      query = query.eq("customer_id", customerId)
    }
    if (isStarred === "true") {
      query = query.eq("is_starred", true)
    }
    if (unreadOnly) {
      query = query.gt("unread_count", 0)
    }
    if (search) {
      // Search in customer name, email, or last message
      query = query.or(`crm_customers.first_name.ilike.%${search}%,crm_customers.last_name.ilike.%${search}%,crm_customers.email.ilike.%${search}%`)
    }

    // Apply Attio-style filter if provided
    if (filter) {
      // Note: Full filter parsing would need to be implemented
      // For now, we handle basic cases
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Filter by tags if specified
    let conversations = data || []
    if (tags && tags.length > 0) {
      conversations = conversations.filter((conv: any) => {
        const convTags = (conv.crm_conversation_tags || []).map((ct: any) => ct.tag?.id)
        return tags.some(tagId => convTags.includes(tagId))
      })
    }

    // Transform tags structure
    conversations = conversations.map((conv: any) => ({
      ...conv,
      tags: (conv.crm_conversation_tags || []).map((ct: any) => ct.tag).filter(Boolean),
      crm_conversation_tags: undefined, // Remove nested structure
    }))

    // Get total count for pagination
    let countQuery = supabase
      .from("crm_conversations")
      .select("*", { count: "exact", head: true })

    if (platform) {
      countQuery = countQuery.eq("platform", platform)
    }
    if (status) {
      countQuery = countQuery.eq("status", status)
    }
    if (customerId) {
      countQuery = countQuery.eq("customer_id", customerId)
    }
    if (isStarred === "true") {
      countQuery = countQuery.eq("is_starred", true)
    }
    if (unreadOnly) {
      countQuery = countQuery.gt("unread_count", 0)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      conversations,
      total: totalCount || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching conversations:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

