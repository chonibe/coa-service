import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Facebook Sync API - Sync Facebook messages and contacts
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
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

    const body = await request.json()
    const { account_id } = body

    if (account_id) {
      // Sync specific account
      const { data: account } = await supabase
        .from("crm_facebook_accounts")
        .select("*")
        .eq("id", account_id)
        .eq("user_id", user.id)
        .single()

      if (!account) {
        return NextResponse.json(
          { error: "Facebook account not found" },
          { status: 404 }
        )
      }

      // TODO: Implement Facebook API sync
      // Use account.access_token to fetch messages from Facebook Messenger API
      // Create/update conversations and messages in CRM

      await supabase
        .from("crm_facebook_accounts")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", account_id)

      return NextResponse.json({
        success: true,
        message: "Facebook sync initiated",
        account_id,
      })
    } else {
      // Sync all active accounts
      const { data: accounts } = await supabase
        .from("crm_facebook_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("sync_enabled", true)

      // TODO: Sync all accounts

      return NextResponse.json({
        success: true,
        message: "Facebook sync initiated for all accounts",
        accounts_synced: accounts?.length || 0,
      })
    }
  } catch (error: any) {
    console.error("[CRM] Error syncing Facebook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

