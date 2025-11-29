import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get all approved/published submissions for this vendor
    const { data: submissions, error: submissionsError } = await supabase
      .from("vendor_product_submissions")
      .select("id, product_data, status, submitted_at")
      .eq("vendor_id", vendor.id)
      .in("status", ["approved", "published"])

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      return NextResponse.json(
        { error: "Failed to fetch artworks", message: submissionsError.message },
        { status: 500 }
      )
    }

    // Get proof print records to check quantities
    const { data: proofPrints, error: proofPrintsError } = await supabase
      .from("vendor_proof_prints")
      .select("submission_id, quantity_ordered")
      .eq("vendor_id", vendor.id)

    if (proofPrintsError) {
      console.error("Error fetching proof prints:", proofPrintsError)
      // Continue without proof print data
    }

    // Create a map of submission_id to quantity_ordered
    const proofPrintMap = new Map<string, number>()
    proofPrints?.forEach((pp) => {
      proofPrintMap.set(pp.submission_id, pp.quantity_ordered)
    })

    // Format artworks with proof print eligibility
    const artworks = (submissions || []).map((submission) => {
      const productData = submission.product_data as any
      const quantityOrdered = proofPrintMap.get(submission.id) || 0
      const canOrderMore = quantityOrdered < 2

      // Extract image URL from product data
      let imageUrl = null
      if (productData.images && productData.images.length > 0) {
        imageUrl = productData.images[0].src || productData.images[0]
      }

      return {
        id: submission.id,
        title: productData.title || "Untitled Artwork",
        imageUrl,
        status: submission.status,
        submittedAt: submission.submitted_at,
        proofPrintsOrdered: quantityOrdered,
        canOrderProofPrint: canOrderMore,
        remainingProofPrints: Math.max(0, 2 - quantityOrdered),
      }
    })

    return NextResponse.json({
      success: true,
      artworks,
    })
  } catch (error: any) {
    console.error("Error fetching artworks:", error)
    return NextResponse.json(
      { error: "Failed to fetch artworks", message: error.message },
      { status: 500 }
    )
  }
}

