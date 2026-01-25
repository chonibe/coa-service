import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { buildVendorSessionCookie, clearVendorSessionCookie, VENDOR_SESSION_COOKIE_NAME } from "@/lib/vendor-session"
import {
  linkSupabaseUserToVendor,
  isAdminEmail,
  POST_LOGIN_REDIRECT_COOKIE,
  PENDING_VENDOR_EMAIL_COOKIE,
  REQUIRE_ACCOUNT_SELECTION_COOKIE,
} from "@/lib/vendor-auth"
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/admin-session"
import { buildCollectorSessionCookie } from "@/lib/collector-session"
import { logFailedLoginAttempt } from "@/lib/audit-logger"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { syncInstagramHistory } from "@/lib/crm/instagram-helper"
import { syncGmailForUser } from "@/lib/crm/sync-gmail-helper"

const DEFAULT_VENDOR_REDIRECT = "/vendor/dashboard"
const NOT_REGISTERED_REDIRECT = "/login?error=not_registered"
const ADMIN_DASHBOARD_REDIRECT = "/admin/dashboard"
const PENDING_VENDOR_REDIRECT = "/vendor/access-pending"
const DENIED_VENDOR_REDIRECT = "/vendor/access-denied"

const deleteCookie = (response: NextResponse, name: string) => {
  response.cookies.set(name, "", { path: "/", maxAge: 0 })
}

/**
 * Process user login after authentication - handles vendor/collector/admin routing
 */
