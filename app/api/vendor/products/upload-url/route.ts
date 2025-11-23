import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, fileType } = body

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

    // Generate file path
    const timestamp = Date.now()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const sanitizedFileName = `${timestamp}_${fileName.replace(/[^a-z0-9.]/gi, "_")}`
    const filePath = `product_submissions/${sanitizedVendorName}/${sanitizedFileName}`

    // Determine bucket
    const bucket = fileType === "pdf" ? "print-files" : "product-images"

    return NextResponse.json({
      success: true,
      path: filePath,
      bucket,
      fileName: sanitizedFileName,
    })
  } catch (error: any) {
    console.error("Error generating upload path:", error)
    return NextResponse.json(
      { error: "Failed to generate upload path", message: error.message },
      { status: 500 },
    )
  }
}

