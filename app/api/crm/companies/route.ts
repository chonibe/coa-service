import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFilter, validateFilter } from "@/lib/crm/filter-parser"
import {
  getCursorForPagination,
  applyCursorToQuery,
  createCursorResponse,
} from "@/lib/crm/cursor-pagination"
import { Errors } from "@/lib/crm/errors"

/**
 * Companies API - Manage company/organization records
 * Supports Attio-style verbose filters
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const includeArchived = searchParams.get("include_archived") === "true"
    const cursor = searchParams.get("cursor")
    
    // Attio-style filter (JSON string or object)
    const filterParam = searchParams.get("filter")
    let filter: any = null
    if (filterParam) {
      try {
        filter = typeof filterParam === "string" ? JSON.parse(filterParam) : filterParam
        const validation = validateFilter(filter)
        if (!validation.valid) {
          return NextResponse.json(
            Errors.invalidFilter(validation.error || "Invalid filter syntax", { field: "filter" }),
            { status: 400 }
          )
        }
      } catch (err) {
        return NextResponse.json(
          Errors.validation("Invalid filter JSON format", { field: "filter", reason: "Malformed JSON" }),
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

    // Legacy filter parameters (for backward compatibility)
    const industry = searchParams.get("industry")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)

    let query = supabase
      .from("crm_companies")
      .select(`
        *,
        crm_customers!crm_customers_company_id_fkey (
          id,
          first_name,
          last_name,
          email,
          total_orders,
          total_spent
        )
      `, { count: "exact" })

    // Apply Attio-style filter if provided
    if (filter) {
      query = parseFilter(filter, query)
    } else {
      // Legacy filter support
      if (search) {
        query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,website.ilike.%${search}%`)
      }

      if (industry) {
        query = query.eq("industry", industry)
      }

      if (tags && tags.length > 0) {
        query = query.overlaps("tags", tags)
      }
    }

    // Filter out archived records by default
    if (!includeArchived) {
      query = query.eq("is_archived", false)
    }

    // Apply sorting
    if (sortConfig && sortConfig.length > 0) {
      const firstSort = sortConfig[0]
      query = query.order(firstSort.field, { 
        ascending: firstSort.direction === "asc" 
      })
    } else {
      query = query.order("updated_at", { ascending: false })
    }

    // Apply pagination - use cursor if provided, otherwise use offset
    const decodedCursor = cursor ? getCursorForPagination(cursor) : null
    if (decodedCursor) {
      query = applyCursorToQuery(query, decodedCursor, sortConfig)
      query = query.limit(limit + 1)
    } else {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(Errors.internal(error.message || "Failed to fetch companies"), { status: 500 })
    }

    // If using cursor pagination, format response accordingly
    if (decodedCursor) {
      const cursorResponse = createCursorResponse(data || [], limit, sortConfig)
      return NextResponse.json({
        companies: cursorResponse.data,
        next_cursor: cursorResponse.next_cursor,
        limit: cursorResponse.limit,
        has_more: cursorResponse.has_more,
      })
    }

    return NextResponse.json({
      companies: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching companies:", error)
    return NextResponse.json(Errors.internal(error.message || "Failed to fetch companies"), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      return NextResponse.json(Errors.internal("Database client not initialized"), { status: 500 })
    }

    const body = await request.json()
    const {
      name,
      domain,
      website,
      industry,
      company_size,
      description,
      phone,
      email,
      address,
      tags,
      metadata,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      )
    }

    // Get current user for default value processing
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    const { data, error } = await supabase
      .from("crm_companies")
      .insert({
        name,
        domain,
        website,
        industry,
        company_size,
        description,
        phone,
        email,
        address,
        tags: tags || [],
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Apply default values for custom fields
    if (data?.id) {
      const { error: defaultError } = await supabase.rpc("apply_field_defaults", {
        p_entity_type: "company",
        p_entity_id: data.id,
        p_user_id: userId,
      })
      if (defaultError) {
        console.error("[CRM] Error applying default values:", defaultError)
        // Don't fail the request if defaults fail
      }
    }

    return NextResponse.json({
      company: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating company:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