async function processUserLogin(user: any, email: string | null, origin: string, cookieStore: ReturnType<typeof cookies>) {
  try {
    const isAdmin = isAdminEmail(email)

    console.log(`[auth/callback] Processing login for email: ${email}, isAdmin: ${isAdmin}`)

    // Handle admin users - check if they also have collector access
    if (isAdmin && email) {
      console.log(`[auth/callback] Admin user detected - checking for collector access`)

      // Check if admin also has collector orders
      const serviceClient = createServiceClient()
      const { data: adminOrderMatch, error: orderError } = await serviceClient
        .from("orders")
        .select("customer_id, shopify_id")
        .eq("customer_email", email)
        .order("processed_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (orderError) {
        console.error(`[auth/callback] Error checking admin collector access:`, orderError)
        // Continue with admin-only flow
      }

      // If admin has collector access, redirect to role selection page
      if (adminOrderMatch) {
        console.log(`[auth/callback] Admin also has collector access - redirecting to role selection`)
        const adminCookie = buildAdminSessionCookie(email)
        const roleSelectionRedirect = NextResponse.redirect(new URL("/auth/select-role", origin), { status: 307 })
        
        roleSelectionRedirect.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
        deleteCookie(roleSelectionRedirect, PENDING_VENDOR_EMAIL_COOKIE)
        deleteCookie(roleSelectionRedirect, REQUIRE_ACCOUNT_SELECTION_COOKIE)
        
        return roleSelectionRedirect
      }

      // Admin without collector access - go straight to admin dashboard
      const adminCookie = buildAdminSessionCookie(email)
      const adminRedirect = NextResponse.redirect(new URL("/admin/dashboard", origin), { status: 307 })

      adminRedirect.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)
      adminRedirect.cookies.set(VENDOR_SESSION_COOKIE_NAME, "", { ...clearVendorSessionCookie().options, maxAge: 0 })
      deleteCookie(adminRedirect, PENDING_VENDOR_EMAIL_COOKIE)
      deleteCookie(adminRedirect, REQUIRE_ACCOUNT_SELECTION_COOKIE)

      console.log(`[auth/callback] Admin login successful for ${email}, redirecting to admin dashboard`)
      return adminRedirect
    }
  } catch (error: any) {
    console.error('[auth/callback] Error in processUserLogin:', error)
    // Return error response instead of throwing
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Login processing failed. Please try again.')}`, origin),
      { status: 307 }
    )
  }

  // For non-admins, try to link vendor
  const vendor = await linkSupabaseUserToVendor(user)

  console.log(`[auth/callback] Vendor linking result: ${vendor ? `${vendor.vendor_name} (status: ${vendor.status})` : "null"}`)

  // If vendor is linked, set vendor session and redirect to vendor dashboard
  if (vendor) {
    console.log(`[auth/callback] Vendor linked: ${vendor.vendor_name}, status: ${vendor.status}, email: ${email}`)
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)

    let destination = DEFAULT_VENDOR_REDIRECT
    if (vendor.status && vendor.status !== "active") {
      if (vendor.status === "pending" || vendor.status === "review") {
        destination = PENDING_VENDOR_REDIRECT
      } else if (vendor.status === "disabled" || vendor.status === "suspended") {
        destination = DENIED_VENDOR_REDIRECT
      }
    }

    const redirectUrl = new URL(destination, origin)
    const redirectResponse = NextResponse.redirect(redirectUrl, { status: 307 })

    redirectResponse.cookies.set(sessionCookie.name, sessionCookie.value, {
      ...sessionCookie.options,
    })

    redirectResponse.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      ...clearAdminSessionCookie().options,
      maxAge: 0,
    })

    deleteCookie(redirectResponse, PENDING_VENDOR_EMAIL_COOKIE)
    deleteCookie(redirectResponse, REQUIRE_ACCOUNT_SELECTION_COOKIE)

    console.log(`[auth/callback] Redirecting vendor to: ${destination}`)
    return redirectResponse
  }

  // Check if the user is a collector (has orders or a profile)
  const serviceClient = createServiceClient()
  const { data: orderMatch } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .limit(1)
    .maybeSingle()

  const { data: profileMatch } = await serviceClient
    .from("collector_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (orderMatch || profileMatch) {
    console.log(`[auth/callback] Collector detected for email: ${email}`)
    const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id

    const collectorCookie = buildCollectorSessionCookie({
      shopifyCustomerId: shopifyCustomerId ? shopifyCustomerId.toString() : null,
      email,
      issuedAt: Date.now(),
    })

    const collectorRedirect = NextResponse.redirect(new URL("/collector/dashboard", origin), { status: 307 })
    collectorRedirect.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)

    if (shopifyCustomerId) {
      collectorRedirect.cookies.set("shopify_customer_id", shopifyCustomerId.toString(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      })
    }

    deleteCookie(collectorRedirect, REQUIRE_ACCOUNT_SELECTION_COOKIE)
    return collectorRedirect
  }

  // No vendor linked and not admin – block unregistered users
  console.log(`[auth/callback] No vendor or collector linked for email: ${email}`)
  const notRegisteredResponse = NextResponse.redirect(new URL(NOT_REGISTERED_REDIRECT, origin), { status: 307 })
  deleteCookie(notRegisteredResponse, VENDOR_SESSION_COOKIE_NAME)

  const supabase = createRouteClient(cookieStore)
  await supabase.auth.signOut()
  notRegisteredResponse.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", { ...clearAdminSessionCookie().options, maxAge: 0 })
  await logFailedLoginAttempt({
    email,
    method: "oauth",
    reason: "No vendor or collector linked for non-admin user",
  })

  return notRegisteredResponse
}

/**
 * Helper function to trigger Gmail sync in the background (fire and forget)
 * This runs asynchronously without blocking the OAuth callback response
 */
function syncGmailInBackground(
  userId: string,
  userEmail: string,
  providerToken?: string,
  providerRefreshToken?: string
) {
  // Run sync in background without blocking - don't await
  syncGmailForUser(userId, userEmail, providerToken, providerRefreshToken)
    .then(() => {
      console.log(`[auth/callback] Background Gmail sync completed for ${userEmail}`)
    })
    .catch((error) => {
      console.error(`[auth/callback] Background Gmail sync error for ${userEmail}:`, error)
    })
}

/**
 * Helper function to store provider tokens in user metadata
 */
