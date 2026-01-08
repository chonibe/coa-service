import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const { searchParams } = request.nextUrl
  const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10", 10), 50)

  const serviceClient = createServiceClient()

  try {
    const { data, error } = await serviceClient
      .from("platform_updates")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Failed to fetch platform updates", error)
      return NextResponse.json(
        { error: "Failed to fetch platform updates", message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ updates: data })
  } catch (error) {
    console.error("Error in /api/admin/platform-updates GET:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const body = await request.json()
    const { title, description, category, version } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Missing required fields", message: "title, description, and category are required" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from("platform_updates")
      .insert([
        {
          title,
          description,
          category,
          version,
          admin_email: auth.email,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Failed to create platform update", error)
      return NextResponse.json(
        { error: "Failed to create platform update", message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ update: data })
  } catch (error) {
    console.error("Error in /api/admin/platform-updates POST:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

