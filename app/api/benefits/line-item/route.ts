import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lineItemId = searchParams.get("line_item_id")

    if (!lineItemId) {
      return NextResponse.json({ error: "Line item ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get the line item details first to check NFC status
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items")
      .select("product_id, nfc_tag_id, nfc_claimed_at")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError) {
      throw lineItemError
    }

    // Get all benefits for this product
    const { data: benefits, error: benefitsError } = await supabase
      .from("product_benefits")
      .select(`
        *,
        benefit_types (name, icon)
      `)
      .eq("product_id", lineItem.product_id)
      .eq("is_active", true)

    if (benefitsError) {
      throw benefitsError
    }

    // Filter benefits based on NFC status
    const isNfcPaired = lineItem.nfc_tag_id && lineItem.nfc_claimed_at
    const filteredBenefits = benefits.map(benefit => ({
      ...benefit,
      is_locked: benefit.requires_nfc && !isNfcPaired
    }))

    // Get already claimed benefits
    const { data: claims, error: claimsError } = await supabase
      .from("collector_benefit_claims")
      .select("product_benefit_id, claimed_at, status")
      .eq("line_item_id", lineItemId)

    if (claimsError) {
      throw claimsError
    }

    // Combine benefits with claim status
    const benefitsWithClaims = filteredBenefits.map(benefit => ({
      ...benefit,
      claim_status: claims?.find(claim => claim.product_benefit_id === benefit.id)?.status || "unclaimed",
      claimed_at: claims?.find(claim => claim.product_benefit_id === benefit.id)?.claimed_at || null
    }))

    return NextResponse.json({
      benefits: benefitsWithClaims,
      nfc_status: {
        has_nfc: !!lineItem.nfc_tag_id,
        is_paired: isNfcPaired
      }
    })
  } catch (error: any) {
    console.error("Error fetching line item benefits:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
} 