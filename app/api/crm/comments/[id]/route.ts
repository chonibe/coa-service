import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("crm_comments")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) throw error
  return NextResponse.json({ comment: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { error } = await supabase
    .from("crm_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)

  if (error) throw error
  return NextResponse.json({ success: true })
}

