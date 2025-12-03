import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { shouldSyncGmail } from "@/lib/crm/sync-helper"
import { isAdminEmail } from "@/lib/vendor-auth"

/**
 * Check if Gmail sync is needed for the current user
 * Returns whether sync should be triggered
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      )
    }

    // ADMIN ONLY
    const email = userEmail.toLowerCase()
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Check if sync is needed (default: 15 minutes threshold)
    const needsSync = await shouldSyncGmail(userId, 15)

    return NextResponse.json({
      needsSync,
      email,
    })
  } catch (error: any) {
    console.error("[Check Sync Status] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

