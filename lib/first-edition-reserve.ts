/**
 * First Edition Reserve Service
 * Automatically reserves edition #1 of approved artworks for choni@thestreetlamp.com.
 * Only pays the artist payout (25% commission), not the full product price.
 */

import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const RESERVE_EMAIL = "choni@thestreetlamp.com"
const PAYOUT_PERCENTAGE = 25 // 25% commission for artists

export interface ReserveResult {
  success: boolean
  reserveId?: string
  orderId?: string
  lineItemId?: number
  message: string
  error?: string
}

export interface FirstEditionReserve {
  id: string
  product_id: string
  vendor_name: string
  order_id: string
  line_item_id: string
  reserved_at: string
  reserved_by: string
  purchase_price: number
  payout_amount: number
  status: "reserved" | "fulfilled" | "cancelled"
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Calculate payout amount (25% of price)
 */
export function calculateReservePayout(price: number): number {
  return (price * PAYOUT_PERCENTAGE) / 100
}

/**
 * Get or create collector profile for reserve email
 */
async function getOrCreateCollectorProfile(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<{ user_id: string | null; profile_id: string | null }> {
  // First, try to find auth user by email
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  let userId: string | null = authUser?.id || null

  // Check if collector profile exists
  const { data: existingProfile } = await supabase
    .from("collector_profiles")
    .select("id, user_id")
    .eq("email", email.toLowerCase())
    .maybeSingle()

  if (existingProfile) {
    return {
      user_id: existingProfile.user_id || userId,
      profile_id: existingProfile.id,
    }
  }

  // Create collector profile if user exists but profile doesn't
  if (userId) {
    const { data: newProfile, error } = await supabase
      .from("collector_profiles")
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        first_name: "Street",
        last_name: "Collector",
        bio: "Internal collection for first editions",
      })
      .select("id")
      .single()

    if (error && !error.message.includes("duplicate")) {
      console.error("Error creating collector profile:", error)
    }

    return {
      user_id: userId,
      profile_id: newProfile?.id || null,
    }
  }

  return { user_id: null, profile_id: null }
}

/**
 * Create internal order for first edition reserve
 * Note: We only pay the artist payout (25%), not the full product price
 */
