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
  messages: {
    data: InstagramMessage[]
    paging?: {
      cursors: {
        before: string
        after: string
      }
      next?: string
    }
  }
  participants: {
    data: Array<{
      id: string
      username: string
    }>
  }
  updated_time: string
}

export async function fetchInstagramConversations(
  accessToken: string,
  instagramAccountId: string
) {
  try {
    // Debug: Check token permissions
    console.log("[Instagram Helper] Checking token permissions...")
    const debugResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`
    )
    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      console.log("[Instagram Helper] Token permissions:", JSON.stringify(debugData, null, 2))
      
      // Check for specific required permissions
      const permissions = debugData.data || []
      const required = ["instagram_manage_messages", "pages_manage_metadata"]
      const missing = required.filter(p => !permissions.some((pp: any) => pp.permission === p && pp.status === "granted"))
      
      if (missing.length > 0) {
        console.error("[Instagram Helper] MISSING REQUIRED PERMISSIONS:", missing)
      } else {
        console.log("[Instagram Helper] All required permissions present.")
      }
    } else {
      console.error("[Instagram Helper] Failed to check permissions:", await debugResponse.text())
    }

    console.log(`[Instagram Helper] Fetching conversations for account ${instagramAccountId}`)
    
    // Fetch conversations with messages and participants
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/conversations?platform=instagram&fields=id,updated_time,participants,messages{id,message,created_time,from,to}&access_token=${accessToken}`
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

export async function syncInstagramHistory(
  userId: string,
  accessToken: string,
  instagramAccountId: string
) {
  const supabase = createServiceClient()
  console.log(`[Instagram Sync] Starting history sync for user ${userId}, account ${instagramAccountId}`)

  try {
    const conversations = await fetchInstagramConversations(accessToken, instagramAccountId)
    console.log(`[Instagram Sync] Found ${conversations?.length || 0} conversations`)

    if (!conversations) return

    for (const igConv of conversations) {
      // Find the participant that is NOT the business account
      const participant = igConv.participants.data.find(p => p.id !== instagramAccountId)
      
      if (!participant) {
        console.warn(`[Instagram Sync] No other participant found for conversation ${igConv.id}`)
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

      // 3. Sync messages
      const messages = igConv.messages?.data || []
      console.log(`[Instagram Sync] Syncing ${messages.length} messages for conversation ${igConv.id}`)

      for (const msg of messages) {
        // Check if message already exists
        const { data: existingMsg } = await supabase
          .from("crm_messages")
          .select("id")
          .eq("external_id", msg.id)
          .single()

        if (existingMsg) continue

        const direction = msg.from.id === instagramAccountId ? "outbound" : "inbound"

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
