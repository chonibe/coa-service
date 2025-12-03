import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Global Search API - Search across all CRM entities
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const entityTypes = searchParams.get("types")?.split(",") || ["person", "company", "conversation"]
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        suggestions: [],
      })
    }

    const results: any[] = []
    const searchTerm = `%${query}%`

    // Search People
    if (entityTypes.includes("person")) {
      const { data: people } = await supabase
        .from("crm_customers")
        .select("id, first_name, last_name, email, instagram_username")
        .or(`email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},instagram_username.ilike.${searchTerm}`)
        .limit(limit)

      if (people) {
        results.push(...people.map(p => ({
          type: "person",
          id: p.id,
          title: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Unknown",
          subtitle: p.email || p.instagram_username || "",
          url: `/admin/crm/people/${p.id}`,
        })))
      }
    }

    // Search Companies
    if (entityTypes.includes("company")) {
      const { data: companies } = await supabase
        .from("crm_companies")
        .select("id, name, domain, website")
        .or(`name.ilike.${searchTerm},domain.ilike.${searchTerm},website.ilike.${searchTerm}`)
        .limit(limit)

      if (companies) {
        results.push(...companies.map(c => ({
          type: "company",
          id: c.id,
          title: c.name,
          subtitle: c.domain || c.website || "",
          url: `/admin/crm/companies/${c.id}`,
        })))
      }
    }

    // Search Conversations
    if (entityTypes.includes("conversation")) {
      const { data: conversations } = await supabase
        .from("crm_conversations")
        .select(`
          id,
          platform,
          status,
          crm_customers!inner (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .limit(limit)

      if (conversations) {
        results.push(...conversations.map(conv => ({
          type: "conversation",
          id: conv.id,
          title: `${conv.crm_customers.first_name || ""} ${conv.crm_customers.last_name || ""}`.trim() || conv.crm_customers.email || "Unknown",
          subtitle: `${conv.platform} conversation`,
          url: `/admin/crm/inbox?conversation=${conv.id}`,
        })))
      }
    }

    // Generate suggestions (simple for now)
    const suggestions = results.slice(0, 5).map(r => r.title)

    return NextResponse.json({
      results: results.slice(0, limit),
      suggestions,
      total: results.length,
    })
  } catch (error: any) {
    console.error("[CRM] Error searching:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

