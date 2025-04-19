import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tagIds, prefix, startNumber, count } = body

    // Check if we have either an array of tagIds or prefix+startNumber+count
    if (!tagIds && (!prefix || !startNumber || !count)) {
      return NextResponse.json(
        {
          success: false,
          message: "Either provide an array of tagIds or prefix, startNumber, and count",
        },
        { status: 400 },
      )
    }

    let tagsToCreate: string[] = []

    // If tagIds array is provided, use it
    if (tagIds && Array.isArray(tagIds)) {
      tagsToCreate = tagIds
    }
    // Otherwise generate tag IDs based on prefix, startNumber, and count
    else {
      const start = Number.parseInt(startNumber)
      const numCount = Number.parseInt(count)

      if (isNaN(start) || isNaN(numCount) || numCount <= 0 || numCount > 1000) {
        return NextResponse.json(
          { success: false, message: "Invalid startNumber or count. Count must be between 1 and 1000." },
          { status: 400 },
        )
      }

      // Generate tag IDs with the format prefix-number (e.g., TAG-001, TAG-002)
      for (let i = 0; i < numCount; i++) {
        const num = start + i
        // Pad the number with leading zeros based on count length
        const paddedNum = num.toString().padStart(count.toString().length, "0")
        tagsToCreate.push(`${prefix}-${paddedNum}`)
      }
    }

    // Check for duplicate tag IDs in the database
    const { data: existingTags, error: checkError } = await supabase
      .from("nfc_tags")
      .select("tag_id")
      .in("tag_id", tagsToCreate)

    if (checkError) {
      console.error("Error checking existing tags:", checkError)
      return NextResponse.json({ success: false, message: "Failed to check existing tags" }, { status: 500 })
    }

    // Filter out existing tag IDs
    const existingTagIds = new Set(existingTags?.map((tag) => tag.tag_id) || [])
    const newTagIds = tagsToCreate.filter((tagId) => !existingTagIds.has(tagId))

    if (newTagIds.length === 0) {
      return NextResponse.json({ success: false, message: "All provided tag IDs already exist" }, { status: 400 })
    }

    // Create new NFC tag records
    const tagsToInsert = newTagIds.map((tagId) => ({
      tag_id: tagId,
      status: "unassigned",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("nfc_tags").insert(tagsToInsert).select()

    if (error) {
      console.error("Error creating NFC tags:", error)
      return NextResponse.json({ success: false, message: "Failed to create NFC tags" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      createdCount: data.length,
      skippedCount: tagsToCreate.length - newTagIds.length,
      nfcTags: data,
    })
  } catch (error: any) {
    console.error("Error in bulk create NFC tags API:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}
