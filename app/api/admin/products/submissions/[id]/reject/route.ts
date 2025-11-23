import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"

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
    const rejectionReason = body.reason || body.rejection_reason || "No reason provided"

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

    if (submission.status === "published") {
      return NextResponse.json(
        { error: "Cannot reject a published submission" },
        { status: 400 },
      )
    }

    // Update submission to rejected
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("vendor_product_submissions")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        admin_notes: `Rejected by ${adminEmail} on ${new Date().toISOString()}. ${rejectionReason}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error rejecting submission:", updateError)
      return NextResponse.json(
        { error: "Failed to reject submission", message: updateError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission rejected",
    })
  } catch (error: any) {
    console.error("Error rejecting submission:", error)
    return NextResponse.json(
      { error: "Failed to reject submission", message: error.message },
      { status: 500 },
    )
  }
}

