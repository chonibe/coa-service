import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Record Widgets API - Manage custom widgets on record pages
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type")

    let query = supabase
      .from("crm_record_widgets")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      widgets: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching record widgets:", error)
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
      title,
      entity_type,
      widget_type,
      config,
      display_order,
    } = body

    if (!name || !title || !entity_type || !widget_type) {
      return NextResponse.json(
        { error: "name, title, entity_type, and widget_type are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_record_widgets")
      .insert({
        name,
        title,
        entity_type,
        widget_type,
        config: config || {},
        display_order: display_order || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      widget: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating record widget:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

