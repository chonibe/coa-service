import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "/dev/null"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagId } = body

    if (!tagId) {
      return NextResponse.json({ success: false, message: "Tag ID is required" }, { status: 400 })
    }

    // Delete the NFC tag
    const { error } = await supabase.from("nfc_tags").delete().eq("tag_id", tagId)

    if (error) {
      console.error("Error deleting NFC tag:", error)
      return NextResponse.json({ success: false, message: "Failed to delete NFC tag" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "NFC tag deleted successfully",
    })
  } catch (error: any) {
    console.error("Error in delete NFC tag API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
