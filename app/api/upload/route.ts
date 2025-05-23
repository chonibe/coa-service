import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ message: "Database connection error" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const field = formData.get("field") as string
    const vendorId = formData.get("vendorId") as string

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 })
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${field}-${timestamp}-${file.name}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("signatures")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("signatures")
      .getPublicUrl(filename)

    // If this is a vendor signature, update the vendor record
    if (field === "signature" && vendorId) {
      const { error: updateError } = await supabase
        .from("vendors")
        .update({ signature_url: publicUrl })
        .eq("id", vendorId)

      if (updateError) {
        console.error("Error updating vendor signature:", updateError)
        return NextResponse.json({ message: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ message: error.message || "An error occurred" }, { status: 500 })
  }
} 