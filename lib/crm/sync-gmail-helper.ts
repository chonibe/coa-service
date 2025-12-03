import { createClient as createServiceClient } from "@/lib/supabase/server"
import { fetchGmailMessages, extractEmailContent } from "@/lib/gmail/client"
import { logEmail } from "@/lib/crm/log-email"
import { isAdminEmail } from "@/lib/vendor-auth"
import { updateLastSyncTime } from "@/lib/crm/sync-helper"

/**
 * Helper function to sync Gmail emails for a user
 * Can be called server-side with user ID and tokens
 */
export async function syncGmailForUser(
  userId: string,
  userEmail: string,
  accessToken?: string,
  refreshToken?: string
): Promise<{ success: boolean; synced: number; errors: number; total: number }> {
  try {
    // Verify user is admin
    if (!isAdminEmail(userEmail.toLowerCase())) {
      throw new Error("Only admins can sync Gmail")
    }

    // Get tokens from user metadata if not provided
    let token = accessToken
    let refresh = refreshToken

    if (!token || !refresh) {
      const serviceSupabase = createServiceClient()
      const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(userId)
      
      if (userError || !userData?.user) {
        throw new Error("Failed to get user data")
      }

      const user = userData.user
      token = token || (user.app_metadata?.provider_token as string | undefined)
      refresh = refresh || (user.app_metadata?.provider_refresh_token as string | undefined)
    }

    // If no access token but we have refresh token, refresh it
    if (!token && refresh) {
      const googleClientId = process.env.SUPABASE_GOOGLE_CLIENT_ID
      const googleClientSecret = process.env.SUPABASE_GOOGLE_CLIENT_SECRET
      
      if (!googleClientId || !googleClientSecret) {
        throw new Error("Gmail sync is not properly configured")
      }

      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: refresh,
            grant_type: 'refresh_token',
          }),
        })
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          token = tokenData.access_token
        } else {
          throw new Error("Failed to refresh access token")
        }
      } catch (error) {
        console.error('[Gmail Sync Helper] Error refreshing token:', error)
        throw new Error("Gmail access expired. Please re-authenticate.")
      }
    }

    if (!token) {
      throw new Error("Gmail access not available")
    }

    // Fetch emails from last 30 days
    const afterDate = new Date()
    afterDate.setDate(afterDate.getDate() - 30)

    console.log(`[Gmail Sync Helper] Fetching emails for ${userEmail} from last 30 days`)

    const messages = await fetchGmailMessages(token, {
      maxResults: 100,
      afterDate,
    })

    // Process messages
    let syncedCount = 0
    let errorCount = 0

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
        console.error(`[Gmail Sync Helper] Error processing message ${message.id}:`, error)
        errorCount++
      }
    }

    console.log(`[Gmail Sync Helper] Successfully synced ${syncedCount} emails (${errorCount} errors) for ${userEmail}`)

    // Update last sync time
    await updateLastSyncTime(userId)

    return {
      success: true,
      synced: syncedCount,
      errors: errorCount,
      total: messages.length,
    }
  } catch (error: any) {
    console.error("[Gmail Sync Helper] Error:", error)
    throw error
  }
}

