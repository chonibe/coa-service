import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortField = searchParams.get("sortField") || "created_at"
    const sortDirection = searchParams.get("sortDirection") || "desc"

    // Calculate the range for pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build the query
    let query = supabase.from("nfc_tags").select("*", { count: "exact" })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    // Apply search term if provided
    if (search) {
      query = query.or(`tag_id.ilike.%${search}%,line_item_id.ilike.%${search}%,order_id.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === "asc" })

    // Apply pagination
    query = query.range(from, to)

    // Execute the query
    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching NFC tags:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch NFC tags" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nfcTags: data || [],
      totalCount: count || 0,
    })
  } catch (error: any) {
    console.error("Error in NFC tags list API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
