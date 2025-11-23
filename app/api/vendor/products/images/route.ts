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
    const folderPath = `product_submissions/${sanitizedVendorName}/`

    // List all images in the vendor's folder
    const { data: files, error } = await supabase.storage
      .from("product-images")
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      })

    if (error) {
      console.error("Error listing images:", error)
      return NextResponse.json(
        { error: "Failed to fetch images", message: error.message },
        { status: 500 },
      )
    }

    // Filter for image files and get public URLs
    const images = files
      ?.filter((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase()
        return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")
      })
      .map((file) => {
        const filePath = `${folderPath}${file.name}`
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath)

        return {
          url: urlData.publicUrl,
          path: filePath,
          name: file.name,
          created_at: file.created_at,
          size: file.metadata?.size || 0,
        }
      }) || []

    return NextResponse.json({
      success: true,
      images,
    })
  } catch (error: any) {
    console.error("Error fetching vendor images:", error)
    return NextResponse.json(
      { error: "Failed to fetch images", message: error.message },
      { status: 500 },
    )
  }
}

