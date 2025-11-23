import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  const uploadId = `signed-url-${Date.now()}-${Math.random().toString(36).substring(7)}`
  console.log(`[${uploadId}] Signed URL request started at ${new Date().toISOString()}`)

  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      console.error(`[${uploadId}] Authentication failed: No vendor name`)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`[${uploadId}] Authenticated vendor: ${vendorName}`)

    const body = await request.json()
    const { fileName, fileType, fileSize } = body

    if (!fileName || !fileType) {
      console.error(`[${uploadId}] Missing required fields: fileName=${fileName}, fileType=${fileType}`)
      return NextResponse.json({ error: "File name and type are required" }, { status: 400 })
    }

    console.log(`[${uploadId}] Request: fileName=${fileName}, fileType=${fileType}, fileSize=${fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)}MB` : 'unknown'}`)

    // Validate file type
    if (fileType === "image" && !fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      console.error(`[${uploadId}] Invalid image file type: ${fileName}`)
      return NextResponse.json({ error: "Invalid image file type" }, { status: 400 })
    }
    if (fileType === "pdf" && !fileName.match(/\.pdf$/i)) {
      console.error(`[${uploadId}] Invalid PDF file type: ${fileName}`)
      return NextResponse.json({ error: "Invalid PDF file type" }, { status: 400 })
    }

    // Validate file size
    const maxSize = fileType === "pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
    if (fileSize && fileSize > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      console.error(`[${uploadId}] File size exceeds limit: ${(fileSize / 1024 / 1024).toFixed(2)}MB > ${maxSizeMB}MB`)
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` },
        { status: 400 },
      )
    }

    // Generate file path
    const timestamp = Date.now()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const sanitizedFileName = `${timestamp}_${fileName.replace(/[^a-z0-9.]/gi, "_")}`
    const filePath = `product_submissions/${sanitizedVendorName}/${sanitizedFileName}`

    // Determine bucket
    const bucket = fileType === "pdf" ? "print-files" : "product-images"

    // Note: We don't need to create a signed URL - the client will upload directly
    // using the Supabase client with the anon key. We just need to return the path
    // and bucket so the client knows where to upload.
    console.log(`[${uploadId}] Returning upload path for direct client upload`)

    return NextResponse.json({
      success: true,
      path: filePath,
      bucket,
      fileName: sanitizedFileName,
      uploadId,
    })
  } catch (error: any) {
    console.error(`[${uploadId}] Error in signed URL API:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error: error,
    })
    return NextResponse.json(
      { error: "Failed to create upload URL", message: error.message || "Unknown error occurred", uploadId },
      { status: 500 },
    )
  }
}

