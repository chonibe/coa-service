import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Fuzzy Search API - Eventually consistent search with fuzzy matching
 * Matches names, domains, emails, phone numbers, social handles
 * 
 * This endpoint uses PostgreSQL's trigram similarity for fuzzy matching
 * and is designed to be eventually consistent (may not reflect latest changes immediately)
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
    const query = searchParams.get("q")
    const objectTypes = searchParams.get("objects")?.split(",") || ["people", "companies"]
    const limit = parseInt(searchParams.get("limit") || "20")
    const threshold = parseFloat(searchParams.get("threshold") || "0.3") // Similarity threshold (0-1)

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
      })
    }

    const results: any[] = []
    const searchTerm = query.trim()

    // Enable pg_trgm extension if not already enabled
    // Note: This should be done in a migration, but we check here for safety
    await supabase.rpc("enable_pg_trgm_if_needed").catch(() => {
      // Extension might already be enabled or not available
    })

    // Search People
    if (objectTypes.includes("people") || objectTypes.includes("person")) {
      // Use trigram similarity for fuzzy matching
      const { data: people, error: peopleError } = await supabase
        .rpc("fuzzy_search_people", {
          search_term: searchTerm,
          similarity_threshold: threshold,
          result_limit: limit,
        })

      if (!peopleError && people) {
        results.push(...people.map((p: any) => ({
          object: "person",
          id: p.id,
          title: p.display_name || p.email || "Unknown",
          subtitle: p.email || p.phone || p.instagram_username || "",
          url: `/admin/crm/people/${p.id}`,
          match_score: p.similarity || 1.0,
          matched_fields: p.matched_fields || [],
        })))
      } else {
        // Fallback to basic ILIKE search if RPC function doesn't exist
        const { data: fallbackPeople } = await supabase
          .from("crm_customers")
          .select("id, first_name, last_name, email, phone, instagram_username, facebook_id, whatsapp_id")
          .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,instagram_username.ilike.%${searchTerm}%`)
          .eq("is_archived", false)
          .limit(limit)

        if (fallbackPeople) {
          results.push(...fallbackPeople.map((p: any) => ({
            object: "person",
            id: p.id,
            title: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Unknown",
            subtitle: p.email || p.phone || p.instagram_username || "",
            url: `/admin/crm/people/${p.id}`,
            match_score: 1.0,
            matched_fields: [],
          })))
        }
      }
    }

    // Search Companies
    if (objectTypes.includes("companies") || objectTypes.includes("company")) {
      const { data: companies, error: companiesError } = await supabase
        .rpc("fuzzy_search_companies", {
          search_term: searchTerm,
          similarity_threshold: threshold,
          result_limit: limit,
        })

      if (!companiesError && companies) {
        results.push(...companies.map((c: any) => ({
          object: "company",
          id: c.id,
          title: c.name || c.domain || "Unknown",
          subtitle: c.domain || c.website || c.industry || "",
          url: `/admin/crm/companies/${c.id}`,
          match_score: c.similarity || 1.0,
          matched_fields: c.matched_fields || [],
        })))
      } else {
        // Fallback to basic ILIKE search
        const { data: fallbackCompanies } = await supabase
          .from("crm_companies")
          .select("id, name, domain, website, industry")
          .or(`name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%,website.ilike.%${searchTerm}%`)
          .eq("is_archived", false)
          .limit(limit)

        if (fallbackCompanies) {
          results.push(...fallbackCompanies.map((c: any) => ({
            object: "company",
            id: c.id,
            title: c.name || c.domain || "Unknown",
            subtitle: c.domain || c.website || c.industry || "",
            url: `/admin/crm/companies/${c.id}`,
            match_score: 1.0,
            matched_fields: [],
          })))
        }
      }
    }

    // Sort by match score (highest first)
    results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query: searchTerm,
      objects_searched: objectTypes,
    })
  } catch (error: any) {
    console.error("[CRM Fuzzy Search] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


