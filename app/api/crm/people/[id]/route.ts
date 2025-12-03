import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Individual Person API
 * GET, PUT, DELETE operations for a specific person
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

    const { data: person, error } = await supabase
      .from("crm_customers")
      .select(`
        *,
        crm_companies (
          id,
          name,
          domain,
          website,
          industry
        ),
        crm_contact_identifiers (
          id,
          identifier_type,
          identifier_value,
          platform,
          verified,
          is_primary
        ),
        crm_customer_orders (
          id,
          order_id,
          order_source,
          order_number,
          order_date,
          total_amount,
          status,
          products
        )
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      person,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching person:", error)
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
      email,
      first_name,
      last_name,
      phone,
      company_id,
      tags,
      notes,
      metadata,
      address,
    } = body

    // Update person
    const { data, error } = await supabase
      .from("crm_customers")
      .update({
        email,
        first_name,
        last_name,
        phone,
        company_id,
        tags,
        notes,
        metadata,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update contact identifiers if email/phone changed
    if (email || phone) {
      // Delete old primary identifiers
      await supabase
        .from("crm_contact_identifiers")
        .delete()
        .eq("customer_id", params.id)
        .eq("is_primary", true)
        .in("identifier_type", email && phone ? ["email", "phone"] : email ? ["email"] : ["phone"])

      // Insert new primary identifiers
      const identifiers = []
      if (email) {
        identifiers.push({
          customer_id: params.id,
          identifier_type: "email",
          identifier_value: email,
          is_primary: true,
        })
      }
      if (phone) {
        identifiers.push({
          customer_id: params.id,
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
    })
  } catch (error: any) {
    console.error("[CRM] Error updating person:", error)
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
      .from("crm_customers")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("[CRM] Error deleting person:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

