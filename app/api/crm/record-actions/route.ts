import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Record Actions API - Manage custom actions on record pages
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
      .from("crm_record_actions")
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
      actions: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching record actions:", error)
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
      label,
      icon,
      entity_type,
      action_type,
      config,
      display_order,
    } = body

    if (!name || !label || !entity_type || !action_type) {
      return NextResponse.json(
        { error: "name, label, entity_type, and action_type are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_record_actions")
      .insert({
        name,
        label,
        icon,
        entity_type,
        action_type,
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
      action: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating record action:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

