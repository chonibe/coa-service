import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Individual Company API
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { data: company, error } = await supabase
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
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      company,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching company:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from("crm_companies")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      company: data,
    })
  } catch (error: any) {
    console.error("[CRM] Error updating company:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { error } = await supabase
      .from("crm_companies")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting company:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