async function storeProviderTokens(
  userId: string,
  providerToken: string | undefined,
  providerRefreshToken: string | undefined
) {
  if ((providerToken && providerToken.trim()) || (providerRefreshToken && providerRefreshToken.trim())) {
    console.log("[auth/callback] Storing provider tokens in user metadata")

    try {
      const serviceSupabase = createServiceClient()

      // Get existing metadata to merge
      const { data: existingUser } = await serviceSupabase.auth.admin.getUserById(userId)
      const existingMetadata = existingUser?.user?.app_metadata || {}

      const metadataUpdate: any = { ...existingMetadata }
      if (providerToken && providerToken.trim()) {
        metadataUpdate.provider_token = providerToken
        console.log("[auth/callback] Stored provider_token")
      }
      if (providerRefreshToken && providerRefreshToken.trim()) {
        metadataUpdate.provider_refresh_token = providerRefreshToken
        console.log("[auth/callback] Stored provider_refresh_token")
      }

      const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
        userId,
        { app_metadata: metadataUpdate }
      )

      if (updateError) {
        console.error("[auth/callback] Failed to store provider tokens:", updateError)
      } else {
        console.log("[auth/callback] Successfully stored provider tokens in user metadata")
      }
    } catch (error) {
      console.error("[auth/callback] Error storing provider tokens:", error)
    }
  } else {
    console.warn("[auth/callback] No provider tokens found in session - Gmail sync may not work")
  }
}

/**
 * Handle Instagram OAuth callback from Meta
 * Exchanges authorization code for access token and stores Instagram account
 */
