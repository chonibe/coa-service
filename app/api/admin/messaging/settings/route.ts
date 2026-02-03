import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"

/**
 * GET /api/admin/messaging/settings
 * Get current messaging sender configuration
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminToken)
    
    if (!adminSession) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      )
    }

    const supabase = createClient()
    
    // Get messaging settings from database
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("key", "email_sender_config")
      .maybeSingle()

    if (error && error.code !== "PGRST116") { // Ignore "not found" error
      console.error("[messaging/settings] Error fetching settings:", error)
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      )
    }

    const config = settings?.value ? JSON.parse(settings.value) : null

    return NextResponse.json({
      settings: config ? {
        sender_email: config.sender_email,
        sender_user_id: config.sender_user_id,
        last_updated: settings.updated_at,
      } : null,
    })
  } catch (error: any) {
    console.error("[messaging/settings] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/messaging/settings
 * Save messaging sender configuration
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminToken)
    
    if (!adminSession) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sender_user_id, sender_email } = body

    if (!sender_user_id || !sender_email) {
      return NextResponse.json(
        { error: "sender_user_id and sender_email are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify the user has Gmail permissions
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(sender_user_id)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Selected user not found" },
        { status: 404 }
      )
    }

    const hasGmailPermission = !!(
      user.user?.app_metadata?.provider_token || 
      user.user?.app_metadata?.provider_refresh_token
    )

    if (!hasGmailPermission) {
      return NextResponse.json(
        { error: "Selected user does not have Gmail permissions" },
        { status: 400 }
      )
    }

    // Store settings in system_settings table
    const config = {
      sender_user_id,
      sender_email,
      configured_by: adminSession.email,
      configured_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert({
        key: "email_sender_config",
        value: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key",
      })

    if (upsertError) {
      console.error("[messaging/settings] Error saving settings:", upsertError)
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Messaging settings saved successfully",
      settings: {
        sender_email,
        sender_user_id,
      },
    })
  } catch (error: any) {
    console.error("[messaging/settings] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
