import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId } = params
    const body = (await request.json()) as {
      updates?: Array<{ id: number; display_order: number }>
      blockOrders?: Array<{ id: number; display_order: number }>
    }
    const updates = body.updates ?? body.blockOrders

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid updates array" }, { status: 400 })
    }

    // Check if productId is a UUID (submission ID) or a product ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)

    if (isUUID) {
      // Handle submission-based reordering
      const { data: submission, error: submissionError } = await supabase
        .from("vendor_product_submissions")
        .select("product_data, vendor_name")
        .eq("id", productId)
        .eq("vendor_name", vendorName)
        .single()

      if (submissionError || !submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      const productData = submission.product_data as any
      const benefits = productData?.benefits || []

      // Update display_order for each benefit (match by id; support number / string / temp- ids)
      const updatedBenefits = benefits.map((benefit: any) => {
        const update = updates.find((u) => {
          if (benefit.id === undefined || benefit.id === null) return false
          if (u.id === benefit.id) return true
          if (typeof benefit.id === "number" && !Number.isNaN(Number(u.id))) {
            return benefit.id === Number(u.id)
          }
          const bStr = typeof benefit.id === "string" ? benefit.id.replace(/^temp-/, "") : String(benefit.id)
          const uStr = String(u.id).replace(/^temp-/, "")
          return bStr === uStr
        })
        if (update) {
          return { ...benefit, display_order: update.display_order }
        }
        return benefit
      })

      // Save back to database
      const { error: updateError } = await supabase
        .from("vendor_product_submissions")
        .update({
          product_data: {
            ...productData,
            benefits: updatedBenefits
          }
        })
        .eq("id", productId)

      if (updateError) {
        console.error("Error updating submission order:", updateError)
        return NextResponse.json(
          { error: "Failed to update order", message: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    } else {
      // Handle product-based reordering
      // Batch update display_order for all blocks
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("product_benefits")
          .update({ display_order: update.display_order })
          .eq("id", update.id)
          .eq("vendor_name", vendorName)

        if (updateError) {
          console.error(`Error updating block ${update.id} order:`, updateError)
          // Continue with other updates even if one fails
        }
      }

      return NextResponse.json({ success: true })
    }
  } catch (error: any) {
    console.error("Reorder error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}
