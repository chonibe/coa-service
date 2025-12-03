import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { fetchGmailMessages, extractEmailContent } from "@/lib/gmail/client"
import { logEmail } from "@/lib/crm/log-email"
import { isAdminEmail } from "@/lib/vendor-auth"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

/**
 * Sync emails from Gmail to CRM
 * ADMIN ONLY - Fetches recent emails from the authenticated admin's Gmail account
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    // Get current user session from cookies
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

    // ADMIN ONLY: Check if user is admin
    const email = userEmail.toLowerCase()
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Also verify admin session cookie
    const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminSessionToken)
    
    console.log('[Gmail Sync] Admin session check:', {
      hasToken: !!adminSessionToken,
      hasSession: !!adminSession,
      sessionEmail: adminSession?.email,
      isAdmin: adminSession?.email ? isAdminEmail(adminSession.email) : false,
    })
    
    if (!adminSession?.email || !isAdminEmail(adminSession.email)) {
      console.error('[Gmail Sync] Admin session verification failed')
      return NextResponse.json(
        { 
          error: "Forbidden: Admin session required",
          debug: {
            hasToken: !!adminSessionToken,
            hasSession: !!adminSession,
            sessionEmail: adminSession?.email,
          }
        },
        { status: 403 }
      )
    }

    // Get provider token from session
    // Supabase stores provider tokens in various places - check all possible locations
    console.log('[Gmail Sync] Checking session for provider token...')
    console.log('[Gmail Sync] Session keys:', Object.keys(session))
    
    // Check session directly - log actual values to see what we have
    const providerToken = (session as any).provider_token as string | undefined
    const providerRefreshToken = (session as any).provider_refresh_token as string | undefined
    
    console.log('[Gmail Sync] Raw session provider data:', {
      provider_token_type: typeof providerToken,
      provider_token_length: providerToken?.length || 0,
      provider_token_preview: providerToken ? `${providerToken.substring(0, 20)}...` : 'null/undefined',
      provider_refresh_token_type: typeof providerRefreshToken,
      provider_refresh_token_length: providerRefreshToken?.length || 0,
      provider_refresh_token_preview: providerRefreshToken ? `${providerRefreshToken.substring(0, 20)}...` : 'null/undefined',
    })
    
    // Get user data to check metadata using both route client and service client
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('[Gmail Sync] Error getting user:', userError)
    }
    
    // Also try using service client to get full user data with provider tokens
    let serviceUser = null
    try {
      const serviceSupabase = createServiceClient()
      const { data: serviceUserData, error: serviceError } = await serviceSupabase.auth.admin.getUserById(userId)
      if (!serviceError && serviceUserData?.user) {
        serviceUser = serviceUserData.user
        console.log('[Gmail Sync] Got user data from service client')
      }
    } catch (error) {
      console.error('[Gmail Sync] Error getting user from service client:', error)
    }
    
    // Check multiple possible locations for the token
    const tokenFromUserMetadata = user?.app_metadata?.provider_token as string | undefined
    const tokenFromUserProviders = user?.app_metadata?.providers?.google?.provider_token as string | undefined
    const tokenFromUserIdentities = (user?.identities?.find((id: any) => id.provider === 'google') as any)?.identity_data?.provider_token as string | undefined
    
    // Also check service user metadata - this is where we store provider tokens
    const tokenFromServiceUser = serviceUser?.app_metadata?.provider_token as string | undefined
    const refreshTokenFromServiceUser = serviceUser?.app_metadata?.provider_refresh_token as string | undefined
    const tokenFromServiceProviders = serviceUser?.app_metadata?.providers?.google?.provider_token as string | undefined
    
    console.log('[Gmail Sync] Token locations checked:', {
      session_provider_token: !!providerToken,
      session_provider_refresh_token: !!providerRefreshToken,
      user_metadata_token: !!tokenFromUserMetadata,
      user_providers_token: !!tokenFromUserProviders,
      user_identities_token: !!tokenFromUserIdentities,
      service_user_token: !!tokenFromServiceUser,
      service_refresh_token: !!refreshTokenFromServiceUser,
      service_providers_token: !!tokenFromServiceProviders,
    })
    
    // Use provider token from metadata (where we store it) or session
    let accessToken = tokenFromServiceUser || (providerToken && providerToken.trim()) 
      ? (tokenFromServiceUser || providerToken)
      : tokenFromUserMetadata || tokenFromUserProviders || tokenFromUserIdentities || tokenFromServiceProviders
    
    // Also check for refresh token in metadata
    const storedRefreshToken = refreshTokenFromServiceUser || (providerRefreshToken && providerRefreshToken.trim() ? providerRefreshToken : undefined)
    
    // If no access token, try to use refresh token to get a new one
    // Check if refresh token exists and is not empty (from metadata or session)
    const hasRefreshToken = storedRefreshToken && storedRefreshToken.trim().length > 0
    
    console.log('[Gmail Sync] Refresh token check:', {
      hasRefreshToken,
      refreshTokenLength: storedRefreshToken?.length || 0,
      refreshTokenPreview: storedRefreshToken ? `${storedRefreshToken.substring(0, 20)}...` : 'null/undefined',
      source: refreshTokenFromServiceUser ? 'metadata' : (providerRefreshToken ? 'session' : 'none'),
    })
    
    if (!accessToken && hasRefreshToken) {
      const googleClientId = process.env.SUPABASE_GOOGLE_CLIENT_ID
      const googleClientSecret = process.env.SUPABASE_GOOGLE_CLIENT_SECRET
      
      if (!googleClientId || !googleClientSecret) {
        console.error('[Gmail Sync] Missing Google OAuth credentials in environment variables')
        return NextResponse.json(
          { 
            error: "Gmail sync is not properly configured. Missing Google OAuth credentials.",
            requiresReauth: false,
            message: "Please contact an administrator to configure Gmail sync."
          },
          { status: 500 }
        )
      }
      
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: googleClientId,
              client_secret: googleClientSecret,
              refresh_token: storedRefreshToken!,
              grant_type: 'refresh_token',
            }),
        })
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          accessToken = tokenData.access_token
          console.log('[Gmail Sync] Successfully refreshed access token')
        } else {
          const errorData = await tokenResponse.json().catch(() => ({}))
          console.error('[Gmail Sync] Failed to refresh token:', errorData)
          
          // If refresh token is invalid, user needs to re-authenticate
          if (tokenResponse.status === 400) {
            return NextResponse.json(
              { 
                error: "Gmail access expired. Please log out and log back in with Google to refresh Gmail permissions.",
                requiresReauth: true,
                message: "Your Gmail access has expired. Please re-authenticate to continue syncing emails."
              },
              { status: 403 }
            )
          }
        }
      } catch (error) {
        console.error('[Gmail Sync] Error refreshing token:', error)
      }
    }
    
    if (!accessToken) {
      // No access token available - user needs to re-authenticate with Gmail scopes
      return NextResponse.json(
        { 
          error: "Gmail access not available. Your current Google login doesn't have Gmail permissions.",
          requiresReauth: true,
          message: "Please log out completely and log back in using the admin login page to grant Gmail permissions. Make sure to approve Gmail access when prompted."
        },
        { status: 403 }
      )
    }

    // Fetch emails from last 30 days
    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - 30)

    console.log(`[Gmail Sync] Fetching emails for ${userEmail} from last 30 days`)

    const messages = await fetchGmailMessages(accessToken, {
      maxResults: 100,
      afterDate,
    })

    return await processMessages(messages, userEmail)
  } catch (error: any) {
    console.error("[Gmail Sync] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

async function processMessages(messages: any[], userEmail: string) {
  console.log(`[Gmail Sync] Found ${messages.length} emails to sync`)

  let syncedCount = 0
  let errorCount = 0

  // Process each email
  for (const message of messages) {
    try {
      const { from, to, subject, body, date } = extractEmailContent(message)

      // Extract email addresses (remove name part)
      const fromEmail = from.match(/<(.+)>/)?.[1] || from
      const toEmail = to.match(/<(.+)>/)?.[1] || to

      // Determine direction
      const direction = toEmail.toLowerCase().includes(userEmail.toLowerCase()) 
        ? 'inbound' 
        : 'outbound'

      // Log to CRM
      await logEmail({
        customerEmail: direction === 'inbound' ? fromEmail : toEmail,
        subject,
        content: body,
        direction,
        externalId: message.id,
        metadata: {
          threadId: message.threadId,
          date: date.toISOString(),
          from,
          to,
        },
      })

      syncedCount++
    } catch (error: any) {
      console.error(`[Gmail Sync] Error processing message ${message.id}:`, error)
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    synced: syncedCount,
    errors: errorCount,
    total: messages.length,
  })
}
