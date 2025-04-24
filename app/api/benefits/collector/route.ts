import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lineItemId = searchParams.get("line_item_id")

    if (!lineItemId) {
      return NextResponse.json({ success: false, message: "Line item ID is required" }, { status: 400 })
    }

    // In a real implementation, you would fetch benefits from your database
    // First, get the line item to find the product ID
    const { data: lineItemData, error: lineItemError } = await supabase
      .from("order_line_items")
      .select("product_id, order_id")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError) {
      console.error("Error fetching line item:", lineItemError)
      return NextResponse.json({ success: false, message: "Line item not found" }, { status: 404 })
    }

    // Then, get the benefits for this product
    const { data: benefitsData, error: benefitsError } = await supabase
      .from("product_benefits")
      .select(`
        id,
        title,
        description,
        content_url,
        access_code,
        is_active,
        starts_at,
        expires_at,
        created_at,
        benefit_types (
          id,
          name,
          icon
        )
      `)
      .eq("product_id", lineItemData.product_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (benefitsError) {
      console.error("Error fetching benefits:", benefitsError)
      return NextResponse.json({ success: false, message: "Failed to fetch benefits" }, { status: 500 })
    }

    // Check which benefits have been claimed by this collector
    const { data: claimsData, error: claimsError } = await supabase
      .from("collector_benefit_claims")
      .select("product_benefit_id")
      .eq("line_item_id", lineItemId)

    if (claimsError) {
      console.error("Error fetching claims:", claimsError)
      // Continue without claims data
    }

    const claimedBenefitIds = claimsData ? claimsData.map((claim) => claim.product_benefit_id) : []

    // Format the benefits data
    const benefits = benefitsData.map((benefit) => ({
      id: benefit.id,
      title: benefit.title,
      description: benefit.description,
      contentUrl: benefit.content_url,
      accessCode: benefit.access_code,
      startsAt: benefit.starts_at,
      expiresAt: benefit.expires_at,
      type: benefit.benefit_types.name,
      icon: benefit.benefit_types.icon || benefit.benefit_types.name.toLowerCase().replace(/\s+/g, "-"),
      claimed: claimedBenefitIds.includes(benefit.id),
    }))

    return NextResponse.json({
      success: true,
      benefits,
    })
  } catch (error: any) {
    console.error("Error fetching collector benefits:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch collector benefits" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lineItemId, benefitId } = body

    if (!lineItemId || !benefitId) {
      return NextResponse.json({ success: false, message: "Line item ID and benefit ID are required" }, { status: 400 })
    }

    // Verify the line item exists
    const { data: lineItemData, error: lineItemError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("line_item_id", lineItemId)
      .single()

    if (lineItemError) {
      console.error("Error fetching line item:", lineItemError)
      return NextResponse.json({ success: false, message: "Line item not found" }, { status: 404 })
    }

    // Verify the benefit exists and is active
    const { data: benefitData, error: benefitError } = await supabase
      .from("product_benefits")
      .select("*")
      .eq("id", benefitId)
      .eq("product_id", lineItemData.product_id)
      .eq("is_active", true)
      .single()

    if (benefitError) {
      console.error("Error fetching benefit:", benefitError)
      return NextResponse.json({ success: false, message: "Benefit not found or not active" }, { status: 404 })
    }

    // Check if the benefit has already been claimed
    const { data: existingClaim, error: claimError } = await supabase
      .from("collector_benefit_claims")
      .select("*")
      .eq("line_item_id", lineItemId)
      .eq("product_benefit_id", benefitId)
      .single()

    if (existingClaim) {
      return NextResponse.json({ success: false, message: "Benefit already claimed" }, { status: 400 })
    }

    // Record the claim
    const { data: claimData, error: insertError } = await supabase
      .from("collector_benefit_claims")
      .insert({
        line_item_id: lineItemId,
        product_benefit_id: benefitId,
        claimed_at: new Date().toISOString(),
        status: "active",
      })
      .select()

    if (insertError) {
      console.error("Error recording claim:", insertError)
      return NextResponse.json({ success: false, message: "Failed to claim benefit" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Benefit claimed successfully",
      claim: claimData[0],
    })
  } catch (error: any) {
    console.error("Error claiming benefit:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to claim benefit" }, { status: 500 })
  }
}
