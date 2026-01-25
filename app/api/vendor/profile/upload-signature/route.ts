import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
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

    // Validate file type - prefer PNG with transparency
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
    const fileExt = file.name.split(".").pop() || "png"
    const fileName = `${timestamp}_signature.${fileExt}`
    const filePath = `vendor-signatures/${sanitizedVendorName}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage (vendor-signatures bucket)
    // Note: Ensure the bucket exists in Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-signatures")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow updating existing signatures
      })

    if (uploadError) {
      console.error("Error uploading signature:", uploadError)
      
      // Provide helpful error message if bucket doesn't exist
      if (uploadError.message?.includes("Bucket not found") || uploadError.statusCode === "404") {
        return NextResponse.json(
          { 
            error: "Storage bucket not found", 
            message: "The 'vendor-signatures' storage bucket has not been created. Please create it in Supabase Dashboard > Storage. See docs/STORAGE_BUCKETS_SETUP.md for instructions.",
            code: "BUCKET_NOT_FOUND"
          },
          { status: 404 },
        )
      }
      
      return NextResponse.json(
        { error: "Failed to upload signature", message: uploadError.message },
        { status: 500 },
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-signatures").getPublicUrl(filePath)

    // Update vendor record with signature URL and timestamp
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        signature_url: publicUrl,
        signature_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendor.id)

    if (updateError) {
      console.error("Error updating vendor signature:", updateError)
      // Still return success with URL, but log the error
      console.warn("Signature uploaded but vendor record update failed")
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error("Error uploading signature:", error)
    return NextResponse.json(
      { error: "Failed to upload signature", message: error.message },
      { status: 500 },
    )
  }
}

// DELETE endpoint to remove signature
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, signature_url")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (!vendor.signature_url) {
      return NextResponse.json({ error: "No signature to delete" }, { status: 400 })
    }

    // Extract file path from URL
    const url = new URL(vendor.signature_url)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.findIndex((part) => part === "vendor-signatures")
    if (bucketIndex === -1) {
      return NextResponse.json({ error: "Invalid signature URL" }, { status: 400 })
    }
    const filePath = pathParts.slice(bucketIndex).join("/")

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from("vendor-signatures")
      .remove([filePath])

    if (deleteError) {
      console.error("Error deleting signature from storage:", deleteError)
      // Continue to update vendor record even if storage delete fails
    }

    // Update vendor record
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        signature_url: null,
        signature_uploaded_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendor.id)

    if (updateError) {
      console.error("Error updating vendor record:", updateError)
      return NextResponse.json(
        { error: "Failed to remove signature", message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting signature:", error)
    return NextResponse.json(
      { error: "Failed to delete signature", message: error.message },
      { status: 500 },
    )
  }
}
