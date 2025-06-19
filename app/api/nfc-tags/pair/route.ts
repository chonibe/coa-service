import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface NFCTag {
  id: string
  certificate_id: string | null
}

interface OrderLineItem {
  id: string
  certificate: {
    url: string
  } | null
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get pairing data from request
    const { serialNumber, itemId } = await request.json()
    
    if (!serialNumber || !itemId) {
      return NextResponse.json(
        { error: "Serial number and item ID are required" },
        { status: 400 }
      )
    }

    try {
      // Get or create NFC tag
      const { data: existingTag, error: tagError } = await supabase
        .from("nfc_tags")
        .select("id, certificate_id")
        .eq("serial_number", serialNumber)
        .single<NFCTag>()

      if (tagError && tagError.code !== "PGRST116") { // PGRST116 is "not found"
        throw tagError
      }

      // Check if tag is already paired
      if (existingTag?.certificate_id) {
        throw new Error("This NFC tag is already paired with a certificate")
      }

      let tagId: string

      if (!existingTag) {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from("nfc_tags")
          .insert({ serial_number: serialNumber })
          .select("id")
          .single<{ id: string }>()

        if (createError || !newTag) {
          throw new Error("Failed to create NFC tag")
        }
        
        tagId = newTag.id
      } else {
        tagId = existingTag.id
      }

      // Update the line item with the tag ID
      const { error: updateError } = await supabase
        .from("order_line_items_v2")
        .update({ nfc_tag_id: tagId })
        .eq("id", itemId)

      if (updateError) throw updateError

      // Get the certificate URL
      const { data: item, error: itemError } = await supabase
        .from("order_line_items_v2")
        .select(`
          id,
          certificate:certificates (
            url
          )
        `)
        .eq("id", itemId)
        .single<OrderLineItem>()

      if (itemError || !item) {
        throw new Error("Failed to fetch certificate details")
      }

      return NextResponse.json({
        success: true,
        message: "NFC tag paired successfully",
        certificateUrl: item.certificate?.url
      })
    } catch (error) {
      throw error
    }
  } catch (error) {
    console.error("Error pairing NFC tag:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : "Failed to pair NFC tag"
      },
      { status: 500 }
    )
  }
} 