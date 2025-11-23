import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import type { ProductSubmissionData } from "@/types/product-submission"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const adminEmail = getAdminEmailFromCookieStore(request.cookies)
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin email not found" }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const body = await request.json()

    // Get existing submission
    const { data: submission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      )
    }

    if (submission.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot approve submission with status: ${submission.status}` },
        { status: 400 },
      )
    }

    // Allow admin to modify product data before approval
    const updatedProductData: ProductSubmissionData = body.product_data || submission.product_data
    const adminNotes = body.admin_notes || submission.admin_notes

    // Update submission to approved
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("vendor_product_submissions")
      .update({
        status: "approved",
        product_data: updatedProductData as any,
        admin_notes: adminNotes,
        approved_at: new Date().toISOString(),
        approved_by: adminEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error approving submission:", updateError)
      return NextResponse.json(
        { error: "Failed to approve submission", message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission approved successfully",
    })
  } catch (error: any) {
    console.error("Error approving submission:", error)
    return NextResponse.json(
      { error: "Failed to approve submission", message: error.message },
      { status: 500 },
    )
  }
}

