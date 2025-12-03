import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/crm/permissions"

/**
 * Tags Management API
 * Create, read, update, delete tags for conversations
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

    const { data: tags, error } = await supabase
      .from("crm_tags")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      tags: tags || [],
    })
  } catch (error: any) {
    console.error("[CRM Tags] Error:", error)
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission (tags management)
    try {
      await requirePermission(supabase, user.id, 'lists.manage')
    } catch (permError: any) {
      return NextResponse.json(
        { error: permError.message || "Permission denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, color, workspace_id } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_tags")
      .insert({
        name: name.trim(),
        color: color || "#3B82F6",
        workspace_id: workspace_id || null,
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Tag with this name already exists" },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      tag: data,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM Tags] Error creating tag:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

