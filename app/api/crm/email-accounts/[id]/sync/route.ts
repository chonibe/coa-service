import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { syncGmailForUser } from "@/lib/crm/sync-gmail-helper"
import { fetchGmailMessages, extractEmailContent } from "@/lib/gmail/client"
import { logEmail } from "@/lib/crm/log-email"

/**
 * Sync Email Account - Trigger sync for a specific email account
 */

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const googleClientId = process.env.SUPABASE_GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.SUPABASE_GOOGLE_CLIENT_SECRET

  if (!googleClientId || !googleClientSecret) {
    throw new Error("Gmail sync is not properly configured. Missing Google OAuth credentials.")
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}))
    throw new Error(`Failed to refresh access token: ${errorData.error || 'Unknown error'}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database client not initialized" },
        { status: 500 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const isAdmin = user.email && process.env.ADMIN_EMAILS?.split(",").includes(user.email)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Get email account
    const { data: account, error: accountError } = await supabase
      .from("crm_email_accounts")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Email account not found" },
        { status: 404 }
      )
    }

    if (!account.is_active) {
      return NextResponse.json(
        { error: "Email account is not active" },
        { status: 400 }
      )
    }

    if (!account.sync_enabled) {
      return NextResponse.json(
        { error: "Email sync is disabled for this account" },
        { status: 400 }
      )
    }

    // Get access token
    let accessToken = account.access_token
    const refreshToken = account.refresh_token

    // Check if token is expired or missing
    const isTokenExpired = account.token_expires_at 
      ? new Date(account.token_expires_at) < new Date()
      : !accessToken

    // Refresh token if needed
    if ((isTokenExpired || !accessToken) && refreshToken) {
      try {
        accessToken = await refreshAccessToken(refreshToken)
        
        // Update token in database
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 1) // Tokens typically expire in 1 hour
        
        await supabase
          .from("crm_email_accounts")
          .update({
            access_token: accessToken,
            token_expires_at: expiresAt.toISOString(),
          })
          .eq("id", params.id)
      } catch (refreshError: any) {
        console.error("[CRM] Error refreshing token:", refreshError)
        return NextResponse.json(
          { 
            error: "Failed to refresh access token. Please re-authenticate your email account.",
            requiresReauth: true
          },
          { status: 403 }
        )
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: "No access token available. Please re-authenticate your email account.",
          requiresReauth: true
        },
        { status: 403 }
      )
    }

    // Sync emails based on provider
    if (account.provider === 'gmail') {
      // Use sync helper for Gmail
      try {
        const result = await syncGmailForUser(
          user.id,
          account.email_address,
          accessToken,
          refreshToken
        )

        // Update last_synced_at
        await supabase
          .from("crm_email_accounts")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", params.id)

        return NextResponse.json({
          success: true,
          message: "Email sync completed",
          synced: result.synced,
          errors: result.errors,
          total: result.total,
          synced_at: new Date().toISOString(),
        })
      } catch (syncError: any) {
        console.error("[CRM] Error during Gmail sync:", syncError)
        return NextResponse.json(
          { 
            error: syncError.message || "Failed to sync emails",
            requiresReauth: syncError.message?.includes("expired") || syncError.message?.includes("re-authenticate")
          },
          { status: 500 }
        )
      }
    } else {
      // For other providers (Outlook, etc.), implement provider-specific logic
      return NextResponse.json(
        { error: `Sync not yet implemented for provider: ${account.provider}` },
        { status: 501 }
      )
    }
  } catch (error: any) {
    console.error("[CRM] Error syncing email account:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

