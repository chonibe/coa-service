import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = params

    // Decode ID to get bucket and path
    const decoded = Buffer.from(id, "base64").toString("utf-8")
    const [bucket, ...pathParts] = decoded.split(":")
    const path = pathParts.join(":")

    // Get file info
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(path.substring(0, path.lastIndexOf("/") + 1), {
        limit: 1,
        search: path.split("/").pop(),
      })

    if (error || !files || files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = files[0]
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    let mediaType: "image" | "video" | "audio" | "pdf" = "image"
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      mediaType = "image"
    } else if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) {
      mediaType = "video"
    } else if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
      mediaType = "audio"
    } else if (ext === "pdf") {
      mediaType = "pdf"
    }

    return NextResponse.json({
      success: true,
      file: {
        id,
        url: urlData.publicUrl,
        path,
        name: file.name,
        created_at: file.created_at || new Date().toISOString(),
        size: file.metadata?.size || 0,
        type: mediaType,
        bucket,
        mime_type: file.metadata?.mimetype,
      },
    })
  } catch (error: any) {
    console.error("Error fetching file details:", error)
    return NextResponse.json(
      { error: "Failed to fetch file details", message: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { id } = params

    // Decode ID to get bucket and path
    const decoded = Buffer.from(id, "base64").toString("utf-8")
    const [bucket, ...pathParts] = decoded.split(":")
    const path = pathParts.join(":")

    // Verify the path belongs to this vendor
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    if (!path.includes(sanitizedVendorName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the file
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error deleting file:", error)
      return NextResponse.json(
        { error: "Failed to delete file", message: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Failed to delete file", message: error.message },
      { status: 500 },
    )
  }
}
