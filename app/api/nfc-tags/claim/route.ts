import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"  // Add zod for validation
import { rewardCreditsForNfcScan } from "@/lib/banking/credit-reward"
import { checkAndRewardSeriesCompletion } from "@/lib/gamification/series"

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
  const supabase = createClient()
  
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

    // Get the line item to validate edition number exists
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, edition_number, status")
      .eq("line_item_id", lineItemId)
      .eq("order_id", orderId)
      .maybeSingle()

    if (lineItemError) {
      await logNfcTagAction("line_item_lookup_failed", {
        tagId,
        lineItemId,
        orderId,
        error: lineItemError.message
      })
      return NextResponse.json({ success: false, message: "Failed to find line item" }, { status: 500 })
    }

    if (!lineItem) {
      return NextResponse.json({ success: false, message: "Line item not found" }, { status: 404 })
    }

    // Validate that edition number exists before claiming
    if (!lineItem.edition_number) {
      await logNfcTagAction("claim_failed_no_edition", {
        tagId,
        lineItemId,
        orderId
      })
      return NextResponse.json(
        { success: false, message: "Cannot claim NFC tag: edition number not assigned" },
        { status: 400 }
      )
    }

    // Validate that item is active
    if (lineItem.status !== 'active') {
      await logNfcTagAction("claim_failed_inactive", {
        tagId,
        lineItemId,
        orderId,
        status: lineItem.status
      })
      return NextResponse.json(
        { success: false, message: "Cannot claim NFC tag: item is not active" },
        { status: 400 }
      )
    }

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

    // Validate certificate exists (already fetched in lineItem above)
    if (!lineItem.certificate_url) {
      await logNfcTagAction("certificate_not_found", {
        lineItemId,
        orderId
      })
      return NextResponse.json(
        { success: false, message: "Certificate not found for the provided line item and order" },
        { status: 404 },
      )
    }

    // Use certificate data from lineItem
    const certificate = {
      certificate_url: lineItem.certificate_url,
      certificate_token: lineItem.certificate_token,
      name: lineItem.name,
      product_id: lineItem.product_id,
      submission_id: lineItem.submission_id,
      series_id: lineItem.series_id,
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
    // The trigger will automatically log the nfc_authenticated event
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

    let seriesUnlocked = false

    // Attempt to unlock series member if the series uses NFC unlocks
    try {
      const productId = (certificate as any)?.product_id as string | undefined
      const submissionId = (certificate as any)?.submission_id as string | undefined
      const seriesId = (certificate as any)?.series_id as string | undefined

      if (productId || submissionId || seriesId) {
        const orFilters = [
          productId ? `shopify_product_id.eq.${productId}` : null,
          submissionId ? `submission_id.eq.${submissionId}` : null,
          seriesId ? `series_id.eq.${seriesId}` : null,
        ]
          .filter(Boolean)
          .join(",")

        if (orFilters.length > 0) {
          const { data: member, error: memberError } = await supabase
            .from("artwork_series_members")
            .select("id, series_id, is_locked, unlocked_at")
            .or(orFilters)
            .limit(1)
            .maybeSingle()

          if (!memberError && member?.series_id) {
            const { data: series } = await supabase
              .from("artwork_series")
              .select("id, unlock_type")
              .eq("id", member.series_id)
              .maybeSingle()

            if (series?.unlock_type === "nfc") {
              const { error: unlockError } = await supabase
                .from("artwork_series_members")
                .update({
                  is_locked: false,
                  unlocked_at: new Date().toISOString(),
                })
                .eq("id", member.id)

              if (!unlockError) {
                seriesUnlocked = true
              }
            }
          }
        }
      }
    } catch (unlockError) {
      console.error("Series unlock attempt failed:", unlockError)
    }

    // Log successful claim
    await logNfcTagAction("tag_claimed_successfully", {
      tagId,
      lineItemId,
      orderId,
      artworkName: certificate.name
    })

    // --- Ink-O-Gatchi Gamification: Reward Credits for NFC Scan ---
    let rewardResult = null
    let seriesRewardResult = null
    try {
      // Find the collector identifier (email or customer ID)
      const { data: liData } = await supabase
        .from("order_line_items_v2")
        .select("owner_email, owner_id, series_id")
        .eq("line_item_id", lineItemId)
        .eq("order_id", orderId)
        .single()

      const identifier = liData?.owner_id || liData?.owner_email || customerId
      const email = liData?.owner_email || (customerId?.includes('@') ? customerId : null)

      if (identifier) {
        rewardResult = await rewardCreditsForNfcScan(
          identifier,
          tagId,
          lineItemId,
          orderId
        )

        // Check for series completion reward
        if (liData?.series_id && liData?.owner_id && email) {
          seriesRewardResult = await checkAndRewardSeriesCompletion(
            liData.owner_id,
            email,
            liData.series_id
          )
        }
      }
    } catch (rewardError) {
      console.error("Failed to reward credits for NFC scan:", rewardError)
    }

    return NextResponse.json({
      success: true,
      nfcTag: data[0],
      artworkName: certificate.name,
      seriesUnlocked,
      reward: rewardResult,
      seriesReward: seriesRewardResult,
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
