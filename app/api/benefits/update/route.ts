import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, benefit_type_id, title, description, content_url, access_code, is_active, starts_at, expires_at } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Benefit ID is required" }, { status: 400 })
    }

    // Update fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (benefit_type_id !== undefined) updates.benefit_type_id = benefit_type_id
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (content_url !== undefined) updates.content_url = content_url
    if (access_code !== undefined) updates.access_code = access_code
    if (is_active !== undefined) updates.is_active = is_active
    if (starts_at !== undefined) updates.starts_at = starts_at
    if (expires_at !== undefined) updates.expires_at = expires_at

    // Update the benefit
    const { data, error } = await supabase.from("product_benefits").update(updates).eq("id", id).select()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, benefit: data[0] })
  } catch (error: any) {
    console.error("Error updating benefit:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
