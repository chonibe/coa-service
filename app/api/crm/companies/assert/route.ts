import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Assert Company Endpoint
 * Creates or updates a company record based on unique attribute matching (domain)
 * Similar to Attio's assert pattern
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const {
      domain,
      name,
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

    // Match by domain (primary unique attribute for companies)
    let existingCompany: any = null

    if (domain) {
      const { data } = await supabase
        .from("crm_companies")
        .select("*")
        .eq("domain", domain)
        .single()
      if (data) existingCompany = data
    }

    // Prepare update data (merge with existing, prefer new non-null values)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name || null
    if (domain !== undefined) updateData.domain = domain || null
    if (website !== undefined) updateData.website = website || null
    if (industry !== undefined) updateData.industry = industry || null
    if (company_size !== undefined) updateData.company_size = company_size || null
    if (description !== undefined) updateData.description = description || null
    if (phone !== undefined) updateData.phone = phone || null
    if (email !== undefined) updateData.email = email || null
    if (address !== undefined) updateData.address = address || null
    if (metadata !== undefined) updateData.metadata = metadata || null

    // Handle tags (merge arrays for multi-select behavior)
    if (tags !== undefined && Array.isArray(tags)) {
      if (existingCompany && existingCompany.tags) {
        // Merge tags, removing duplicates
        const mergedTags = [...new Set([...existingCompany.tags, ...tags])]
        updateData.tags = mergedTags
      } else {
        updateData.tags = tags
      }
    }

    if (existingCompany) {
      // Update existing company
      const { data, error } = await supabase
        .from("crm_companies")
        .update(updateData)
        .eq("id", existingCompany.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        company: data,
        created: false,
        matched_by: "domain",
      })
    } else {
      // Create new company
      if (!name && !domain) {
        return NextResponse.json(
          { error: "name or domain is required" },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from("crm_companies")
        .insert({
          name: name || domain?.split(".")[0] || "Unknown Company",
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
        created: true,
        matched_by: null,
      }, { status: 201 })
    }
  } catch (error: any) {
    console.error("[CRM] Error asserting company:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

