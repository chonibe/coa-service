import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileType = formData.get("type") as string | null // 'image', 'pdf'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const supabase = createClient()

    // Generate file path: vendor_name/product_submissions/timestamp_filename
    const timestamp = Date.now()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}_${file.name.replace(/[^a-z0-9.]/gi, "_")}`
    const filePath = `product_submissions/${sanitizedVendorName}/${fileName}`

    // Determine bucket based on file type
    const bucket = fileType === "pdf" ? "print-files" : "product-images"

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file", message: uploadError.message },
        { status: 500 },
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error: any) {
    console.error("Error in file upload API:", error)
    return NextResponse.json(
      { error: "Failed to upload file", message: error.message },
      { status: 500 },
    )
  }
}

