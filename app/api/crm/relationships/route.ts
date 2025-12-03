import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Relationships API - Manage bidirectional relationships between objects
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const objectType = searchParams.get("object_type")

    let query = supabase
      .from("crm_relationships")
      .select(`
        *,
        object_a_field:crm_custom_fields!crm_relationships_object_a_attribute_id_fkey (
          id,
          field_name,
          display_name
        ),
        object_b_field:crm_custom_fields!crm_relationships_object_b_attribute_id_fkey (
          id,
          field_name,
          display_name
        )
      `)
      .order("created_at", { ascending: false })

    if (objectType) {
      query = query.or(`object_a_type.eq.${objectType},object_b_type.eq.${objectType}`)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      relationships: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching relationships:", error)
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
      object_a_type,
      object_a_attribute_id,
      object_b_type,
      object_b_attribute_id,
      relationship_type,
    } = body

    if (!name || !object_a_type || !object_b_type || !relationship_type) {
      return NextResponse.json(
        { error: "name, object_a_type, object_b_type, and relationship_type are required" },
        { status: 400 }
      )
    }

    if (!["one-to-one", "one-to-many", "many-to-one", "many-to-many"].includes(relationship_type)) {
      return NextResponse.json(
        { error: "relationship_type must be one of: one-to-one, one-to-many, many-to-one, many-to-many" },
        { status: 400 }
      )
    }

    // Verify that the attributes exist and are record-reference types
    if (object_a_attribute_id) {
      const { data: fieldA } = await supabase
        .from("crm_custom_fields")
        .select("field_type")
        .eq("id", object_a_attribute_id)
        .single()

      if (!fieldA || fieldA.field_type !== "record_reference") {
        return NextResponse.json(
          { error: "object_a_attribute must be a record_reference field type" },
          { status: 400 }
        )
      }
    }

    if (object_b_attribute_id) {
      const { data: fieldB } = await supabase
        .from("crm_custom_fields")
        .select("field_type")
        .eq("id", object_b_attribute_id)
        .single()

      if (!fieldB || fieldB.field_type !== "record_reference") {
        return NextResponse.json(
          { error: "object_b_attribute must be a record_reference field type" },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from("crm_relationships")
      .insert({
        name,
        object_a_type,
        object_a_attribute_id,
        object_b_type,
        object_b_attribute_id,
        relationship_type,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update the custom fields to reference this relationship
    if (object_a_attribute_id) {
      await supabase
        .from("crm_custom_fields")
        .update({ relationship_id: data.id })
        .eq("id", object_a_attribute_id)
    }

    if (object_b_attribute_id) {
      await supabase
        .from("crm_custom_fields")
        .update({ relationship_id: data.id })
        .eq("id", object_b_attribute_id)
    }

    return NextResponse.json({
      relationship: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating relationship:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

