import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    
    // Check multiple possible folder paths where content might be stored
    const folderPaths = [
      `product_submissions/${sanitizedVendorName}/`,
      `content_library/${sanitizedVendorName}/`,
    ]

    const allMedia: Array<{
      url: string
      path: string
      name: string
      created_at: string
      size: number
      type: "image" | "video" | "audio"
    }> = []

    // Fetch from product-images bucket (images, videos, audio)
    for (const folderPath of folderPaths) {
      const { data: files, error } = await supabase.storage
        .from("product-images")
        .list(folderPath, {
          limit: 500,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        })

      if (error && error.message?.includes("not found")) {
        // Folder doesn't exist, skip it
        continue
      }

      if (error) {
        console.error(`Error listing files from ${folderPath}:`, error)
        continue
      }

      if (files) {
        files.forEach((file) => {
          const ext = file.name.split(".").pop()?.toLowerCase() || ""
          const filePath = `${folderPath}${file.name}`
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath)

          let mediaType: "image" | "video" | "audio" = "image"
          
          // Determine media type
          if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
            mediaType = "image"
          } else if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) {
            mediaType = "video"
          } else if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
            mediaType = "audio"
          } else {
            // Skip unknown file types
            return
          }

          allMedia.push({
            url: urlData.publicUrl,
            path: filePath,
            name: file.name,
            created_at: file.created_at || new Date().toISOString(),
            size: file.metadata?.size || 0,
            type: mediaType,
          })
        })
      }
    }

    // Sort by created_at descending (newest first)
    allMedia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Filter by type if requested
    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get("type") as "image" | "video" | "audio" | null

    const filteredMedia = filterType
      ? allMedia.filter((item) => item.type === filterType)
      : allMedia

    return NextResponse.json({
      success: true,
      media: filteredMedia,
      total: filteredMedia.length,
    })
  } catch (error: any) {
    console.error("Error fetching content library:", error)
    return NextResponse.json(
      { error: "Failed to fetch content library", message: error.message },
      { status: 500 },
    )
  }
}
