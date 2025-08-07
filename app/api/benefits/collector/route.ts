import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const lineItemId = searchParams.get("line_item_id")
    const customerEmail = searchParams.get("customer_email")

    if (!lineItemId && !customerEmail) {
      return NextResponse.json({ error: "Either line_item_id or customer_email is required" }, { status: 400 })
    }

    // First, if line_item_id is provided, get the product_id
    let productId: string | null = null

    if (lineItemId) {
      const { data: lineItem, error: lineItemError } = await supabase
        .from("order_line_items")
        .select("product_id")
        .eq("line_item_id", lineItemId)
        .single()

      if (lineItemError) {
        if (lineItemError.code === "PGRST116") {
          return NextResponse.json({ error: "Line item not found" }, { status: 404 })
        }
        throw lineItemError
      }

      productId = lineItem.product_id
    }

    // Get the claims made by this collector
    let claimsQuery = supabase.from("collector_benefit_claims").select(`
        *,
        product_benefits (
          *,
          benefit_types (name, icon)
        )
      `)

    if (lineItemId) {
      claimsQuery = claimsQuery.eq("line_item_id", lineItemId)
    }

    if (customerEmail) {
      claimsQuery = claimsQuery.eq("customer_email", customerEmail)
    }

    const { data: claims, error: claimsError } = await claimsQuery

    if (claimsError) {
      throw claimsError
    }

    // Get unclaimed benefits for the product (if line_item_id was provided)
    let unclaimedBenefits: any[] = []

    if (productId) {
      // Get all benefits for this product
      const { data: allBenefits, error: benefitsError } = await supabase
        .from("product_benefits")
        .select(`
          *,
          benefit_types (name, icon)
        `)
        .eq("product_id", productId)
        .eq("is_active", true)

      if (benefitsError) {
        throw benefitsError
      }

      // Filter out already claimed benefits
      const claimedBenefitIds = claims.map((claim) => claim.product_benefit_id)
      unclaimedBenefits = allBenefits.filter((benefit) => !claimedBenefitIds.includes(benefit.id))
    }

    return NextResponse.json({
      claimed: claims,
      unclaimed: unclaimedBenefits,
    })
  } catch (error: any) {
    console.error("Error fetching collector benefits:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
