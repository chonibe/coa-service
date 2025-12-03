import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const searchParams = request.nextUrl.searchParams
  const parentType = searchParams.get("parent_type")
  const parentId = searchParams.get("parent_id")

  if (!parentType || !parentId) {
    return NextResponse.json({ error: "parent_type and parent_id required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("crm_threads")
    .select(`
      *,
      crm_comments (
        id,
        content,
        created_by_user_id,
        created_at,
        updated_at,
        deleted_at
      )
    `)
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return NextResponse.json({ threads: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  const { parent_type, parent_id, title } = body

  if (!parent_type || !parent_id) {
    return NextResponse.json({ error: "parent_type and parent_id required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("crm_threads")
    .insert({ parent_type, parent_id, title })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ thread: data }, { status: 201 })
}

