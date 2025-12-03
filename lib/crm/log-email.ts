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

    // Find customer by email
    let { data: customer } = await supabase
      .from("crm_customers")
      .select("*")
      .eq("email", customerEmail)
      .single()

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
        return
      }

      customer = newCustomer
    }

    // Find or create email conversation
    let { data: conversation } = await supabase
      .from("crm_conversations")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("platform", "email")
      .single()

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
        return
      }

      conversation = newConversation
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
      return
    }

    console.log(`[CRM] Successfully logged email to ${customerEmail}`)
  } catch (error: any) {
    console.error("[CRM] Error logging email:", error)
  }
}

