import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Sync Email Account - Trigger sync for a specific email account
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

    // Update last_synced_at
    await supabase
      .from("crm_email_accounts")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", params.id)

    // TODO: Implement actual email sync logic here
    // This would use the account's access_token to fetch emails via Gmail/Outlook API
    // and log them to the CRM using the logEmail function

    return NextResponse.json({
      success: true,
      message: "Email sync initiated",
      synced_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[CRM] Error syncing email account:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

