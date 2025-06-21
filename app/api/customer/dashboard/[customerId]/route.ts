import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface OrderLineItem {
  id: string
  name: string
  product_id: string
  vendor_id: string
  image_url: string
  nfc_claimed_at?: string
  description?: string
  quantity: number
  price?: number
  img_url?: string
  nfc_tag_id: string | null
  certificate_url: string
  certificate_token?: string
  edition_number?: number | null
  edition_total?: number | null
  vendor_name?: string
  status?: string
  order_id: string
}

interface Customer {
  id: string
}

interface RewardEvent {
  id: string
  customer_id: string
  points: number
  reason: string
  created_at: string
}

interface RewardTier {
  id: string
  name: string
  required_points: number
  benefits: string[]
}

interface CustomerRewards {
  id: string
  customer_id: string
  points: number
  level: string
}

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    if (!supabase) {
      throw new Error("Database connection not available")
    }

    // First, get the customer UUID from the Shopify customer ID
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("shopify_customer_id", params.customerId)
      .single()

    if (customerError) {
      console.error("Customer lookup error:", customerError)
      throw new Error("Customer not found")
    }

    if (!customer) {
      throw new Error("Customer not found")
    }

    // Fetch line items directly from order_line_items_v2
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select(`
        id,
        name,
        product_id,
        vendor_id,
        image_url,
        nfc_claimed_at,
        description,
        quantity,
        price,
        img_url,
        nfc_tag_id,
        certificate_url,
        certificate_token,
        edition_number,
        edition_total,
        vendor_name,
        status,
        order_id
      `)
      .eq("customer_id", (customer as Customer).id)

    if (lineItemsError) {
      throw lineItemsError
    }

    // Fetch rewards data
    const { data: rewardsData, error: rewardsError } = await supabase
      .from("customer_rewards")
      .select("*")
      .eq("customer_id", (customer as Customer).id)
      .single()

    if (rewardsError && rewardsError.code !== "PGRST116") {
      throw rewardsError
    }

    // Fetch recent reward events
    const { data: rewardEvents, error: eventsError } = await supabase
      .from("reward_events")
      .select("*")
      .eq("customer_id", (customer as Customer).id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (eventsError) {
      throw eventsError
    }

    // Get current tier benefits
    const { data: currentTier, error: currentTierError } = await supabase
      .from("reward_tiers")
      .select("*")
      .eq("name", (rewardsData as unknown as CustomerRewards | null)?.level || "bronze")
      .single()

    if (currentTierError) {
      throw currentTierError
    }

    // Get next tier if exists
    const { data: nextTier, error: nextTierError } = await supabase
      .from("reward_tiers")
      .select("*")
      .gt("required_points", (rewardsData as unknown as CustomerRewards | null)?.points || 0)
      .order("required_points", { ascending: true })
      .limit(1)
      .single()

    if (nextTierError && nextTierError.code !== "PGRST116") {
      throw nextTierError
    }

    return NextResponse.json({
      success: true,
      lineItems: lineItems || [],
      rewards: {
        ...rewardsData,
        currentTier,
        nextTier,
        recentEvents: rewardEvents
      }
    })
  } catch (error: any) {
    console.error("Dashboard API Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
} 