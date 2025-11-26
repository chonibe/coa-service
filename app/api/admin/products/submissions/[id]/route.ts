import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const { data: submission, error } = await supabase
      .from("vendor_product_submissions")
      .select(
        `
        *,
        vendors:vendor_id (
          id,
          vendor_name,
          contact_email,
          contact_name,
          status
        )
      `,
      )
      .eq("id", params.id)
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

export async function DELETE(
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

    // Get existing submission to check status
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

    // Warn if published (but still allow deletion)
    if (submission.status === "published" && submission.shopify_product_id) {
      console.warn(
        `Deleting published submission ${params.id} with Shopify product ID ${submission.shopify_product_id}`
      )
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from("vendor_product_submissions")
      .delete()
      .eq("id", params.id)

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

