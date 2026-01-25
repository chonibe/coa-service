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
    const file = formData.get("file") as File
    const type = formData.get("type") as string // image, video, audio, pdf

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isAudio = file.type.startsWith("audio/")
    const isPDF = file.type === "application/pdf"

    if (!isImage && !isVideo && !isAudio && !isPDF) {
      return NextResponse.json(
        { error: "Invalid file type. Only images, videos, audio, and PDFs are supported" },
        { status: 400 },
      )
    }

    // Validate file size
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB
    const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB

    let maxSize = MAX_IMAGE_SIZE
    if (isVideo) maxSize = MAX_VIDEO_SIZE
    if (isAudio) maxSize = MAX_AUDIO_SIZE
    if (isPDF) maxSize = MAX_PDF_SIZE

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
        },
        { status: 400 },
      )
    }

    const supabase = createClient()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    
    // Determine bucket and path
    let bucket = "product-images"
    let folderPath = `content_library/${sanitizedVendorName}`

    if (isPDF) {
      bucket = "print-files"
      folderPath = sanitizedVendorName
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split(".").pop() || "bin"
    const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_")
    const fileName = `${timestamp}_${safeName}`
    const filePath = `${folderPath}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Error uploading file:", error)
      return NextResponse.json(
        { error: "Failed to upload file", message: error.message },
        { status: 500 },
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    // Generate ID
    const id = Buffer.from(`${bucket}:${data.path}`).toString("base64")

    let mediaType: "image" | "video" | "audio" | "pdf" = "image"
    if (isVideo) mediaType = "video"
    if (isAudio) mediaType = "audio"
    if (isPDF) mediaType = "pdf"

    return NextResponse.json({
      success: true,
      file: {
        id,
        url: urlData.publicUrl,
        path: data.path,
        name: fileName,
        type: mediaType,
        size: file.size,
        mime_type: file.type,
      },
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file", message: error.message },
      { status: 500 },
    )
  }
}
