import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
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

