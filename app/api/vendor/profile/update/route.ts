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

    const serviceClient = createClient()

    // Get vendor
    const { data: vendor, error: vendorError } = await serviceClient
      .from("vendors")
      .select("id, vendor_name, status")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    if (vendor.status !== "active") {
      return NextResponse.json({ error: "Vendor account inactive" }, { status: 403 })
    }

    const body = await request.json()

    // Prepare update data (only include fields that are provided)
    // Note: profile_image and artist_history may not exist if migration hasn't been run
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that exist in the database schema
    // Skip profile_image and artist_history if they don't exist (migration not run)
    if (body.bio !== undefined) {
      updateData.bio = body.bio
    }

    if (body.instagram_url !== undefined) {
      updateData.instagram_url = body.instagram_url
    }

    // Conditionally include profile_image and artist_history
    // These fields require the migration to be run first
    if (body.profile_image !== undefined) {
      updateData.profile_image = body.profile_image
    }

    if (body.artist_history !== undefined && body.artist_history !== "") {
      updateData.artist_history = body.artist_history
    }

    console.log("Updating vendor profile:", { vendorId: vendor.id, updateData })

    // Update vendor profile
    let updatedVendor: any = null
    let updateError: any = null
    
    const updateResult = await serviceClient
      .from("vendors")
      .update(updateData)
      .eq("id", vendor.id)
      .select()
      .single()
    
    updatedVendor = updateResult.data
    updateError = updateResult.error

    // If update failed due to missing columns (PGRST204), retry without those columns
    if (updateError && updateError.code === "PGRST204") {
      console.warn("Column not found error detected. Retrying without optional fields:", updateError.message)
      
      // Check which column is missing from the error message
      const missingColumns: string[] = []
      if (updateError.message?.includes("profile_image")) {
        missingColumns.push("profile_image")
      }
      if (updateError.message?.includes("artist_history")) {
        missingColumns.push("artist_history")
      }
      
      // Remove fields that don't exist in the database
      const safeUpdateData: Record<string, any> = {
        updated_at: updateData.updated_at,
      }
      
      if (updateData.bio !== undefined) {
        safeUpdateData.bio = updateData.bio
      }
      
      if (updateData.instagram_url !== undefined) {
        safeUpdateData.instagram_url = updateData.instagram_url
      }
      
      // Only include profile_image and artist_history if they're not in the missing columns list
      if (updateData.profile_image !== undefined && !missingColumns.includes("profile_image")) {
        safeUpdateData.profile_image = updateData.profile_image
      }
      
      if (updateData.artist_history !== undefined && !missingColumns.includes("artist_history")) {
        safeUpdateData.artist_history = updateData.artist_history
      }

      // Retry with only safe fields
      const retryResult = await serviceClient
        .from("vendors")
        .update(safeUpdateData)
        .eq("id", vendor.id)
        .select()
        .single()
      
      updatedVendor = retryResult.data
      updateError = retryResult.error
      
      if (!updateError) {
        console.log("Update succeeded after removing optional fields")
        // If profile_image was requested but couldn't be saved, return an error
        if (missingColumns.includes("profile_image") && body.profile_image !== undefined) {
          return NextResponse.json({
            error: "Profile image column does not exist",
            message: "The profile_image column doesn't exist in the database. Please run the migration: supabase/migrations/20250128000000_add_vendor_profile_fields.sql",
            details: "The database migration to add profile_image and artist_history columns has not been run.",
          }, { status: 400 })
        }
        
        // Return a warning that some fields couldn't be saved
        const warningMsg = missingColumns.length > 0
          ? `Some fields (${missingColumns.join(", ")}) couldn't be saved because the database columns don't exist. Please run the migration in supabase/migrations/20250128000000_add_vendor_profile_fields.sql`
          : "Update completed, but some optional fields may not have been saved."
        
        return NextResponse.json({
          success: true,
          vendor: updatedVendor,
          warning: warningMsg,
        }, { status: 200 })
      }
    }

    if (updateError) {
      console.error("Error updating vendor profile:", {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        updateData,
      })
      return NextResponse.json(
        {
          error: "Failed to update profile",
          message: updateError.message || "Database update failed",
          details: updateError.details,
          hint: updateError.hint,
        },
        { status: 500 },
      )
    }

    if (!updatedVendor) {
      console.error("No vendor returned after update")
      return NextResponse.json(
        { error: "Failed to update profile", message: "No data returned after update" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
    })
  } catch (error: any) {
    console.error("Error updating vendor profile:", {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: "Failed to update profile",
        message: error?.message || "An unexpected error occurred",
        details: error?.details || error?.code,
      },
      { status: 500 },
    )
  }
}

