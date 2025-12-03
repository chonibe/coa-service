import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFilter, validateFilter } from "@/lib/crm/filter-parser"

/**
 * Companies API - Manage company/organization records
 * Supports Attio-style verbose filters
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    // Attio-style filter (JSON string or object)
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

    // Apply sorting
    if (sortConfig && sortConfig.length > 0) {
      const firstSort = sortConfig[0]
      query = query.order(firstSort.field, { 
        ascending: firstSort.direction === "asc" 
      })
    } else {
      query = query.order("updated_at", { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      companies: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching companies:", error)
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

