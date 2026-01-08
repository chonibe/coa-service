import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Instagram Webhook Verification (GET request from Meta)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Require environment variable - fail if not set
  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  
  if (!VERIFY_TOKEN) {
    console.error("[Instagram Webhook] INSTAGRAM_WEBHOOK_VERIFY_TOKEN environment variable is not set")
    return new NextResponse("Webhook verification token not configured", { status: 500 })
  }

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Instagram Webhook] Verification successful")
    return new NextResponse(challenge, { status: 200 })
  }

  console.log("[Instagram Webhook] Verification failed - token mismatch")
  return new NextResponse("Forbidden", { status: 403 })
}

// Instagram Webhook Event Handler (POST request from Meta)
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const body = await request.json()
    console.log("[Instagram Webhook] Received event:", JSON.stringify(body, null, 2))

    // Instagram webhook structure
    // https://developers.facebook.com/docs/instagram-platform/webhooks
    const entry = body.entry?.[0]
    const messaging = entry?.messaging?.[0]

    if (!messaging) {
      console.log("[Instagram Webhook] No messaging data in webhook")
      return NextResponse.json({ success: true })
    }

    const senderId = messaging.sender?.id
    const recipientId = messaging.recipient?.id
    const message = messaging.message
    const timestamp = messaging.timestamp

    if (!message || !senderId) {
      console.log("[Instagram Webhook] No message or sender ID")
      return NextResponse.json({ success: true })
    }

    const messageText = message.text || ""
    const messageId = message.mid

    console.log(`[Instagram Webhook] Processing message from ${senderId}: ${messageText}`)

    // Find or create customer by Instagram ID
    let { data: customer } = await supabase
      .from("crm_customers")
      .select("*")
      .eq("instagram_id", senderId)
      .single()

    if (!customer) {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from("crm_customers")
        .insert({
          instagram_id: senderId,
          instagram_username: senderId, // We'll update this if we get username from API
        })
        .select()
        .single()

      if (customerError) {
        console.error("[Instagram Webhook] Error creating customer:", customerError)
        throw customerError
      }

      customer = newCustomer
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("crm_conversations")
      .select("*")
      .eq("customer_id", customer.id)
      .eq("platform", "instagram")
      .single()

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from("crm_conversations")
        .insert({
          customer_id: customer.id,
          platform: "instagram",
          status: "open",
        })
        .select()
        .single()

      if (convError) {
        console.error("[Instagram Webhook] Error creating conversation:", convError)
        throw convError
      }

      conversation = newConversation
    }

    // Save message
    const { error: messageError } = await supabase
      .from("crm_messages")
      .insert({
        conversation_id: conversation.id,
        direction: "inbound",
        content: messageText,
        external_id: messageId,
        metadata: {
          sender_id: senderId,
          recipient_id: recipientId,
          timestamp,
          raw_message: message,
        },
      })

    if (messageError) {
      console.error("[Instagram Webhook] Error saving message:", messageError)
      throw messageError
    }

    console.log(`[Instagram Webhook] Successfully processed message from ${senderId}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Instagram Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

