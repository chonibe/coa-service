import { createClient } from "@/lib/supabase/server"

interface LogEmailParams {
  customerEmail: string
  subject: string
  content: string
  direction?: "inbound" | "outbound"
  externalId?: string
  metadata?: Record<string, any>
}

/**
 * Log an email message to the CRM system
 * This should be called whenever an email is sent or received
 */
export async function logEmail({
  customerEmail,
  subject,
  content,
  direction = "outbound",
  externalId,
  metadata,
}: LogEmailParams) {
  const supabase = createClient()

  try {
    if (!supabase) {
      console.error("[CRM] Database client not initialized")
      return
    }

    // Find customer by email (use maybeSingle to handle 0 or 1 results)
    let { data: customer, error: customerQueryError } = await supabase
      .from("crm_customers")
      .select("*")
      .eq("email", customerEmail)
      .maybeSingle()

    if (customerQueryError) {
      console.error("[CRM] Error querying customer:", customerQueryError)
      throw customerQueryError
    }

    // If customer doesn't exist, create one
    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("crm_customers")
        .insert({
          email: customerEmail,
        })
        .select()
        .single()

      if (customerError) {
        console.error("[CRM] Error creating customer:", customerError)
        throw customerError
      }

      customer = newCustomer
      console.log(`[CRM] Created new customer: ${customerEmail}`)
    }

    // Find or create email conversation (use maybeSingle to handle 0 or 1 results)
    let { data: conversation, error: convQueryError } = await supabase
      .from("crm_conversations")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("platform", "email")
      .maybeSingle()

    if (convQueryError) {
      console.error("[CRM] Error querying conversation:", convQueryError)
      throw convQueryError
    }

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from("crm_conversations")
        .insert({
          customer_id: customer.id,
          platform: "email",
          status: "open",
        })
        .select()
        .single()

      if (convError) {
        console.error("[CRM] Error creating conversation:", convError)
        throw convError
      }

      conversation = newConversation
      console.log(`[CRM] Created new conversation for customer: ${customerEmail}`)
    }

    // Check if message already exists (by external_id to avoid duplicates)
    if (externalId) {
      const { data: existingMessage } = await supabase
        .from("crm_messages")
        .select("id")
        .eq("external_id", externalId)
        .maybeSingle()

      if (existingMessage) {
        console.log(`[CRM] Email with external_id ${externalId} already exists, skipping`)
        return
      }
    }

    // Save email message
    const fullContent = `Subject: ${subject}\n\n${content}`

    const { error: messageError } = await supabase
      .from("crm_messages")
      .insert({
        conversation_id: conversation.id,
        direction,
        content: fullContent,
        external_id: externalId,
        metadata: {
          subject,
          ...metadata,
        },
      })

    if (messageError) {
      console.error("[CRM] Error saving email message:", messageError)
      throw messageError
    }

    // Update conversation's last_message_at
    await supabase
      .from("crm_conversations")
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id)

    console.log(`[CRM] Successfully logged email to ${customerEmail} (${direction})`)
  } catch (error: any) {
    console.error("[CRM] Error logging email:", error)
    // Re-throw so sync function can track errors
    throw error
  }
}

