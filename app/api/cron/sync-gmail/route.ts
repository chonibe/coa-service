import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { syncGmailForUser } from "@/lib/crm/sync-gmail-helper"
import { CRON_SECRET } from "@/lib/env"

/**
 * Cron job to automatically sync Gmail emails for all admin users
 * Runs every hour to keep emails up to date
 *
 * Admin list: ADMIN_EMAILS env (comma-separated), or fallback to user_roles (role=admin).
 * This ensures no admin (e.g. choni@thestreetlamp.com) is skipped when env is unset.
 *
 * Schedule in vercel.json: "0 * * * *" (every hour)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error("[Gmail Cron] CRON_SECRET not configured")
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      )
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("[Gmail Cron] Starting scheduled Gmail sync for all admins")

    const serviceSupabase = createServiceClient()

    // Resolve admin list: env first, then user_roles so no admin is excluded
    let adminEmails: string[] =
      process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) || []

    if (adminEmails.length === 0) {
      const { data: adminRoles, error: rolesError } = await serviceSupabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .eq("is_active", true)

      if (!rolesError && adminRoles?.length) {
        const { data: users } = await serviceSupabase.auth.admin.listUsers()
        const byId = new Map(users?.users?.map((u) => [u.id, u.email?.toLowerCase()]) || [])
        adminEmails = adminRoles
          .map((r) => byId.get(r.user_id))
          .filter((e): e is string => !!e && e.includes("@"))
        adminEmails = [...new Set(adminEmails)]
        console.log("[Gmail Cron] Using admins from user_roles:", adminEmails.join(", "))
      }
    }

    if (adminEmails.length === 0) {
      console.log("[Gmail Cron] No admin emails configured (set ADMIN_EMAILS or ensure user_roles has admins)")
      return NextResponse.json({
        success: true,
        message: "No admin emails configured",
        synced: 0,
      })
    }

    const results: { email: string; success: boolean; synced?: number; errors?: number; error?: string }[] = []
    let totalSynced = 0
    let totalErrors = 0

    // Sync for each admin
    for (const email of adminEmails) {
      try {
        const { data: users, error: userError } = await serviceSupabase.auth.admin.listUsers()

        if (userError) {
          console.error(`[Gmail Cron] Error listing users:`, userError)
          continue
        }

        const user = users.users.find((u) => u.email?.toLowerCase() === email)

        if (!user) {
          console.log(`[Gmail Cron] Admin user not found: ${email}`)
          continue
        }

        const providerToken = user.app_metadata?.provider_token as string | undefined
        const providerRefreshToken = user.app_metadata?.provider_refresh_token as string | undefined

        if (!providerToken && !providerRefreshToken) {
          console.log(`[Gmail Cron] No Gmail tokens for ${email}, skipping`)
          continue
        }

        console.log(`[Gmail Cron] Syncing Gmail for ${email}`)

        const result = await syncGmailForUser(
          user.id,
          email,
          providerToken,
          providerRefreshToken
        )

        totalSynced += result.synced
        totalErrors += result.errors

        results.push({
          email,
          success: true,
          synced: result.synced,
          errors: result.errors,
        })

        console.log(`[Gmail Cron] Successfully synced ${result.synced} emails for ${email}`)
      } catch (error: any) {
        console.error(`[Gmail Cron] Error syncing for ${email}:`, error)
        totalErrors++
        results.push({
          email,
          success: false,
          error: error.message,
        })
      }
    }

    console.log(`[Gmail Cron] Completed: ${totalSynced} emails synced, ${totalErrors} errors`)

    return NextResponse.json({
      success: true,
      message: "Gmail sync completed",
      totalSynced,
      totalErrors,
      results,
    })
  } catch (error: any) {
    console.error("[Gmail Cron] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}