async function createReserveOrder(
  supabase: SupabaseClient<Database>,
  productId: string,
  price: number,
  payoutAmount: number,
  productName: string,
  vendorName: string
): Promise<{ orderId: string; orderNumber: string }> {
  const timestamp = Date.now()
  const orderId = `FER-${productId}-${timestamp}`
  const orderNumber = `FER-${timestamp}`

  const orderData = {
    id: orderId,
    order_number: orderNumber,
    order_name: orderNumber,
    processed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    total_price: payoutAmount, // Only pay the artist payout (25%), not full price
    currency_code: "USD",
    customer_email: RESERVE_EMAIL.toLowerCase(),
    source: "internal_reserve",
    raw_shopify_order_data: {
      source: "first_edition_reserve",
      product_id: productId,
      product_name: productName,
      vendor_name: vendorName,
      product_price: price, // Full product price for reference
      payout_amount: payoutAmount, // Actual amount paid (25%)
      reserved_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("orders").insert(orderData)

  if (error) {
    throw new Error(`Failed to create reserve order: ${error.message}`)
  }

  return { orderId, orderNumber }
}

/**
 * Create line item with edition #1
 */
async function createReserveLineItem(
  supabase: SupabaseClient<Database>,
  orderId: string,
  orderNumber: string,
  productId: string,
  productName: string,
  vendorName: string,
  price: number,
  userId: string | null,
  productData?: any
): Promise<number> {
  const lineItemId = `FER-${productId}-${Date.now()}`

  const lineItemData: any = {
    order_id: orderId,
    order_name: orderNumber,
    line_item_id: lineItemId,
    product_id: productId,
    name: productName,
    description: productData?.description || productName,
    price: price,
    quantity: 1,
    vendor_name: vendorName,
    fulfillment_status: "fulfilled",
    status: "active",
    edition_number: 1, // Always edition #1 for reserves
    owner_email: RESERVE_EMAIL.toLowerCase(),
    owner_name: "Street Collector",
    owner_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Add product image if available
  if (productData?.img_url || productData?.image_url) {
    lineItemData.img_url = productData.img_url || productData.image_url
  }

  const { data, error } = await supabase
    .from("order_line_items_v2")
    .insert(lineItemData)
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to create reserve line item: ${error.message}`)
  }

  return data.id
}

/**
 * Record reserve in first_edition_reserves table
 */
async function recordReserve(
  supabase: SupabaseClient<Database>,
  reserveData: {
    productId: string
    vendorName: string
    orderId: string
    lineItemId: number
    price: number
    payoutAmount: number
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("first_edition_reserves")
    .insert({
      product_id: reserveData.productId,
      vendor_name: reserveData.vendorName,
      order_id: reserveData.orderId,
      line_item_id: reserveData.lineItemId.toString(),
      purchase_price: reserveData.price,
      payout_amount: reserveData.payoutAmount,
      status: "fulfilled",
      metadata: {
        auto_reserved: true,
        reserved_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(`Failed to record reserve: ${error.message}`)
  }

  return data.id
}

/**
 * Update product flags
 */
async function updateProductFlags(
  supabase: SupabaseClient<Database>,
  productId: string,
  orderId: string
): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({
      first_edition_reserved: true,
      first_edition_order_id: orderId,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId)

  if (error) {
    // Try with id column if product_id doesn't work
    const { error: error2 } = await supabase
      .from("products")
      .update({
        first_edition_reserved: true,
        first_edition_order_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (error2) {
      console.error("Failed to update product flags:", error2)
      // Don't throw - this is not critical
    }
  }
}

/**
 * Main function to reserve first edition
 */
export async function reserveFirstEdition(
  productId: string,
  vendorName: string,
  price: number,
  productData?: {
    name?: string
    description?: string
    img_url?: string
    image_url?: string
  },
  supabase?: SupabaseClient<Database>
): Promise<ReserveResult> {
  const client = supabase || createClient()

  try {
    // Check if already reserved
    const { data: existingReserve } = await client
      .from("first_edition_reserves")
      .select("id")
      .eq("product_id", productId)
      .eq("status", "fulfilled")
      .maybeSingle()

    if (existingReserve) {
      return {
        success: false,
        message: "First edition already reserved for this product",
        error: "DUPLICATE_RESERVE",
      }
    }

    // Check product flags
    const { data: product } = await client
      .from("products")
      .select("first_edition_reserved, name")
      .or(`product_id.eq.${productId},id.eq.${productId}`)
      .maybeSingle()

    if (product?.first_edition_reserved) {
      return {
        success: false,
        message: "First edition already reserved for this product",
        error: "ALREADY_RESERVED",
      }
    }

    const productName = productData?.name || product?.name || "Artwork"

    // Get or create collector profile
    const { user_id } = await getOrCreateCollectorProfile(client, RESERVE_EMAIL)

    // Calculate payout (25% of product price)
    const payoutAmount = calculateReservePayout(price)

    // Create order (only pay the artist payout, not full price)
    const { orderId, orderNumber } = await createReserveOrder(
      client,
      productId,
      price,
      payoutAmount,
      productName,
      vendorName
    )

    // Create line item
    const lineItemId = await createReserveLineItem(
      client,
      orderId,
      orderNumber,
      productId,
      productName,
      vendorName,
      price,
      user_id,
      productData
    )

    // Record reserve
    const reserveId = await recordReserve(client, {
      productId,
      vendorName,
      orderId,
      lineItemId,
      price,
      payoutAmount,
    })

    // Update product flags
    await updateProductFlags(client, productId, orderId)

    return {
      success: true,
      reserveId,
      orderId,
      lineItemId,
      message: `First edition reserved successfully. Payout: $${payoutAmount.toFixed(2)}`,
    }
  } catch (error: any) {
    console.error("Error reserving first edition:", error)
    return {
      success: false,
      message: error.message || "Failed to reserve first edition",
      error: error.message,
    }
  }
}

/**
 * Get all reserved editions
 */
export async function getReservedEditions(
  supabase?: SupabaseClient<Database>
): Promise<FirstEditionReserve[]> {
  const client = supabase || createClient()

  const { data, error } = await client
    .from("first_edition_reserves")
    .select("*")
    .order("reserved_at", { ascending: false })

  if (error) {
    console.error("Error fetching reserved editions:", error)
    return []
  }

  return (data || []) as FirstEditionReserve[]
}

/**
 * Get reserve by ID
 */
export async function getReserveById(
  reserveId: string,
  supabase?: SupabaseClient<Database>
): Promise<FirstEditionReserve | null> {
  const client = supabase || createClient()

  const { data, error } = await client
    .from("first_edition_reserves")
    .select("*")
    .eq("id", reserveId)
    .single()

  if (error) {
    console.error("Error fetching reserve:", error)
    return null
  }

  return data as FirstEditionReserve
}

/**
 * Cancel a reserve (for errors/corrections)
 */
export async function cancelReserve(
  reserveId: string,
  supabase?: SupabaseClient<Database>
): Promise<{ success: boolean; message: string }> {
  const client = supabase || createClient()

  const { error } = await client
    .from("first_edition_reserves")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reserveId)

  if (error) {
    return {
      success: false,
      message: error.message || "Failed to cancel reserve",
    }
  }

  return {
    success: true,
    message: "Reserve cancelled successfully",
  }
}
