/**
 * Gmail API Email Sending
 * Sends emails using Gmail API with OAuth tokens from configured sender
 * Supports system-wide email sender configuration
 */

import { google } from 'googleapis'
import { createClient as createServiceClient } from '@/lib/supabase/server'

interface GmailSendOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

interface GmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  method: 'gmail' | 'fallback'
}

// Cache for Gmail tokens to avoid repeated DB lookups
let cachedTokens: { 
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number 
} | null = null
const TOKEN_CACHE_BUFFER_MS = 5 * 60 * 1000 // 5 minutes before expiry

/**
 * Get configured sender's Gmail tokens
 * First checks system_settings for configured sender, falls back to first admin with tokens
 */
async function getGmailTokens(): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  try {
    const supabase = createServiceClient()
    
    // Check cache first
    if (cachedTokens && cachedTokens.expiresAt > Date.now() + TOKEN_CACHE_BUFFER_MS) {
      return { 
        accessToken: cachedTokens.accessToken, 
        refreshToken: cachedTokens.refreshToken,
        userId: cachedTokens.userId
      }
    }
    
    // Get configured email sender from system settings
    const { data: settings, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "email_sender_config")
      .maybeSingle()

    let configuredUserId: string | null = null
    
    if (!settingsError && settings?.value) {
      const config = typeof settings.value === 'string' 
        ? JSON.parse(settings.value) 
        : settings.value
      configuredUserId = config.sender_user_id
    }
    
    // If we have a configured sender, try to use their tokens
    if (configuredUserId) {
      const tokens = await getUserGmailTokens(configuredUserId)
      if (tokens) {
        return tokens
      }
      console.warn('[Gmail Send] Configured sender has no valid tokens, falling back')
    }
    
    // Fallback: Find any admin user with Gmail tokens
    console.log('[Gmail Send] No configured sender or tokens invalid, searching for admin with tokens')
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .eq("is_active", true)

    if (adminRoles) {
      for (const role of adminRoles) {
        const tokens = await getUserGmailTokens(role.user_id)
        if (tokens) {
          console.log('[Gmail Send] Found admin with valid tokens:', tokens.userId)
          return tokens
        }
      }
    }
    
    console.error('[Gmail Send] No user with valid Gmail tokens found')
    return null
  } catch (error: any) {
    console.error('[Gmail Send] Error getting Gmail tokens:', error)
    return null
  }
}

/**
 * Get Gmail tokens for a specific user
 */
async function getUserGmailTokens(userId: string): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  try {
    const supabase = createServiceClient()
    const { data: userData, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error || !userData.user) {
      console.error(`[Gmail Send] Error getting user ${userId}:`, error)
      return null
    }

    const user = userData.user
    const providerToken = user.app_metadata?.provider_token as string | undefined
    const providerRefreshToken = user.app_metadata?.provider_refresh_token as string | undefined
    
    if (providerRefreshToken) {
      // Try to refresh the token
      const refreshed = await refreshGmailToken(providerRefreshToken)
      if (refreshed) {
        // Cache the token
        cachedTokens = {
          userId,
          accessToken: refreshed.accessToken,
          refreshToken: providerRefreshToken,
          expiresAt: Date.now() + (refreshed.expiresIn * 1000),
        }
        return { accessToken: refreshed.accessToken, refreshToken: providerRefreshToken, userId }
      }
    } else if (providerToken) {
      // Use existing token (may be expired)
      return { accessToken: providerToken, refreshToken: '', userId }
    }
    
    return null
  } catch (error) {
    console.error(`[Gmail Send] Error getting tokens for user ${userId}:`, error)
    return null
  }
}

/**
 * Refresh Gmail access token using refresh token
 */
async function refreshGmailToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
  const clientId = process.env.SUPABASE_GOOGLE_CLIENT_ID
  const clientSecret = process.env.SUPABASE_GOOGLE_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    console.error('[Gmail Send] Google OAuth credentials not configured')
    return null
  }
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('[Gmail Send] Token refresh failed:', error)
      return null
    }
    
    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
    }
  } catch (error: any) {
    console.error('[Gmail Send] Error refreshing token:', error)
    return null
  }
}

/**
 * Create RFC 2822 formatted email message
 */
function createEmailMessage(options: GmailSendOptions & { fromEmail: string }): string {
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
  
  const messageParts = [
    `From: ${options.fromEmail}`,
    `To: ${to}`,
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
  ]
  
  if (options.replyTo) {
    messageParts.push(`Reply-To: ${options.replyTo}`)
  }
  
  // Add empty line between headers and body
  messageParts.push('')
  messageParts.push(options.html)
  
  const message = messageParts.join('\r\n')
  
  // Encode to base64url format (required by Gmail API)
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Send email using Gmail API
 */
export async function sendGmailEmail(options: GmailSendOptions): Promise<GmailSendResult> {
  try {
    // Get Gmail tokens from configured sender
    const tokens = await getGmailTokens()
    
    if (!tokens) {
      console.warn('[Gmail Send] No Gmail tokens available, email not sent via Gmail')
      return {
        success: false,
        error: 'No Gmail sender configured. Please configure email sender in admin messaging settings.',
        method: 'gmail',
      }
    }
    
    console.log('[Gmail Send] Using tokens from user:', tokens.userId)
    
    // Create Gmail client
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: tokens.accessToken })
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    
    // Determine sender email
    let fromEmail = options.from || process.env.GMAIL_SEND_FROM || process.env.EMAIL_FROM
    
    if (!fromEmail) {
      // Get profile to get email
      try {
        const profile = await gmail.users.getProfile({ userId: 'me' })
        fromEmail = profile.data.emailAddress || 'noreply@thestreetcollector.com'
      } catch {
        fromEmail = 'noreply@thestreetcollector.com'
      }
    }
    
    // Create the email message
    const rawMessage = createEmailMessage({
      ...options,
      fromEmail,
    })
    
    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    })
    
    console.log('[Gmail Send] Email sent successfully:', {
      messageId: response.data.id,
      to: options.to,
      subject: options.subject,
    })
    
    return {
      success: true,
      messageId: response.data.id || undefined,
      method: 'gmail',
    }
  } catch (error: any) {
    console.error('[Gmail Send] Error sending email:', error)
    
    // Check for specific Gmail errors
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      // Token expired or revoked, clear cache
      cachedTokens = null
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send via Gmail',
      method: 'gmail',
    }
  }
}

/**
 * Check if Gmail sending is available
 */
export async function isGmailSendAvailable(): Promise<boolean> {
  const tokens = await getGmailTokens()
  return tokens !== null
}

/**
 * Clear the token cache (useful for testing or when tokens are updated)
 */
export function clearGmailTokenCache(): void {
  cachedTokens = null
}
