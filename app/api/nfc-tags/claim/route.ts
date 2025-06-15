import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { z } from "zod"  // Add zod for validation

// Input validation schema
const NfcClaimSchema = z.object({
  tagId: z.string().min(1, "Tag ID is required"),
  lineItemId: z.string().min(1, "Line Item ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  customerId: z.string().optional()
})

// Audit logging function
async function logNfcTagAction(action: string, details: Record<string, any>) {
  const { error } = await supabase
    .from("nfc_tag_audit_log")
    .insert({
      action,
      details: JSON.stringify(details),
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error("Audit Log Error:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await request.json()
    const validationResult = NfcClaimSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(", ")
      
      // Log validation failure
      await logNfcTagAction("claim_validation_failed", {
        errors: errorMessages,
        input: body
      })

      return NextResponse.json(
        { success: false, message: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const { tagId, lineItemId, orderId, customerId } = validationResult.data

    // Check if the tag exists
    const { data: existingTag, error: tagError } = await supabase
      .from("nfc_tags")
      .select("*")
      .eq("tag_id", tagId)
      .maybeSingle()

    if (tagError) {
      await logNfcTagAction("tag_lookup_failed", {
        tagId,
        error: tagError.message
      })
      return NextResponse.json({ success: false, message: "Failed to check tag" }, { status: 500 })
    }

    // If tag doesn't exist, create it
    if (!existingTag) {
      const { error: createError } = await supabase.from("nfc_tags").insert({
        tag_id: tagId,
        status: "unassigned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createError) {
        await logNfcTagAction("tag_creation_failed", {
          tagId,
          error: createError.message
        })
        return NextResponse.json({ success: false, message: "Failed to create tag" }, { status: 500 })
      }

      await logNfcTagAction("tag_created", { tagId })
    } else if (existingTag.status === "claimed" && existingTag.line_item_id) {
      // Check if tag is already claimed
      await logNfcTagAction("tag_already_claimed", { 
        tagId, 
        existingLineItemId: existingTag.line_item_id 
      })
      return NextResponse.json({ success: false, message: "This NFC tag has already been claimed" }, { status: 400 })
    }

    // Check if the certificate exists
    const { data: certificate, error: certError } = await supabase
      .from("order_line_items_v2")
      .select("certificate_url, certificate_token, name")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .maybeSingle()

    if (certError) {
      await logNfcTagAction("certificate_lookup_failed", {
        lineItemId,
        orderId,
        error: certError.message
      })
      return NextResponse.json({ success: false, message: "Failed to check certificate" }, { status: 500 })
    }

    if (!certificate || !certificate.certificate_url) {
      await logNfcTagAction("certificate_not_found", {
        lineItemId,
        orderId
      })
      return NextResponse.json(
        { success: false, message: "Certificate not found for the provided line item and order" },
        { status: 404 },
      )
    }

    // Update the NFC tag with the certificate information
    const { data, error } = await supabase
      .from("nfc_tags")
      .update({
        line_item_id: lineItemId,
        order_id: orderId,
        customer_id: customerId,
        certificate_url: certificate.certificate_url,
        status: "claimed",
        updated_at: new Date().toISOString(),
        claimed_at: new Date().toISOString(),
      })
      .eq("tag_id", tagId)
      .select()

    if (error) {
      await logNfcTagAction("tag_claim_failed", {
        tagId,
        lineItemId,
        orderId,
        error: error.message
      })
      return NextResponse.json({ success: false, message: "Failed to claim NFC tag" }, { status: 500 })
    }

    // Also update the order_line_items_v2 table to mark this certificate as claimed
    const { error: updateError } = await supabase
      .from("order_line_items_v2")
      .update({
        nfc_tag_id: tagId,
        nfc_claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)

    if (updateError) {
      await logNfcTagAction("line_item_update_failed", {
        tagId,
        lineItemId,
        orderId,
        error: updateError.message
      })
      // Continue anyway since the tag was successfully claimed
    }

    // Log successful claim
    await logNfcTagAction("tag_claimed_successfully", {
      tagId,
      lineItemId,
      orderId,
      artworkName: certificate.name
    })

    return NextResponse.json({
      success: true,
      nfcTag: data[0],
      artworkName: certificate.name
    })
  } catch (error: any) {
    console.error("Error in claim NFC tag API:", error)
    
    // Log unexpected errors
    await logNfcTagAction("unexpected_error", {
      message: error.message,
      stack: error.stack
    })

    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
