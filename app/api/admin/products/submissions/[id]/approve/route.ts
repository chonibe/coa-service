import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import type { ProductSubmissionData } from "@/types/product-submission"
import { reserveFirstEdition } from "@/lib/first-edition-reserve"

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

    // Reserve first edition if feature is enabled
    const enableFirstEditionReserve = process.env.ENABLE_FIRST_EDITION_RESERVE !== "false"
    let reserveResult = null

    if (enableFirstEditionReserve) {
      try {
        const productData = updatedProductData as any
        const price = parseFloat(productData.price || productData.variants?.[0]?.price || "0")
        const productName = productData.title || productData.name || "Artwork"
        const productId = submission.shopify_product_id || `submission-${submission.id}`

        // Only reserve if price is valid and greater than 0
        if (price > 0) {
          reserveResult = await reserveFirstEdition(
            productId,
            submission.vendor_name,
            price,
            {
              name: productName,
              description: productData.description || productData.body_html || null,
              img_url: productData.images?.[0]?.src || productData.image_url || null,
              image_url: productData.images?.[0]?.src || productData.image_url || null,
            },
            supabase
          )

          if (reserveResult.success) {
            console.log("First edition reserved:", reserveResult.message)
          } else {
            console.warn("First edition reserve failed:", reserveResult.message)
          }
        } else {
          console.warn("Skipping first edition reserve: invalid price", price)
        }
      } catch (error: any) {
        console.error("Error reserving first edition:", error)
        // Don't fail approval if reserve fails
        reserveResult = {
          success: false,
          message: error.message || "Failed to reserve first edition",
        }
      }
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission approved successfully",
      firstEditionReserve: reserveResult,
    })
  } catch (error: any) {
    console.error("Error approving submission:", error)
    return NextResponse.json(
      { error: "Failed to approve submission", message: error.message },
      { status: 500 },
    )
  }
}

