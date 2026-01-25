import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

interface MediaItem {
  id: string
  url: string
  path: string
  name: string
  created_at: string
  size: number
  type: "image" | "video" | "audio" | "pdf"
  bucket: string
  mime_type?: string
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    
    // Get query params
    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get("type") as "image" | "video" | "audio" | "pdf" | null
    const search = searchParams.get("search")?.toLowerCase() || ""
    const sort = searchParams.get("sort") || "date_desc" // date_desc, date_asc, name_asc, name_desc, size_desc, size_asc
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Folder paths to check
    const folderPaths = [
      { path: `product_submissions/${sanitizedVendorName}/`, bucket: "product-images" },
      { path: `content_library/${sanitizedVendorName}/`, bucket: "product-images" },
      { path: `vendor_profiles/${sanitizedVendorName}/`, bucket: "product-images" },
      { path: `series_covers/${sanitizedVendorName}/`, bucket: "product-images" },
      { path: `${sanitizedVendorName}/`, bucket: "print-files" },
      { path: `${sanitizedVendorName}/`, bucket: "vendor-signatures" },
    ]

    const allMedia: MediaItem[] = []

    // Fetch from all locations
    for (const { path: folderPath, bucket } of folderPaths) {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list(folderPath, {
          limit: 1000,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        })

      if (error && !error.message?.includes("not found")) {
        console.error(`Error listing files from ${bucket}/${folderPath}:`, error)
        continue
      }

      if (files) {
        files.forEach((file) => {
          const ext = file.name.split(".").pop()?.toLowerCase() || ""
          const filePath = `${folderPath}${file.name}`
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

          let mediaType: "image" | "video" | "audio" | "pdf" | null = null
          
          // Determine media type
          if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
            mediaType = "image"
          } else if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) {
            mediaType = "video"
          } else if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
            mediaType = "audio"
          } else if (ext === "pdf") {
            mediaType = "pdf"
          }

          if (!mediaType) return // Skip unknown types

          // Generate unique ID from path
          const id = Buffer.from(`${bucket}:${filePath}`).toString("base64")

          allMedia.push({
            id,
            url: urlData.publicUrl,
            path: filePath,
            name: file.name,
            created_at: file.created_at || new Date().toISOString(),
            size: file.metadata?.size || 0,
            type: mediaType,
            bucket,
            mime_type: file.metadata?.mimetype,
          })
        })
      }
    }

    // Apply filters
    let filteredMedia = allMedia

    // Filter by type
    if (filterType) {
      filteredMedia = filteredMedia.filter((item) => item.type === filterType)
    }

    // Filter by search
    if (search) {
      filteredMedia = filteredMedia.filter((item) => 
        item.name.toLowerCase().includes(search)
      )
    }

    // Sort
    switch (sort) {
      case "date_asc":
        filteredMedia.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "date_desc":
        filteredMedia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "name_asc":
        filteredMedia.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name_desc":
        filteredMedia.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "size_asc":
        filteredMedia.sort((a, b) => a.size - b.size)
        break
      case "size_desc":
        filteredMedia.sort((a, b) => b.size - a.size)
        break
    }

    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMedia = filteredMedia.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      media: paginatedMedia,
      total: filteredMedia.length,
      page,
      limit,
      totalPages: Math.ceil(filteredMedia.length / limit),
    })
  } catch (error: any) {
    console.error("Error fetching media library:", error)
    return NextResponse.json(
      { error: "Failed to fetch media library", message: error.message },
      { status: 500 },
    )
  }
}
