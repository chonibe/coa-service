import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 },
      )
    }

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedVendorName = vendor.vendor_name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const fileExt = file.name.split(".").pop()
    const fileName = `${timestamp}_profile.${fileExt}`
    const filePath = `vendor_profiles/${sanitizedVendorName}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage (product-images bucket for profile images)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow updating existing profile images
      })

    if (uploadError) {
      console.error("Error uploading profile image:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload image", message: uploadError.message },
        { status: 500 },
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json(
      { error: "Failed to upload image", message: error.message },
      { status: 500 },
    )
  }
}

