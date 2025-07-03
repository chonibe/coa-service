import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "/dev/null"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const syncId = searchParams.get("syncId")
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  try {
    let query = supabase.from("sync_results").select("*").order("created_at", { ascending: false }).limit(limit)

    // If a specific sync ID is provided, get that one
    if (syncId) {
      query = query.eq("id", syncId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching sync status:", error)
      throw new Error("Failed to fetch sync status")
    }

    return NextResponse.json({
      success: true,
      syncResults: data || [],
    })
  } catch (error: any) {
    console.error("Error fetching sync status:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch sync status" },
      { status: 500 },
    )
  }
}
