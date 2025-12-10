import { createClient as createServiceClient } from "@/lib/supabase/server"

interface InstagramMessage {
  id: string
  message: string
  created_time: string
  from: {
    id: string
    username: string
  }
  to: {
    data: Array<{
      id: string
      username: string
    }>
  }
}

interface InstagramConversation {
  id: string
  // messages and participants removed from here as we fetch them separately/infer them
  updated_time: string
}

export async function fetchInstagramConversations(
  accessToken: string,
  targetId: string
) {
  try {
    // Debug: Check token permissions (only works for User Token, skip for Page Token if manual)
    if (!process.env.INSTAGRAM_MANUAL_ACCESS_TOKEN) {
      console.log("[Instagram Helper] Checking token permissions...")
      const debugResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`
      )
      if (debugResponse.ok) {
        const debugData = await debugResponse.json()
        console.log("[Instagram Helper] Token permissions:", JSON.stringify(debugData, null, 2))
      } else {
        // Don't fail, just log (Page Tokens don't support /me/permissions)
        console.log("[Instagram Helper] Permissions check skipped (likely Page Token).")
      }
    }

    console.log(`[Instagram Helper] Fetching conversations for target ${targetId}`)
    
    // Fetch conversations using Page ID
    // Added limit=25 to prevent "Please reduce the amount of data" error
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${targetId}/conversations?platform=instagram&fields=id,updated_time&limit=25&access_token=${accessToken}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch conversations: ${errorText}`)
    }

    const data = await response.json()
    return data.data as InstagramConversation[]
  } catch (error) {
    console.error("[Instagram Helper] Error fetching conversations:", error)
    throw error
  }
}

export async function fetchConversationMessages(
  accessToken: string,
  conversationId: string
) {
  try {
    // Added limit=50 to prevent data volume errors
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${conversationId}/messages?fields=id,message,created_time,from,to&limit=50&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      // If we can't fetch messages for a specific conversation, log but return empty to continue
      console.warn(`[Instagram Helper] Failed to fetch messages for conversation ${conversationId}:`, await response.text())
      return []
    }

    const data = await response.json()
    return data.data as InstagramMessage[]
  } catch (error) {
    console.error(`[Instagram Helper] Error fetching messages for ${conversationId}:`, error)
    return []
  }
}

export async function syncInstagramHistory(
  userId: string,
  accessToken: string,
  instagramAccountId: string,
  pageId: string
) {
  const supabase = createServiceClient()
  console.log(`[Instagram Sync] Starting history sync for user ${userId}, account ${instagramAccountId} via Page ${pageId}`)

  try {
    // Use Page ID for fetching conversations (works better with Page Tokens)
    const conversations = await fetchInstagramConversations(accessToken, pageId)
    console.log(`[Instagram Sync] Found ${conversations?.length || 0} conversations`)

    if (!conversations) return

    for (const igConv of conversations) {
      // 3. Sync messages
      const messages = await fetchConversationMessages(accessToken, igConv.id)
      console.log(`[Instagram Sync] Syncing ${messages.length} messages for conversation ${igConv.id}`)
      
      if (messages.length === 0) continue

      // Infer participant from messages (since we removed participants field from list fetch)
      // Look for a message where the sender is NOT the page/business
      let participant = messages.find(m => m.from.id !== instagramAccountId && m.from.id !== pageId)?.from
      
      // If all messages are FROM the page, look at the 'to' field of the first message
      if (!participant) {
        const firstMsg = messages[0]
        const recipient = firstMsg.to.data.find(r => r.id !== instagramAccountId && r.id !== pageId)
        if (recipient) {
          participant = recipient
        }
      }

      if (!participant) {
        console.warn(`[Instagram Sync] Could not identify customer participant for conversation ${igConv.id}`)
        continue
      }

      // 1. Find or create customer
      let customerId: string

      const { data: existingCustomer } = await supabase
        .from("crm_customers")
        .select("id")
        .eq("instagram_id", participant.id)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
        // Update username if needed
        await supabase
          .from("crm_customers")
          .update({ instagram_username: participant.username })
          .eq("id", customerId)
      } else {
        const { data: newCustomer, error: createError } = await supabase
          .from("crm_customers")
          .insert({
            instagram_id: participant.id,
            instagram_username: participant.username,
            first_name: participant.username, // Fallback name
          })
          .select("id")
          .single()

        if (createError) {
          console.error(`[Instagram Sync] Failed to create customer for ${participant.username}:`, createError)
          continue
        }
        customerId = newCustomer.id
      }

      // 2. Find or create conversation
      let conversationId: string
      
      // Check if we already have this conversation mapped
      // (This is a simplified check - ideally we'd store the IG conversation ID in metadata)
      const { data: existingConv } = await supabase
        .from("crm_conversations")
        .select("id")
        .eq("customer_id", customerId)
        .eq("platform", "instagram")
        .eq("status", "open") // Assuming open
        .limit(1)
        .single()

      if (existingConv) {
        conversationId = existingConv.id
      } else {
        const { data: newConv, error: convError } = await supabase
          .from("crm_conversations")
          .insert({
            customer_id: customerId,
            platform: "instagram",
            status: "open",
            last_message_at: igConv.updated_time,
            metadata: { instagram_conversation_id: igConv.id }
          })
          .select("id")
          .single()

        if (convError) {
          console.error(`[Instagram Sync] Failed to create conversation:`, convError)
          continue
        }
        conversationId = newConv.id
      }

      // 3. Sync messages (Done earlier to get participant)
      // const messages = await fetchConversationMessages(accessToken, igConv.id)
      
      for (const msg of messages) {
        // Check if message already exists
        const { data: existingMsg } = await supabase
          .from("crm_messages")
          .select("id")
          .eq("external_id", msg.id)
          .single()

        if (existingMsg) continue

        // Check against both Instagram Account ID and Page ID for outbound direction
        const direction = (msg.from.id === instagramAccountId || msg.from.id === pageId) ? "outbound" : "inbound"

        await supabase
          .from("crm_messages")
          .insert({
            conversation_id: conversationId,
            direction,
            content: msg.message,
            external_id: msg.id,
            created_at: msg.created_time, // Use actual message time
            metadata: {
              instagram_message_id: msg.id,
              raw_data: msg
            }
          })
      }
    }

    console.log(`[Instagram Sync] Completed history sync`)
  } catch (error) {
    console.error("[Instagram Sync] Error syncing history:", error)
  }
}
