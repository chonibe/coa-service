import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagId, status, notes } = body

    if (!tagId || !status) {
      return NextResponse.json({ success: false, message: "Tag ID and status are required" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["unassigned", "assigned", "programmed", "deployed", "lost", "damaged"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 },
      )
    }

    // Check if the tag exists
    const { data: existingTag, error: tagError } = await supabase
      .from("nfc_tags")
      .select("*")
      .eq("tag_id", tagId)
      .maybeSingle()

    if (tagError) {
      console.error("Error checking tag:", tagError)
      return NextResponse.json({ success: false, message: "Failed to check tag" }, { status: 500 })
    }

    if (!existingTag) {
      return NextResponse.json({ success: false, message: "Tag not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // If status is programmed, set programmed_at timestamp
    if (status === "programmed" && existingTag.status !== "programmed") {
      updateData.programmed_at = new Date().toISOString()
    }

    // Update the NFC tag status
    const { data, error } = await supabase.from("nfc_tags").update(updateData).eq("tag_id", tagId).select()

    if (error) {
      console.error("Error updating NFC tag status:", error)
      return NextResponse.json({ success: false, message: "Failed to update NFC tag status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      nfcTag: data[0],
    })
  } catch (error: any) {
    console.error("Error in update NFC tag status API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
