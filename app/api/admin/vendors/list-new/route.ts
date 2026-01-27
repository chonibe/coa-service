/**
 * API: List all vendors (RBAC v2 - Example Migration)
 * 
 * This is an example of migrating from the old guardAdminRequest to the new withAdmin middleware.
 * 
 * Old way (lib/auth-guards.ts):
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = guardAdminRequest(request)
 *   if (auth.kind !== "ok") return auth.response
 *   // ... handler logic
 * }
 * ```
 * 
 * New way (lib/rbac/middleware.ts):
 * ```typescript
 * export const GET = withAdmin(async (request, { user }) => {
 *   // ... handler logic with guaranteed user context
 * })
 * ```
 */

import { NextRequest, NextResponse } from "next/server"
import { withAdmin } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status") // Filter by status
    const offset = (page - 1) * limit

    const supabase = createServiceClient()

    // Build query
    let query = supabase
      .from("vendors")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status && ["active", "pending", "review", "disabled", "suspended"].includes(status)) {
      query = query.eq("status", status)
    }

    const { data: vendors, error, count } = await query

    if (error) {
      console.error("[admin/vendors/list-new] Error fetching vendors:", error)
      return NextResponse.json(
        { error: "Failed to fetch vendors" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      // Include admin context for debugging
      _debug: {
        requestedBy: user.email,
        hasAdminRole: user.roles.includes("admin"),
      },
    })
  } catch (error: any) {
    console.error("[admin/vendors/list-new] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})
