import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseKey('service')
    )

    const body = await request.json()
    const { product_benefit_id, line_item_id, customer_email } = body

    // Validate required fields
    if (!product_benefit_id || !line_item_id) {
      return NextResponse.json({ error: "Product benefit ID and line item ID are required" }, { status: 400 })
    }

    // Check if the benefit exists and is active
    const { data: benefit, error: benefitError } = await supabase
      .from("product_benefits")
      .select("*")
      .eq("id", product_benefit_id)
      .eq("is_active", true)
      .single()

    if (benefitError) {
      if (benefitError.code === "PGRST116") {
        return NextResponse.json({ error: "Benefit not found or not active" }, { status: 404 })
      }
      throw benefitError
    }

    // Check if the line item exists and has a certificate
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("line_item_id", line_item_id)
      .eq("status", "active")
      .single()

    if (lineItemError) {
      if (lineItemError.code === "PGRST116") {
        return NextResponse.json({ error: "Line item not found or not active" }, { status: 404 })
      }
      throw lineItemError
    }

    // Check if the line item's product matches the benefit's product
    if (lineItem.product_id !== benefit.product_id) {
      return NextResponse.json(
        { error: "This benefit is not available for the product in this line item" },
        { status: 400 },
      )
    }

    // Check if this benefit has already been claimed for this line item
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from("collector_benefit_claims")
      .select("*")
      .eq("product_benefit_id", product_benefit_id)
      .eq("line_item_id", line_item_id)
      .single()

    if (claimCheckError && claimCheckError.code !== "PGRST116") {
      throw claimCheckError
    }

    if (existingClaim) {
      return NextResponse.json(
        { error: "This benefit has already been claimed for this line item", claim: existingClaim },
        { status: 409 },
      )
    }

    // Generate a unique claim code
    const claimCode = crypto.randomUUID()

    // Create the claim
    const { data: claim, error: claimError } = await supabase
      .from("collector_benefit_claims")
      .insert({
        product_benefit_id,
        line_item_id,
        customer_email,
        claimed_at: new Date().toISOString(),
        claim_code: claimCode,
        status: "active",
      })
      .select()

    if (claimError) {
      throw claimError
    }

    return NextResponse.json({ success: true, claim: claim[0] })
  } catch (error: any) {
    console.error("Error claiming benefit:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
