import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * WhatsApp Webhook Handler
 * Receives incoming WhatsApp messages via webhook
 */

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    
    // WhatsApp webhook payload structure varies by provider
    // This is a generic handler - adjust based on your WhatsApp Business API provider
    const { from, to, message, timestamp } = body

    if (!from || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find or create customer by WhatsApp phone number
    let { data: customer } = await supabase
      .from("crm_customers")
      .select("id")
      .eq("whatsapp_phone", from)
      .single()

    if (!customer) {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from("crm_customers")
        .insert({
          whatsapp_phone: from,
          metadata: {
            whatsapp_id: from,
            source: "whatsapp_webhook",
          },
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      customer = newCustomer

      // Create contact identifier
      await supabase.from("crm_contact_identifiers").insert({
        customer_id: customer.id,
        identifier_type: "phone",
        identifier_value: from,
        platform: "whatsapp",
        is_primary: true,
      })
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("crm_conversations")
      .select("id")
      .eq("customer_id", customer.id)
      .eq("platform", "whatsapp")
      .single()

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from("crm_conversations")
        .insert({
          customer_id: customer.id,
          platform: "whatsapp",
          status: "open",
        })
        .select()
        .single()

      if (convError) {
        throw convError
      }

      conversation = newConversation
    }

    // Create message
    const messageContent = message.text || message.body || JSON.stringify(message)
    
    await supabase.from("crm_messages").insert({
      conversation_id: conversation.id,
      direction: "inbound",
      content: messageContent,
      external_id: message.id || `${from}-${timestamp}`,
      metadata: {
        from,
        to,
        timestamp,
        raw_message: message,
      },
    })

    // Create activity
    await supabase.from("crm_activities").insert({
      activity_type: "whatsapp_message",
      title: "WhatsApp message received",
      description: messageContent,
      customer_id: customer.id,
      conversation_id: conversation.id,
      platform: "whatsapp",
    })

    return NextResponse.json({
      success: true,
      message: "WhatsApp message processed",
    })
  } catch (error: any) {
    console.error("[CRM] Error processing WhatsApp webhook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Webhook verification (for WhatsApp Business API)
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Verify webhook (adjust verification token based on your setup)
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === "subscribe" && token === verifyToken) {
    return NextResponse.json(challenge, { status: 200 })
  }

  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  )
}

