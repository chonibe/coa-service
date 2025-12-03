import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Archive/Restore Company Endpoint
 * Soft delete (archive) or restore a company record
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    const { action } = body // 'archive' or 'restore'

    if (!action || !["archive", "restore"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'archive' or 'restore'" },
        { status: 400 }
      )
    }

    const isArchived = action === "archive"

    // Update the company record
    const { data, error } = await supabase
      .from("crm_companies")
      .update({ is_archived: isArchived })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      company: data,
      archived: isArchived,
    })
  } catch (error: any) {
    console.error("[CRM] Error archiving/restoring company:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

