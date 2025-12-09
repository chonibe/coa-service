import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Instagram Connection API - Initiate Meta OAuth for Instagram Business Accounts
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = request.nextUrl.origin
  
  // Meta OAuth configuration
  // Support both META_APP_ID and INSTAGRAM_APP_ID for flexibility
  const META_APP_ID = process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID
  const META_APP_SECRET = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET
  const REDIRECT_URI = process.env.META_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI || `${origin}/auth/callback?provider=instagram`
  
  if (!META_APP_ID) {
    return NextResponse.json(
      { error: "META_APP_ID or INSTAGRAM_APP_ID not configured. Please set one of these environment variables in Vercel." },
      { status: 500 }
    )
  }

  // Generate state for OAuth security
  const state = crypto.randomUUID()
  
  // Required scopes for Instagram Business messaging
  const scopes = [
    "instagram_basic",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_messaging",
  ].join(",")

  // Meta OAuth URL
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code`

  return NextResponse.json({
    auth_url: authUrl,
    state,
    instructions: "Redirect user to auth_url to authorize Instagram Business account",
  })
}

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
    const {
      account_name,
      instagram_account_id,
      instagram_username,
      access_token,
      token_expires_at,
    } = body

    if (!account_name || !instagram_account_id || !access_token) {
      return NextResponse.json(
        { error: "account_name, instagram_account_id, and access_token are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_instagram_accounts")
      .insert({
        user_id: user.id,
        account_name,
        instagram_account_id,
        instagram_username,
        access_token, // In production, encrypt this
        token_expires_at,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Don't return sensitive tokens
    const sanitized = {
      ...data,
      access_token: "***",
    }

    return NextResponse.json({
      account: sanitized,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating Instagram account:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

