import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Lists API - Manage lists/collections
 * Lists are used to group records together with list-specific attributes
 */

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const objectType = searchParams.get("object_type") // 'person' or 'company'

    let query = supabase
      .from("crm_lists")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (objectType) {
      query = query.eq("object_type", objectType)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      lists: data || [],
      total: count || 0,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching lists:", error)
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
      description,
      object_type,
      color,
      icon,
    } = body

    if (!name || !object_type) {
      return NextResponse.json(
        { error: "name and object_type are required" },
        { status: 400 }
      )
    }

    if (!["person", "company"].includes(object_type)) {
      return NextResponse.json(
        { error: "object_type must be 'person' or 'company'" },
        { status: 400 }
      )
    }

    // Get current user ID (TODO: implement from session)
    const created_by_user_id = null

    const { data, error } = await supabase
      .from("crm_lists")
      .insert({
        name,
        description,
        object_type,
        color,
        icon,
        created_by_user_id,
        is_system: false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      list: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating list:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

