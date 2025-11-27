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

    // If approved or published, unpublish from Shopify and reset to rejected status so vendor can see it
    // Otherwise, delete the submission completely
    if (submission.status === "approved" || submission.status === "published") {
      // Unpublish from Shopify if it has a product ID
      if (submission.shopify_product_id) {
        try {
          const { deleteShopifyProduct } = await import("@/lib/shopify/product-creation")
          const deleted = await deleteShopifyProduct(submission.shopify_product_id)
          if (deleted) {
            console.log(`Unpublished product ${submission.shopify_product_id} from Shopify`)
          } else {
            console.warn(`Failed to unpublish product ${submission.shopify_product_id} from Shopify`)
            // Continue anyway - we'll still update the submission status
          }
        } catch (error) {
          console.error("Error unpublishing from Shopify:", error)
          // Continue anyway
        }
      }

      // Update submission to rejected status and clear all published/approved fields
      const updateData: any = {
        status: "rejected",
        shopify_product_id: null,
        published_at: null,
        approved_at: null,
        approved_by: null,
        rejection_reason: `Removed by admin (${adminEmail}). Product unpublished from Shopify.`,
        admin_notes: submission.admin_notes 
          ? `${submission.admin_notes}\n\nRemoved by admin ${adminEmail} on ${new Date().toISOString()}.`
          : `Removed by admin ${adminEmail} on ${new Date().toISOString()}.`,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from("vendor_product_submissions")
        .update(updateData)
        .eq("id", params.id)

      if (updateError) {
        console.error("Error updating submission status:", updateError)
        return NextResponse.json(
          { error: "Failed to update submission", message: updateError.message },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Product unpublished and status reset to rejected. Vendor can now see it in their submissions.",
      })
    } else {
      // For pending/rejected, delete completely
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
    }
  } catch (error: any) {
    console.error("Error deleting submission:", error)
    return NextResponse.json(
      { error: "Failed to delete submission", message: error.message },
      { status: 500 },
    )
  }
}

