import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

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

    // Get tag data from request
    const { serialNumber } = await request.json()
    
    if (!serialNumber) {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      )
    }

    // Check if tag is already paired
    const { data: existingTag, error: dbError } = await supabase
      .from("nfc_tags")
      .select("id, certificate_id")
      .eq("serial_number", serialNumber)
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Failed to validate NFC tag" },
        { status: 500 }
      )
    }

    if (existingTag?.certificate_id) {
      return NextResponse.json(
        { error: "This NFC tag is already paired with a certificate" },
        { status: 400 }
      )
    }

    // If tag exists but isn't paired, return its ID
    // If tag doesn't exist, it's a new tag that can be paired
    return NextResponse.json({
      valid: true,
      tagId: existingTag?.id,
      message: existingTag?.id 
        ? "Tag is available for pairing"
        : "New tag detected and ready for pairing"
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 