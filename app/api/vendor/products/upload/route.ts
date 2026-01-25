import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// Maximum file size: 10MB for images, 50MB for PDFs and videos, 20MB for audio
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  console.log(`[${uploadId}] Upload request started at ${new Date().toISOString()}`)
  
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      console.error(`[${uploadId}] Authentication failed: No vendor name`)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log(`[${uploadId}] Authenticated vendor: ${vendorName}`)

    const formDataStart = Date.now()
    const formData = await request.formData()
    console.log(`[${uploadId}] FormData parsed in ${Date.now() - formDataStart}ms`)

    const file = formData.get("file") as File | null
    const fileType = formData.get("type") as string | null // 'image', 'pdf', 'video'

    if (!file) {
      console.error(`[${uploadId}] No file provided`)
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`[${uploadId}] File received: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type}`)

    // Validate file size
    let maxSize = MAX_IMAGE_SIZE
    if (fileType === "pdf") maxSize = MAX_PDF_SIZE
    else if (fileType === "video") maxSize = MAX_VIDEO_SIZE
    
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      console.error(`[${uploadId}] File size validation failed: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${maxSizeMB}MB`)
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` },
        { status: 400 },
      )
    }

    // Validate file type
    if (fileType === "image" && !file.type.startsWith("image/")) {
      console.error(`[${uploadId}] Invalid file type: expected image, got ${file.type}`)
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }
    if (fileType === "pdf" && file.type !== "application/pdf") {
      console.error(`[${uploadId}] Invalid file type: expected PDF, got ${file.type}`)
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 })
    }
    if (fileType === "video" && !file.type.startsWith("video/")) {
      console.error(`[${uploadId}] Invalid file type: expected video, got ${file.type}`)
      return NextResponse.json({ error: "File must be a video" }, { status: 400 })
    }

    console.log(`[${uploadId}] File validation passed, initializing Supabase client...`)
    const supabase = createClient()
    console.log(`[${uploadId}] Supabase client initialized`)

    // Generate file path: vendor_name/content_library/timestamp_filename
    // This makes files available in the content library for reuse
    const timestamp = Date.now()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${timestamp}_${file.name.replace(/[^a-z0-9.]/gi, "_")}`
    // Store in content_library folder for easy access via content library feature
    const filePath = `content_library/${sanitizedVendorName}/${fileName}`

    // Determine bucket based on file type (videos and audio go to product-images bucket)
    const bucket = fileType === "pdf" ? "print-files" : "product-images"

    console.log(`[${uploadId}] Uploading to bucket: ${bucket}, path: ${filePath}`)
    console.log(`[${uploadId}] File size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    const uploadStartTime = Date.now()

    // Convert File to ArrayBuffer for better handling
    console.log(`[${uploadId}] Converting file to ArrayBuffer...`)
    const arrayBufferStart = Date.now()
    const arrayBuffer = await file.arrayBuffer()
    console.log(`[${uploadId}] File converted to ArrayBuffer in ${Date.now() - arrayBufferStart}ms`)

    // Upload file directly to Supabase Storage
    console.log(`[${uploadId}] Starting Supabase storage upload...`)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      })

    const uploadDuration = Date.now() - uploadStartTime
    console.log(`[${uploadId}] Upload completed in ${uploadDuration}ms (${(uploadDuration / 1000).toFixed(2)}s)`)

    if (uploadError) {
      console.error(`[${uploadId}] Supabase upload error:`, {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
      })
      // Handle specific error cases
      if (uploadError.message.includes("duplicate") || uploadError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "File with this name already exists. Please rename your file." },
          { status: 409 },
        )
      }
      return NextResponse.json(
        { error: "Failed to upload file", message: uploadError.message, uploadId },
        { status: 500 },
      )
    }

    console.log(`[${uploadId}] Upload successful, getting public URL...`)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    const totalDuration = Date.now() - startTime

    console.log(`[${uploadId}] Upload completed successfully in ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    console.log(`[${uploadId}] Public URL: ${urlData.publicUrl}`)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadId,
      duration: totalDuration,
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`[${uploadId}] Error in file upload API (after ${totalDuration}ms):`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      error: error,
    })
    
    // Handle timeout errors specifically
    if (error.message?.includes("timeout") || error.name === "AbortError") {
      return NextResponse.json(
        { 
          error: "Upload timed out. Please try a smaller file or check your connection.",
          uploadId,
          duration: totalDuration,
        },
        { status: 408 },
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to upload file", 
        message: error.message || "Unknown error occurred",
        uploadId,
        duration: totalDuration,
      },
      { status: 500 },
    )
  }
}

