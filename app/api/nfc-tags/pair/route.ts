import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateCertificateUrl } from "@/lib/certificate"
import type { Database } from "@/types/supabase"

interface PairingRequest {
  nfc_tag_id: string;
  line_item_id: string;
}

export async function POST(request: NextRequest) {
  let requestBody: PairingRequest | null = null;
  
  try {
    requestBody = await request.json()
    const { nfc_tag_id, line_item_id } = requestBody

    if (!nfc_tag_id || !line_item_id) {
      return NextResponse.json(
        { success: false, message: "NFC tag ID and line item ID are required" },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Start pairing process
    const { data: tag, error: updateError } = await supabase
      .from("nfc_tags")
      .update({
        pairing_status: "pairing_in_progress",
        pairing_attempted_at: new Date().toISOString(),
        line_item_id: line_item_id
      })
      .eq("id", nfc_tag_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating NFC tag:", updateError)
      return NextResponse.json(
        { success: false, message: "Failed to initiate pairing" },
        { status: 500 }
      )
    }

    // Generate certificate URL
    const certificateUrl = await generateCertificateUrl(line_item_id)

    // Complete pairing
    const { error: completionError } = await supabase
      .from("nfc_tags")
      .update({
        pairing_status: "paired",
        pairing_completed_at: new Date().toISOString(),
        certificate_url: certificateUrl
      })
      .eq("id", nfc_tag_id)

    if (completionError) {
      console.error("Error completing pairing:", completionError)
      return NextResponse.json(
        { success: false, message: "Failed to complete pairing" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      certificate_url: certificateUrl,
      pairing_status: "paired"
    })
  } catch (error: any) {
    console.error("Error in NFC pairing:", error)
    
    // Create Supabase client for error handling
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Update tag with error status if we have the tag ID
    if (requestBody?.nfc_tag_id) {
      await supabase
        .from("nfc_tags")
        .update({
          pairing_status: "pairing_failed",
          pairing_error: error.message
        })
        .eq("id", requestBody.nfc_tag_id)
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to pair NFC tag" },
      { status: 500 }
    )
  }
} 