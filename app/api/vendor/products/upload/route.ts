import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// Maximum file size: 10MB for images, 50MB for PDFs
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB

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

    // Validate file size
    const maxSize = fileType === "pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` },
        { status: 400 },
      )
    }

    // Validate file type
    if (fileType === "image" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }
    if (fileType === "pdf" && file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
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

    // Upload file to Supabase Storage with timeout handling
    const uploadPromise = supabase.storage.from(bucket).upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

    // Set a timeout for the upload (4 minutes to be safe)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timeout - file may be too large")), 240000)
    })

    const { data: uploadData, error: uploadError } = await Promise.race([
      uploadPromise,
      timeoutPromise,
    ]) as Awaited<ReturnType<typeof uploadPromise>>

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      // Handle specific error cases
      if (uploadError.message.includes("duplicate") || uploadError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "File with this name already exists. Please rename your file." },
          { status: 409 },
        )
      }
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
    // Handle timeout errors specifically
    if (error.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Upload timed out. Please try a smaller file or check your connection." },
        { status: 408 },
      )
    }
    return NextResponse.json(
      { error: "Failed to upload file", message: error.message || "Unknown error occurred" },
      { status: 500 },
    )
  }
}

