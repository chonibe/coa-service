import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
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
    const { data: submission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .eq("vendor_name", vendorName)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    // Only allow deletion of unpublished submissions (pending, rejected)
    if (submission.status === "published" || submission.status === "approved") {
      return NextResponse.json(
        { 
          error: "Cannot delete published or approved submissions",
          message: "Only pending or rejected submissions can be deleted. Contact admin to unpublish approved/published products.",
        },
        { status: 400 },
      )
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from("vendor_product_submissions")
      .delete()
      .eq("id", params.id)
      .eq("vendor_name", vendorName)

    if (deleteError) {
      console.error("Error deleting submission:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete submission", message: deleteError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting submission:", error)
    return NextResponse.json(
      { error: "Failed to delete submission", message: error.message },
      { status: 500 },
    )
  }
}