async function handleInstagramCallback(
  request: NextRequest,
  code: string | null,
  state: string | null,
  error: string | null,
  errorReason: string | null,
  origin: string,
  cookieStore: ReturnType<typeof cookies>
) {
  console.log("[Instagram Callback] ===== INSTAGRAM CALLBACK HANDLER STARTED =====")
  console.log("[Instagram Callback] Full request URL:", request.url)
  console.log("[Instagram Callback] Received callback:", { 
    code: !!code, 
    codeLength: code?.length || 0,
    state, 
    error, 
    errorReason,
    origin,
    headers: {
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent")
    }
  })

  // Handle OAuth errors
  if (error) {
    console.error("[Instagram Callback] OAuth error:", error, errorReason)
    return NextResponse.redirect(
      new URL(`/admin/crm/settings/integrations?platform=instagram&error=${encodeURIComponent(error)}&reason=${encodeURIComponent(errorReason || "")}`, origin),
      { status: 307 }
    )
  }

  if (!code) {
    console.error("[Instagram Callback] No authorization code received")
    return NextResponse.redirect(
      new URL("/admin/crm/settings/integrations?platform=instagram&error=no_code", origin),
      { status: 307 }
    )
  }

  try {
    // Get Meta app credentials
    const META_APP_ID = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID
    const META_APP_SECRET = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET
    const REDIRECT_URI = process.env.META_REDIRECT_URI || process.env.INSTAGRAM_REDIRECT_URI || `${origin}/auth/callback?provider=instagram`

    console.log("[Instagram Callback] Configuration:", {
      hasAppId: !!META_APP_ID,
      appIdLength: META_APP_ID?.length || 0,
      hasAppSecret: !!META_APP_SECRET,
      redirectUri: REDIRECT_URI
    })

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error("[Instagram Callback] Missing app credentials", {
        hasAppId: !!META_APP_ID,
        hasAppSecret: !!META_APP_SECRET
      })
      return NextResponse.redirect(
        new URL("/admin/crm/settings/integrations?platform=instagram&error=missing_credentials", origin),
        { status: 307 }
      )
    }

    // Exchange authorization code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&code=${code}`
    
    console.log("[Instagram Callback] Exchanging code for access token...")
    console.log("[Instagram Callback] Token URL (without secret):", tokenUrl.replace(META_APP_SECRET, "***"))
    
    const tokenResponse = await fetch(tokenUrl, { method: "GET" })

    console.log("[Instagram Callback] Token exchange response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: { message: errorText } }
      }
      console.error("[Instagram Callback] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(
        new URL(`/admin/crm/settings/integrations?platform=instagram&error=token_exchange_failed&details=${encodeURIComponent(errorData.error?.message || "Unknown error")}`, origin),
        { status: 307 }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("[Instagram Callback] Token data received:", {
      hasAccessToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    })
    
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in

    if (!accessToken) {
      console.error("[Instagram Callback] No access token in response:", tokenData)
      return NextResponse.redirect(
        new URL("/admin/crm/settings/integrations?platform=instagram&error=no_access_token", origin),
        { status: 307 }
      )
    }

    console.log("[Instagram Callback] Access token obtained, fetching account info...")

    // Get user's Facebook pages (which may have Instagram accounts)
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account{id,username}`
    console.log("[Instagram Callback] Fetching pages from:", pagesUrl.replace(accessToken, "***"))
    
    const pagesResponse = await fetch(pagesUrl)

    console.log("[Instagram Callback] Pages response status:", pagesResponse.status)

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      console.error("[Instagram Callback] Failed to fetch pages:", {
        status: pagesResponse.status,
        error: errorText
      })
      // Try to get basic user info instead
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log("[Instagram Callback] Using basic user info:", userData)
        // Store with basic info
        return await storeInstagramAccount(userData.id, userData.name || "Instagram Account", null, accessToken, expiresIn, origin, cookieStore)
      }
      return NextResponse.redirect(
        new URL("/admin/crm/settings/integrations?platform=instagram&error=fetch_account_failed", origin),
        { status: 307 }
      )
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []
    console.log("[Instagram Callback] Pages fetched:", {
      pageCount: pages.length,
      pages: pages.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasInstagram: !!p.instagram_business_account
      }))
    })

    // Find pages with Instagram Business accounts
    const instagramAccounts: Array<{ pageId: string; pageName: string; instagramId: string; instagramUsername: string | null; pageAccessToken?: string }> = []
    
    for (const page of pages) {
      if (page.instagram_business_account) {
        instagramAccounts.push({
          pageId: page.id,
          pageName: page.name,
          instagramId: page.instagram_business_account.id,
          instagramUsername: page.instagram_business_account.username || null,
          pageAccessToken: page.access_token
        })
      }
    }

    if (instagramAccounts.length === 0) {
      console.error("[Instagram Callback] No Instagram Business accounts found in pages")
      console.log("[Instagram Callback] Available pages:", pages.map((p: any) => ({
        pageId: p.id,
        pageName: p.name,
        instagramAccount: p.instagram_business_account
      })))
      return NextResponse.redirect(
        new URL("/admin/crm/settings/integrations?platform=instagram&error=no_instagram_account", origin),
        { status: 307 }
      )
    }

    console.log("[Instagram Callback] Found Instagram accounts:", instagramAccounts)

    // Store the first Instagram account (or all if multiple)
    // For now, store the first one
    const account = instagramAccounts[0]
    
    // Check for manual token override (useful for debugging permissions)
    const manualToken = process.env.INSTAGRAM_MANUAL_ACCESS_TOKEN
    
    // Prioritize: Manual Token -> Page Access Token -> User Access Token
    // We found that Page Access Token + Page ID is the most reliable way to fetch conversations
    const finalAccessToken = manualToken || account.pageAccessToken || accessToken
    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

    console.log("[Instagram Callback] Storing account:", {
      instagramId: account.instagramId,
      accountName: account.pageName,
      username: account.instagramUsername,
      pageId: account.pageId,
      usingPageToken: !!(manualToken || account.pageAccessToken),
      usingManualToken: !!manualToken
    })

    return await storeInstagramAccount(
      account.instagramId,
      account.pageName,
      account.instagramUsername,
      finalAccessToken,
      expiresIn,
      origin,
      cookieStore,
      account.pageId
    )

  } catch (err: any) {
    console.error("[Instagram Callback] Error:", err)
    return NextResponse.redirect(
      new URL(`/admin/crm/settings/integrations?platform=instagram&error=callback_error&message=${encodeURIComponent(err.message || "Unknown error")}`, origin),
      { status: 307 }
    )
  }
}

/**
 * Store Instagram account in database
 */
async function storeInstagramAccount(
  instagramAccountId: string,
  accountName: string,
  instagramUsername: string | null,
  accessToken: string,
  expiresIn: number | null,
  origin: string,
  cookieStore: ReturnType<typeof cookies>,
  pageId?: string
) {
  console.log("[Instagram Callback] storeInstagramAccount called:", {
    instagramAccountId,
    accountName,
    instagramUsername,
    hasAccessToken: !!accessToken,
    expiresIn,
    pageId
  })

  try {
    // Get current user session using route client to access cookies
    const supabase = createRouteClient(cookieStore)
    console.log("[Instagram Callback] Getting user session...")
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log("[Instagram Callback] User session result:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      console.error("[Instagram Callback] User not authenticated:", authError)
      return NextResponse.redirect(
        new URL("/admin/crm/settings/integrations?platform=instagram&error=not_authenticated", origin),
        { status: 307 }
      )
    }

    // Check if user is admin using the centralized isAdminEmail function
    const isAdmin = isAdminEmail(user.email)
    
    console.log("[Instagram Callback] Admin check:", {
      userEmail: user.email,
      isAdmin
    })

    if (!isAdmin) {
      console.error("[Instagram Callback] User is not admin")
      return NextResponse.redirect(
        new URL("/admin/crm/settings/integrations?platform=instagram&error=not_admin", origin),
        { status: 307 }
      )
    }

    // Calculate token expiration
    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

    console.log("[Instagram Callback] Upserting account into database...")
    console.log("[Instagram Callback] Account data:", {
      userId: user.id,
      accountName,
      instagramAccountId,
      instagramUsername,
      hasAccessToken: !!accessToken,
      tokenExpiresAt
    })

    // Store account directly in database using upsert to handle updates
    // First try to update existing record
    const { data: existingData, error: checkError } = await supabase
      .from("crm_instagram_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("instagram_account_id", instagramAccountId)
      .maybeSingle()

    let data, error
    if (existingData && !checkError) {
      // Update existing record
      console.log("[Instagram Callback] Updating existing account:", existingData.id)
      const result = await supabase
        .from("crm_instagram_accounts")
        .update({
          account_name: accountName,
          instagram_username: instagramUsername,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new record
      console.log("[Instagram Callback] Inserting new account")
      const result = await supabase
        .from("crm_instagram_accounts")
        .insert({
          user_id: user.id,
          account_name: accountName,
          instagram_account_id: instagramAccountId,
          instagram_username: instagramUsername,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("[Instagram Callback] Failed to store account:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.redirect(
        new URL(`/admin/crm/settings/integrations?platform=instagram&error=store_failed&details=${encodeURIComponent(error.message || "Unknown error")}`, origin),
        { status: 307 }
      )
    }

    console.log("[Instagram Callback] ===== ACCOUNT STORED SUCCESSFULLY =====")
    console.log("[Instagram Callback] Stored account ID:", data.id)
    
    // Trigger historical sync in background
    if (pageId) {
      // NOTE: Temporarily disabled because the Instagram account has too many existing conversations
      // with non-role users, causing the Graph API to timeout while filtering in Dev Mode.
      // Error: "Your query has timed out since you have too many conversations..."
      // To enable this, the app needs Advanced Access to instagram_manage_messages.
      
      console.log("[Instagram Callback] Skipping historical sync (Dev Mode limitation with high-volume account)")
      // console.log("[Instagram Callback] Triggering historical sync using Page ID:", pageId)
      // syncInstagramHistory(user.id, accessToken, instagramAccountId, pageId)
      //   .catch(err => console.error("[Instagram Callback] Background sync error:", err))
    } else {
      console.warn("[Instagram Callback] Skipping history sync: Page ID missing")
    }

    console.log("[Instagram Callback] Redirecting to integrations page...")
    
    return NextResponse.redirect(
      new URL("/admin/crm/settings/integrations?platform=instagram&success=connected", origin),
      { status: 307 }
    )

  } catch (err: any) {
    console.error("[Instagram Callback] Error storing account:", err)
    return NextResponse.redirect(
      new URL(`/admin/crm/settings/integrations?platform=instagram&error=store_error&message=${encodeURIComponent(err.message || "Unknown error")}`, origin),
      { status: 307 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = request.nextUrl
    
    // Log the incoming request for debugging
    console.log("[auth/callback] Incoming request:", {
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries()),
      origin
    })
    
    const cookieStore = cookies()
    let supabase
    
    try {
      supabase = createRouteClient(cookieStore)
    } catch (clientError: any) {
      console.error("[auth/callback] Failed to create Supabase client:", clientError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication service unavailable. Please try again.')}`, origin),
        { status: 307 }
      )
    }

    // Create a separate Supabase client for session operations (not tied to cookies)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[auth/callback] Missing Supabase environment variables")
      return NextResponse.redirect(
        new URL("/login?error=configuration_error", origin),
        { status: 307 }
      )
    }

  const sessionSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const code = searchParams.get("code")
  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")
  const provider = searchParams.get("provider")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorReason = searchParams.get("error_reason")

  // Comprehensive logging for debugging
  console.log("[auth/callback] Callback received:", {
    url: request.url,
    provider,
    hasCode: !!code,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    state,
    error,
    errorReason,
    allParams: Object.fromEntries(searchParams.entries())
  })

  // Handle hash-based OAuth callback (from Supabase client-side redirect)
  if (searchParams.get("from") === "hash") {
    console.log("[auth/callback] Processing hash-based OAuth callback")

    try {
      // Extract tokens from hash parameters
      const hashAccessToken = searchParams.get("access_token")
      const hashRefreshToken = searchParams.get("refresh_token")
      const hashExpiresAt = searchParams.get("expires_at")

      if (hashAccessToken && hashRefreshToken) {
        console.log("[auth/callback] Found hash tokens, setting session")

      // Create Supabase session with hash tokens using session client
      const { data: sessionData, error: sessionError } = await sessionSupabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken,
      })

        if (sessionError || !sessionData.session?.user) {
          console.error("[auth/callback] Failed to create session from hash tokens:", sessionError)
          return NextResponse.redirect(new URL("/login?error=session_failed", origin), { status: 307 })
        }

        const user = sessionData.session.user
        const email = user.email?.toLowerCase() ?? null

        console.log(`[auth/callback] Session created for user: ${email}`)

        // Now proceed with the normal user routing logic
        return await processUserLogin(user, email, origin, cookieStore)
      }
    } catch (hashError) {
      console.error("[auth/callback] Hash processing error:", hashError)
      return NextResponse.redirect(new URL("/login?error=hash_processing_failed", origin), { status: 307 })
    }
  }

  // Handle Instagram OAuth callback (Meta OAuth, not Supabase)
  // Check both provider param and if it's a Meta callback (has code but no Supabase tokens)
  if (provider === "instagram" || (code && !accessToken && !refreshToken && request.url.includes("provider=instagram"))) {
    console.log("[auth/callback] Detected Instagram OAuth callback, routing to handler")
    return handleInstagramCallback(request, code, state, error, errorReason, origin, cookieStore)
  }

  // Create redirect response - we'll update the location after setting cookies
  const response = NextResponse.redirect(new URL(DEFAULT_VENDOR_REDIRECT, origin), { status: 307 })

  deleteCookie(response, POST_LOGIN_REDIRECT_COOKIE)

  if (code) {
    let sessionData, exchangeError
    
    try {
      const result = await supabase.auth.exchangeCodeForSession(code)
      sessionData = result.data
      exchangeError = result.error
    } catch (err: any) {
      console.error("[auth/callback] Exception during exchangeCodeForSession:", err)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`, origin),
        { status: 307 }
      )
    }

    if (exchangeError) {
      console.error("Failed to exchange Supabase auth code:", exchangeError)
      deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
      response.cookies.set("auth_error", "exchange_failed", { path: "/", maxAge: 60 })
      await logFailedLoginAttempt({ method: "oauth", reason: exchangeError.message })
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`, origin),
        { status: 307 }
      )
    }

    // After code exchange, immediately get the session to capture provider tokens
    // Provider tokens are only available right after exchange, not in subsequent getSession() calls
    if (sessionData?.session) {
      const providerToken = (sessionData.session as any).provider_token as string | undefined
      const providerRefreshToken = (sessionData.session as any).provider_refresh_token as string | undefined
      
      console.log('[auth/callback] Provider tokens after exchange:', {
        hasProviderToken: !!providerToken,
        hasRefreshToken: !!providerRefreshToken,
        tokenLength: providerToken?.length || 0,
        refreshTokenLength: providerRefreshToken?.length || 0,
      })
      
      // Store provider tokens in user metadata for Gmail access
      if ((providerToken && providerToken.trim()) || (providerRefreshToken && providerRefreshToken.trim())) {
        console.log('[auth/callback] Storing provider tokens in user metadata')
        const userId = sessionData.session.user.id
        
        try {
          const serviceSupabase = createServiceClient()
          
          // Get existing metadata to merge
          const { data: existingUser } = await serviceSupabase.auth.admin.getUserById(userId)
          const existingMetadata = existingUser?.user?.app_metadata || {}
          
          const metadataUpdate: any = { ...existingMetadata }
          if (providerToken && providerToken.trim()) {
            metadataUpdate.provider_token = providerToken
          }
          if (providerRefreshToken && providerRefreshToken.trim()) {
            metadataUpdate.provider_refresh_token = providerRefreshToken
          }
          
          const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(
            userId,
            { app_metadata: metadataUpdate }
          )
          
          if (updateError) {
            console.error('[auth/callback] Failed to store provider tokens:', updateError)
          } else {
            console.log('[auth/callback] Successfully stored provider tokens in user metadata')
          }
        } catch (error) {
          console.error('[auth/callback] Error storing provider tokens:', error)
        }
      }
    }
  } else if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error("Failed to establish Supabase session from tokens:", sessionError)
      deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
      await logFailedLoginAttempt({ method: "oauth", reason: sessionError.message })
      response.headers.set("Location", new URL("/vendor/login?error=session_missing", origin).toString())
      return response
    }
  } else {
    deleteCookie(response, VENDOR_SESSION_COOKIE_NAME)
    response.cookies.set("auth_error", "missing_code", { path: "/", maxAge: 60 })
    await logFailedLoginAttempt({ method: "oauth", reason: "Missing OAuth code" })
    return response
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    console.error("Unable to fetch Supabase session after exchange:", sessionError)
    const errorResponse = NextResponse.redirect(new URL("/login?error=session_missing", origin), { status: 307 })
    deleteCookie(errorResponse, VENDOR_SESSION_COOKIE_NAME)
    return errorResponse
  }

  // Get user from session (already exchanged above if code was present)
  const user = session.user
  const email = user.email?.toLowerCase() ?? null
  const isAdmin = isAdminEmail(email)
  
  console.log(`[auth/callback] Processing login for email: ${email}, isAdmin: ${isAdmin}`)

  // Determine redirect destination
  // Validate and construct the base URL properly
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  
  if (!appUrl) {
    console.error("[auth/callback] appUrl is missing - NEXT_PUBLIC_APP_URL not set and origin is missing")
    const errorResponse = NextResponse.redirect(new URL("/login?error=configuration_error", origin || "http://localhost:3000"), { status: 307 })
    return errorResponse
  }
  
  // Remove trailing slash and ensure it has a protocol
  appUrl = appUrl.replace(/\/$/, "")
  if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://")) {
    // If origin has protocol, use it
    if (origin && (origin.startsWith("http://") || origin.startsWith("https://"))) {
      appUrl = origin.replace(/\/$/, "")
    } else {
      console.error(`[auth/callback] Invalid appUrl format: ${appUrl}`)
      const errorResponse = NextResponse.redirect(new URL("/login?error=url_format_error", origin || "http://localhost:3000"), { status: 307 })
      return errorResponse
    }
  }
  
  const finalRedirectBase = appUrl
  
  // Validate finalRedirectBase is a valid URL
  try {
    new URL(finalRedirectBase)
  } catch (urlError) {
    console.error(`[auth/callback] Invalid finalRedirectBase URL: ${finalRedirectBase}`, urlError)
    const errorResponse = NextResponse.redirect(new URL("/login?error=url_format_error", origin || "http://localhost:3000"), { status: 307 })
    return errorResponse
  }

  // Handle admin users - set admin session and redirect to admin dashboard
  if (isAdmin && email) {
    console.log(`[auth/callback] Admin user detected - setting admin session and redirecting to dashboard`)
    
    // ... (rest of admin logic) ...

    // Build admin session cookie
    const adminCookie = buildAdminSessionCookie(email)
    const adminRedirect = NextResponse.redirect(new URL("/admin/dashboard", finalRedirectBase), { status: 307 })

    // Set admin session cookie
    adminRedirect.cookies.set(ADMIN_SESSION_COOKIE_NAME, adminCookie.value, adminCookie.options)

    // Clear vendor session cookie (admin shouldn't have vendor access)
    adminRedirect.cookies.set(VENDOR_SESSION_COOKIE_NAME, "", { ...clearVendorSessionCookie().options, maxAge: 0 })

    // Clear pending vendor email cookie
    deleteCookie(adminRedirect, PENDING_VENDOR_EMAIL_COOKIE)

    // Clear account selection requirement after successful login
    deleteCookie(adminRedirect, REQUIRE_ACCOUNT_SELECTION_COOKIE)

    console.log(`[auth/callback] Admin login successful for ${email}, redirecting to admin dashboard`)
    return adminRedirect
  }

  // For non-admins, try to link vendor
  const vendor = await linkSupabaseUserToVendor(user)
  
  console.log(`[auth/callback] Vendor linking result: ${vendor ? `${vendor.vendor_name} (status: ${vendor.status})` : "null"}`)

  // If vendor is linked, set vendor session and redirect to vendor dashboard
  if (vendor) {
    // ... existing vendor logic ...
    console.log(`[auth/callback] Vendor linked: ${vendor.vendor_name}, status: ${vendor.status}, email: ${email}`)
    const sessionCookie = buildVendorSessionCookie(vendor.vendor_name)
    
    let destination = DEFAULT_VENDOR_REDIRECT
    if (vendor.status && vendor.status !== "active") {
      if (vendor.status === "pending" || vendor.status === "review") {
        destination = PENDING_VENDOR_REDIRECT
      } else if (vendor.status === "disabled" || vendor.status === "suspended") {
        destination = DENIED_VENDOR_REDIRECT
      }
    }

    const redirectUrl = new URL(destination, finalRedirectBase)
    const redirectResponse = NextResponse.redirect(redirectUrl, { status: 307 })
    
    redirectResponse.cookies.set(sessionCookie.name, sessionCookie.value, {
      ...sessionCookie.options,
    })
    
    redirectResponse.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      ...clearAdminSessionCookie().options,
      maxAge: 0,
    })
    
    deleteCookie(redirectResponse, PENDING_VENDOR_EMAIL_COOKIE)
    deleteCookie(redirectResponse, REQUIRE_ACCOUNT_SELECTION_COOKIE)
    
    return redirectResponse
  }

  // NEW: Check if the user is a collector (has orders or a profile)
  const serviceClient = createServiceClient()
  const { data: orderMatch } = await serviceClient
    .from("orders")
    .select("customer_id, shopify_id")
    .eq("customer_email", email)
    .limit(1)
    .maybeSingle()

  const { data: profileMatch } = await serviceClient
    .from("collector_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (orderMatch || profileMatch) {
    console.log(`[auth/callback] Collector detected for email: ${email}`)
    const shopifyCustomerId = orderMatch?.customer_id || orderMatch?.shopify_id
    
    const collectorCookie = buildCollectorSessionCookie({
      shopifyCustomerId: shopifyCustomerId ? shopifyCustomerId.toString() : null,
      email,
      issuedAt: Date.now(),
    })

    const collectorRedirect = NextResponse.redirect(new URL("/collector/dashboard", finalRedirectBase), { status: 307 })
    collectorRedirect.cookies.set(collectorCookie.name, collectorCookie.value, collectorCookie.options)
    
    if (shopifyCustomerId) {
      collectorRedirect.cookies.set("shopify_customer_id", shopifyCustomerId.toString(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      })
    }

    deleteCookie(collectorRedirect, REQUIRE_ACCOUNT_SELECTION_COOKIE)
    return collectorRedirect
  }

  // No vendor linked and not admin – block unregistered vendors
  console.log(`[auth/callback] No vendor or collector linked for email: ${email}`)
  const notRegisteredResponse = NextResponse.redirect(new URL(NOT_REGISTERED_REDIRECT, finalRedirectBase), { status: 307 })
  deleteCookie(notRegisteredResponse, VENDOR_SESSION_COOKIE_NAME)

  await supabase.auth.signOut()
  notRegisteredResponse.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", { ...clearAdminSessionCookie().options, maxAge: 0 })
  await logFailedLoginAttempt({
    email,
    method: "oauth",
    reason: "No vendor linked for non-admin user",
  })

  return notRegisteredResponse
  } catch (error: any) {
    // Catch all errors and redirect to login with error message
    console.error('[auth/callback] Unexpected error in auth callback:', {
      message: error?.message,
      code: error?.code,
      error_code: error?.error_code,
      stack: error?.stack,
    })
    
    // Check if it's a redirect (expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    
    // For any other error, redirect to login with error message
    const errorMessage = error?.error_code === 'unexpected_failure' 
      ? 'Authentication failed. Please try again.'
      : 'An error occurred during login. Please try again.'
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.nextUrl.origin),
      { status: 307 }
    )
  }
} 