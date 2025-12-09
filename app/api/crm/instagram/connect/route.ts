import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Instagram Connection API - Initiate Meta OAuth for Instagram Business Accounts
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = request.nextUrl.origin
  
  // Meta OAuth configuration
  // For Instagram Business API, you need the FACEBOOK App ID (not Instagram App ID)
  // The Facebook App must have Instagram permissions configured
  const META_APP_ID = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID
  const META_APP_SECRET = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET
  const REDIRECT_URI = process.env.META_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI || `${origin}/auth/callback?provider=instagram`
  
  if (!META_APP_ID) {
    return NextResponse.json(
      { 
        error: "App ID not configured",
        details: "Please set META_APP_ID, FACEBOOK_APP_ID, or INSTAGRAM_APP_ID in Vercel environment variables. For Instagram Business API, you need the Facebook App ID (not Instagram App ID).",
        help: "Go to Meta Developer Console → Your App → Settings → Basic to find your Facebook App ID"
      },
      { status: 500 }
    )
  }

  // Validate App ID format (Facebook App IDs are typically 15-16 digits)
  const appIdPattern = /^\d{15,16}$/
  if (!appIdPattern.test(META_APP_ID)) {
    console.error("[Instagram Connect] Invalid App ID format:", META_APP_ID)
    return NextResponse.json(
      { 
        error: "Invalid App ID format",
        details: `The App ID "${META_APP_ID}" does not match the expected format (15-16 digits).`,
        help: "For Instagram Business API, you need the Facebook App ID from Meta Developer Console, not the Instagram Business Account ID."
      },
      { status: 400 }
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
    "pages_read_engagement",
  ].join(",")

  // Meta OAuth URL
  // Note: For Instagram Business API, use Facebook OAuth endpoint with Instagram scopes
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code`

  console.log("[Instagram Connect] OAuth URL generated:", {
    appId: META_APP_ID,
    redirectUri: REDIRECT_URI,
    scopes,
    hasSecret: !!META_APP_SECRET,
    fullAuthUrl: authUrl
  })

  // Extract domain from redirect URI for App Domains configuration
  const redirectUrlObj = new URL(REDIRECT_URI)
  const appDomain = redirectUrlObj.hostname

  return NextResponse.json({
    auth_url: authUrl,
    state,
    redirect_uri: REDIRECT_URI,
    app_domain: appDomain,
    instructions: "Redirect user to auth_url to authorize Instagram Business account",
    setup_required: {
      note: "You need to configure TWO things in Meta Developer Console (updated 2024/2025 layout):",
      step1: {
        title: "Add App Domain",
        instructions: [
          "Go to Meta Developer Console (developers.facebook.com)",
          "Select your app from 'My Apps' dropdown",
          "In left sidebar: Click 'Settings' → 'Basic'",
          "Scroll to 'App Domains' field",
          `Add this domain: ${appDomain}`,
          "Also add the base domain (e.g., if domain is 'dashboard.thestreetlamp.com', also add 'thestreetlamp.com')",
          "Click 'Save Changes' at bottom of page"
        ]
      },
      step2: {
        title: "Add OAuth Redirect URI (NEW LOCATION)",
        instructions: [
          "In left sidebar: Click 'Products'",
          "If 'Facebook Login' is not added: Click 'Add Product' → Find 'Facebook Login' → Click 'Set Up'",
          "Under 'Facebook Login' product, click 'Settings'",
          "In 'Client OAuth Settings' section, find 'Valid OAuth Redirect URIs' field",
          `Add this EXACT URL: ${REDIRECT_URI}`,
          "Important: The URL must match exactly (including query parameters like ?provider=instagram)",
          "Make sure 'Client OAuth Login' and 'Web OAuth Login' are enabled",
          "Click 'Save Changes'"
        ]
      },
      step3: {
        title: "Wait for Propagation",
        instructions: [
          "Wait 2-5 minutes for changes to propagate",
          "Then try connecting again"
        ]
      }
    },
    troubleshooting: {
      common_issues: [
        "Make sure you're using the Facebook App ID (not Instagram App ID)",
        "The redirect URI must match EXACTLY (including ?provider=instagram)",
        "App Domain should be just the domain (e.g., 'dashboard.thestreetlamp.com'), not the full URL",
        "Both 'Client OAuth Login' and 'Web OAuth Login' must be enabled"
      ]
    }
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

