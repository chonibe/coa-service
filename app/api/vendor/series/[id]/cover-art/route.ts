import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function POST(
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

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const seriesId = params.id

    // Verify series belongs to vendor
    const { data: existingSeries, error: checkError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (checkError || !existingSeries) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Get the uploaded file
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error: any) {
      if (error.message?.includes("413") || error.message?.includes("too large")) {
        return NextResponse.json({ 
          error: "File too large", 
          message: "File size must be less than 5MB. Please compress your image before uploading." 
        }, { status: 413 })
      }
      throw error
    }
    
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB - reduced from 10MB to avoid 413 errors)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size must be less than 5MB", 
        message: "Please compress your image before uploading. Maximum file size is 5MB." 
      }, { status: 400 })
    }

    // Generate file path
    const timestamp = Date.now()
    const sanitizedVendorName = vendor.vendor_name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const fileExtension = file.name.split(".").pop() || "jpg"
    const fileName = `series_${seriesId}_${timestamp}.${fileExtension}`
    const filePath = `series_covers/${sanitizedVendorName}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading cover art:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload cover art", message: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath)

    // Update series with cover art URL
    const { error: updateError } = await supabase
      .from("artwork_series")
      .update({ thumbnail_url: urlData.publicUrl })
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)

    if (updateError) {
      console.error("Error updating series cover art:", updateError)
      return NextResponse.json({ error: "Failed to update series" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error("Error uploading cover art:", error)
    return NextResponse.json(
      { error: "Failed to upload cover art", message: error.message },
      { status: 500 }
    )
  }
}

