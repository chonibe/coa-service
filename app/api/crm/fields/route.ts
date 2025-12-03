import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Custom Fields API - Manage field definitions and values
 */

// GET: List all custom fields for an entity type
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type") // 'person', 'company', etc.
    const isActive = searchParams.get("is_active") !== "false"

    let query = supabase
      .from("crm_custom_fields")
      .select("*")
      .order("display_order", { ascending: true })

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }

    if (isActive) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      fields: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching custom fields:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Create a new custom field
export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const {
      field_name,
      display_name,
      field_type,
      entity_type,
      is_required,
      is_unique,
      default_value,
      default_value_jsonb,
      is_default_value_enabled,
      options,
      validation_rules,
      visibility_rules,
      display_order,
    } = body

    if (!field_name || !display_name || !field_type || !entity_type) {
      return NextResponse.json(
        { error: "field_name, display_name, field_type, and entity_type are required" },
        { status: 400 }
      )
    }

    // Process default value - support both old TEXT format and new JSONB format
    let processedDefaultValue: any = null
    if (default_value_jsonb) {
      processedDefaultValue = default_value_jsonb
    } else if (default_value) {
      // Convert old TEXT format to JSONB static default
      processedDefaultValue = {
        type: "static",
        value: default_value,
      }
    }

    const { data, error } = await supabase
      .from("crm_custom_fields")
      .insert({
        field_name,
        display_name,
        field_type,
        entity_type,
        is_required: is_required || false,
        is_unique: is_unique || false,
        default_value_jsonb: processedDefaultValue,
        is_default_value_enabled: is_default_value_enabled || false,
        options: options || null,
        validation_rules: validation_rules || {},
        visibility_rules: visibility_rules || {},
        display_order: display_order || 0,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      field: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating custom field:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

