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

    const body = await request.json()
    const { fileName, fileType, fileSize } = body

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "File name and type are required" }, { status: 400 })
    }

    // Validate file type
    if (fileType === "image" && !fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return NextResponse.json({ error: "Invalid image file type" }, { status: 400 })
    }
    if (fileType === "pdf" && !fileName.match(/\.pdf$/i)) {
      return NextResponse.json({ error: "Invalid PDF file type" }, { status: 400 })
    }

    // Validate file size
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB
    const maxSize = fileType === "pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
    if (fileSize && fileSize > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
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

    const supabase = createClient()

    // Create a signed upload URL that allows the client to upload directly
    // The signed URL is valid for 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath)

    if (signedUrlError) {
      console.error("Error creating signed upload URL:", signedUrlError)
      // If signed URLs don't work, fall back to returning the path for direct upload
      return NextResponse.json({
        success: true,
        path: filePath,
        bucket,
        fileName: sanitizedFileName,
        useDirectUpload: true, // Flag to indicate client should upload directly
      })
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      bucket,
      fileName: sanitizedFileName,
      signedUrl: signedUrlData?.signedUrl,
      token: signedUrlData?.token,
    })
  } catch (error: any) {
    console.error("Error generating upload path:", error)
    return NextResponse.json(
      { error: "Failed to generate upload path", message: error.message },
      { status: 500 },
    )
  }
}

