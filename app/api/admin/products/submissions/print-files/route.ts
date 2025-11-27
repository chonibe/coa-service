import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()
    const { searchParams } = request.nextUrl
    const sortBy = searchParams.get("sortBy") || "submitted_at" // submitted_at, vendor_name, product_title
    const sortOrder = searchParams.get("sortOrder") || "desc" // asc, desc

    // Fetch all submissions
    const { data: submissions, error } = await supabase
      .from("vendor_product_submissions")
      .select(
        `
        id,
        vendor_name,
        submitted_at,
        status,
        product_data,
        shopify_product_id
      `,
      )
      .order("submitted_at", { ascending: sortOrder === "asc" })

    if (error) {
      console.error("Error fetching PDF files:", error)
      return NextResponse.json(
        { error: "Failed to fetch PDF files", message: error.message },
        { status: 500 },
      )
    }

    // Process submissions to extract PDF information
    const pdfFiles = (submissions || [])
      .map((submission) => {
        const productData = submission.product_data as any
        const printFiles = productData?.print_files as any
        const pdfUrl = printFiles?.pdf_url

        if (!pdfUrl) return null

        return {
          id: submission.id,
          submissionId: submission.id,
          vendorName: submission.vendor_name,
          productTitle: productData?.title || "Untitled Product",
          pdfUrl: pdfUrl,
          submittedAt: submission.submitted_at,
          status: submission.status,
          shopifyProductId: submission.shopify_product_id,
        }
      })
      .filter((item) => item !== null)

    // Sort by the requested field
    pdfFiles.sort((a, b) => {
      if (!a || !b) return 0

      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "vendor_name":
          aValue = a.vendorName.toLowerCase()
          bValue = b.vendorName.toLowerCase()
          break
        case "product_title":
          aValue = a.productTitle.toLowerCase()
          bValue = b.productTitle.toLowerCase()
          break
        case "submitted_at":
        default:
          aValue = new Date(a.submittedAt).getTime()
          bValue = new Date(b.submittedAt).getTime()
          break
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return NextResponse.json({
      success: true,
      pdfFiles: pdfFiles,
      total: pdfFiles.length,
    })
  } catch (error: any) {
    console.error("Error fetching PDF files:", error)
    return NextResponse.json(
      { error: "Failed to fetch PDF files", message: error.message },
      { status: 500 },
    )
  }
}

