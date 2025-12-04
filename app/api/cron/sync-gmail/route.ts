import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { syncGmailForUser } from "@/lib/crm/sync-gmail-helper"
import { isAdminEmail } from "@/lib/vendor-auth"
import { CRON_SECRET } from "@/lib/env"

/**
 * Cron job to automatically sync Gmail emails for all admin users
 * Runs every hour to keep emails up to date
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

    // Get all admin users
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []
    
    if (adminEmails.length === 0) {
      console.log("[Gmail Cron] No admin emails configured")
      return NextResponse.json({
        success: true,
        message: "No admin emails configured",
        synced: 0,
      })
    }

    const results = []
    let totalSynced = 0
    let totalErrors = 0

    // Sync for each admin
    for (const email of adminEmails) {
      try {
        // Get user by email
        const { data: users, error: userError } = await serviceSupabase.auth.admin.listUsers()
        
        if (userError) {
          console.error(`[Gmail Cron] Error listing users:`, userError)
          continue
        }

        const user = users.users.find(u => u.email?.toLowerCase() === email)
        
        if (!user) {
          console.log(`[Gmail Cron] Admin user not found: ${email}`)
          continue
        }

        // Check if user has provider tokens
        const providerToken = user.app_metadata?.provider_token as string | undefined
        const providerRefreshToken = user.app_metadata?.provider_refresh_token as string | undefined

        if (!providerToken && !providerRefreshToken) {
          console.log(`[Gmail Cron] No Gmail tokens for ${email}, skipping`)
          continue
        }

        console.log(`[Gmail Cron] Syncing Gmail for ${email}`)
        
        // Sync emails
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



