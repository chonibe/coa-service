import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  const { thread_id, parent_comment_id, content } = body

  if (!thread_id || !content) {
    return NextResponse.json({ error: "thread_id and content required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("crm_comments")
    .insert({ thread_id, parent_comment_id, content })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ comment: data }, { status: 201 })
}

