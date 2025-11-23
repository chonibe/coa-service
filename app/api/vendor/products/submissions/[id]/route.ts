import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { ProductSubmissionData } from "@/types/product-submission"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: submission, error } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .eq("vendor_name", vendorName)
      .single()

    if (error || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      submission,
    })
  } catch (error: any) {
    console.error("Error fetching submission:", error)
    return NextResponse.json(
      { error: "Failed to fetch submission", message: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get existing submission to verify ownership and status
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .eq("vendor_name", vendorName)
      .single()

    if (fetchError || !existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      )
    }

    // Only allow editing if status is 'pending' or 'rejected'
    if (existingSubmission.status !== "pending" && existingSubmission.status !== "rejected") {
      return NextResponse.json(
        { error: "Cannot edit submission with status: " + existingSubmission.status },
        { status: 400 },
      )
    }

    const body = await request.json()
    const productData: ProductSubmissionData = body.product_data

    if (!productData) {
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 },
      )
    }

    // Ensure vendor is set correctly
    productData.vendor = vendorName

    // Generate handle if not provided
    if (!productData.handle || productData.handle.trim().length === 0) {
      productData.handle = productData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 255)
    }

    // Add vendor tag if not already present
    if (!productData.tags) {
      productData.tags = []
    }
    if (!productData.tags.includes(vendorName)) {
      productData.tags.push(vendorName)
    }

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("vendor_product_submissions")
      .update({
        product_data: productData as any,
        status: "pending", // Reset to pending after edit
        rejection_reason: null, // Clear rejection reason
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("vendor_name", vendorName)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return NextResponse.json(
        { error: "Failed to update submission", message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating submission:", error)
    return NextResponse.json(
      { error: "Failed to update submission", message: error.message },
      { status: 500 },
    )
  }
}

