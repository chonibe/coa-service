import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFilter, validateFilter } from "@/lib/crm/filter-parser"

/**
 * People API - Unified API for managing people/contacts in CRM
 * Replaces and extends the customers API with Attio-style functionality
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

    // Sort parameter (JSON array: [{"field": "name", "direction": "asc"}])
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
    const companyId = searchParams.get("company_id")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const hasOrders = searchParams.get("has_orders") === "true"
    const minTotalSpent = searchParams.get("min_total_spent")
    const platform = searchParams.get("platform")

    let query = supabase
      .from("crm_customers")
      .select(`
        *,
        crm_companies (
          id,
          name,
          domain
        ),
        crm_contact_identifiers (
          identifier_type,
          identifier_value,
          platform
        )
      `, { count: "exact" })

    // Apply Attio-style filter if provided
    if (filter) {
      query = parseFilter(filter, query)
    } else {
      // Legacy filter support (backward compatibility)
      // Apply search
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,instagram_username.ilike.%${search}%`)
      }

      // Apply legacy filters
      if (companyId) {
        query = query.eq("company_id", companyId)
      }

      if (tags && tags.length > 0) {
        query = query.overlaps("tags", tags)
      }

      if (hasOrders) {
        query = query.gt("total_orders", 0)
      }

      if (minTotalSpent) {
        query = query.gte("total_spent", parseFloat(minTotalSpent))
      }

      // Filter by platform (check if they have conversations on that platform)
      if (platform) {
        const { data: platformCustomers } = await supabase
          .from("crm_conversations")
          .select("customer_id")
          .eq("platform", platform)
          .limit(10000)

        if (platformCustomers && platformCustomers.length > 0) {
          const customerIds = platformCustomers.map(c => c.customer_id)
          query = query.in("id", customerIds)
        } else {
          return NextResponse.json({
            people: [],
            total: 0,
            limit,
            offset,
          })
        }
      }
    }

    // Apply sorting
    if (sortConfig && sortConfig.length > 0) {
      const firstSort = sortConfig[0]
      query = query.order(firstSort.field, { 
        ascending: firstSort.direction === "asc" 
      })
      // Note: Supabase only supports single-column sorting in basic queries
      // Multi-column sorting would require RPC functions
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
      people: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching people:", error)
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
      email,
      first_name,
      last_name,
      phone,
      company_id,
      tags,
      notes,
      metadata,
    } = body

    // Insert person
    const { data, error } = await supabase
      .from("crm_customers")
      .insert({
        email,
        first_name,
        last_name,
        phone,
        company_id,
        tags: tags || [],
        notes,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create contact identifiers if email/phone provided
    if (email || phone) {
      const identifiers = []
      if (email) {
        identifiers.push({
          customer_id: data.id,
          identifier_type: "email",
          identifier_value: email,
          is_primary: true,
        })
      }
      if (phone) {
        identifiers.push({
          customer_id: data.id,
          identifier_type: "phone",
          identifier_value: phone,
          is_primary: true,
        })
      }

      if (identifiers.length > 0) {
        await supabase.from("crm_contact_identifiers").insert(identifiers)
      }
    }

    return NextResponse.json({
      person: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating person:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

