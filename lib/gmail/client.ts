/**
 * Gmail API Client
 * Fetches emails from Gmail using Google OAuth tokens from Supabase
 */

import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    parts?: Array<{
      mimeType: string
      body: { data?: string }
    }>
    body?: { data?: string }
  }
  internalDate: string
}

/**
 * Get Google OAuth access token from Supabase session
 * Note: This requires the session to be passed in, as Supabase doesn't store provider tokens
 * We'll need to get it from the session object directly
 */
export async function getGoogleAccessTokenFromSession(session: any): Promise<string | null> {
  try {
    // Supabase stores provider tokens in the session's provider_token field
    // But we need to get it from the OAuth provider data
    const providerToken = session?.provider_token as string | undefined
    
    if (!providerToken) {
      // Try to get from provider_refresh_token or refresh the token
      console.error('[Gmail] No provider token in session')
      return null
    }

    return providerToken
  } catch (error: any) {
    console.error('[Gmail] Error getting access token:', error)
    return null
  }
}

/**
 * Create Gmail API client with OAuth token
 */
async function createGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

/**
 * Fetch emails from Gmail
 */
export async function fetchGmailMessages(
  accessToken: string,
  options: {
    maxResults?: number
    query?: string
    afterDate?: Date
  } = {}
): Promise<GmailMessage[]> {
  if (!accessToken) {
    throw new Error('Google access token is required')
  }

  const gmail = await createGmailClient(accessToken)
  const { maxResults = 50, query = '', afterDate } = options

  try {
    // Build query
    let gmailQuery = query
    if (afterDate) {
      const afterTimestamp = Math.floor(afterDate.getTime() / 1000)
      gmailQuery = `${gmailQuery} after:${afterTimestamp}`.trim()
    }

    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: gmailQuery,
    })

    const messageIds = listResponse.data.messages?.map(m => m.id!) || []

    if (messageIds.length === 0) {
      return []
    }

    // Fetch full message details
    const messages = await Promise.all(
      messageIds.map(async (id) => {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'full',
        })
        return messageResponse.data as GmailMessage
      })
    )

    return messages
  } catch (error: any) {
    console.error('[Gmail] Error fetching messages:', error)
    throw new Error(`Gmail API error: ${error.message}`)
  }
}

/**
 * Extract email content from Gmail message
 */
export function extractEmailContent(message: GmailMessage): {
  from: string
  to: string
  subject: string
  body: string
  date: Date
} {
  const headers = message.payload.headers || []
  const getHeader = (name: string) => 
    headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  const from = getHeader('from')
  const to = getHeader('to')
  const subject = getHeader('subject')
  const dateHeader = getHeader('date')
  const date = dateHeader ? new Date(dateHeader) : new Date(parseInt(message.internalDate))

  // Extract body text
  let body = ''
  if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
  } else if (message.payload.parts) {
    // Find text/plain or text/html part
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8')
        break
      } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
        // Fallback to HTML if no plain text
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8')
        // Simple HTML stripping (you might want a better solution)
        body = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
      }
    }
  }

  return { from, to, subject, body, date }
}

