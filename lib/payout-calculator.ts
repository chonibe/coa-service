import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const DEFAULT_PAYOUT_PERCENTAGE = 25

export interface LineItemPayout {
  line_item_id: string
  order_id: string
  order_name: string | null
  product_id: string
  product_title: string | null
  price: number
  payout_percentage: number
  payout_amount: number
  is_percentage: boolean
  fulfillment_status: string | null
  is_paid: boolean
}

export interface OrderPayout {
  order_id: string
  order_name: string | null
  order_date: string
  total_line_items: number
  fulfilled_line_items: number
  paid_line_items: number
  pending_line_items: number
  order_total: number
  payout_amount: number
  line_items: LineItemPayout[]
}

export interface VendorPayoutSummary {
  vendor_name: string
  total_orders: number
  total_line_items: number
  fulfilled_line_items: number
  paid_line_items: number
  pending_line_items: number
  total_revenue: number
  total_payout_amount: number
  orders: OrderPayout[]
}

export interface PayoutCalculationOptions {
  vendorName?: string
  orderId?: string
  includePaid?: boolean
  fulfillmentStatus?: "fulfilled" | "all"
}

/**
 * Calculate payout for a single line item
 */
export function calculateLineItemPayout(
  lineItem: {
    price: number
    payout_amount?: number | null
    is_percentage?: boolean | null
  }
): number {
  const payoutAmount = lineItem.payout_amount ?? DEFAULT_PAYOUT_PERCENTAGE
  const isPercentage = lineItem.is_percentage ?? true

  if (isPercentage) {
    return (lineItem.price * payoutAmount) / 100
  }

  return payoutAmount
}

/**
 * Calculate payout for a specific order
 */
export async function calculateOrderPayout(
  orderId: string,
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<OrderPayout | null> {
  const client = supabase || createClient()

  try {
    const { data, error } = await client.rpc("get_vendor_payout_by_order", {
      p_vendor_name: vendorName,
      p_order_id: orderId,
    })

    if (error) {
      console.error("Error calculating order payout:", error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const orderData = data[0]

    // Transform line items from JSONB to typed array
    const lineItems: LineItemPayout[] = Array.isArray(orderData.line_items)
      ? orderData.line_items.map((item: any) => ({
          line_item_id: item.line_item_id,
          order_id: orderData.order_id,
          order_name: orderData.order_name,
          product_id: item.product_id,
          product_title: item.product_title,
          price: Number(item.price),
          payout_percentage: item.payout_percentage ?? DEFAULT_PAYOUT_PERCENTAGE,
          payout_amount: Number(item.payout_amount),
          is_percentage: item.payout_percentage !== null,
          fulfillment_status: item.fulfillment_status,
          is_paid: Boolean(item.is_paid),
        }))
      : []

    return {
      order_id: orderData.order_id,
      order_name: orderData.order_name,
      order_date: orderData.order_date,
      total_line_items: orderData.total_line_items,
      fulfilled_line_items: orderData.fulfilled_line_items,
      paid_line_items: orderData.paid_line_items,
      pending_line_items: orderData.pending_line_items,
      order_total: Number(orderData.order_total),
      payout_amount: Number(orderData.payout_amount),
      line_items: lineItems,
    }
  } catch (error) {
    console.error("Error in calculateOrderPayout:", error)
    return null
  }
}

/**
 * Calculate payout for a vendor across all orders
 */
export async function calculateVendorPayout(
  vendorName: string,
  options: PayoutCalculationOptions = {},
  supabase?: SupabaseClient<Database>
): Promise<VendorPayoutSummary | null> {
  const client = supabase || createClient()

  try {
    const { data, error } = await client.rpc("get_vendor_payout_by_order", {
      p_vendor_name: vendorName,
      p_order_id: options.orderId || null,
    })

    if (error) {
      console.error("Error calculating vendor payout:", error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        vendor_name: vendorName,
        total_orders: 0,
        total_line_items: 0,
        fulfilled_line_items: 0,
        paid_line_items: 0,
        pending_line_items: 0,
        total_revenue: 0,
        total_payout_amount: 0,
        orders: [],
      }
    }

    // Filter orders if needed
    let orders = data.map((orderData: any) => {
      const lineItems: LineItemPayout[] = Array.isArray(orderData.line_items)
        ? orderData.line_items.map((item: any) => ({
            line_item_id: item.line_item_id,
            order_id: orderData.order_id,
            order_name: orderData.order_name,
            product_id: item.product_id,
            product_title: item.product_title,
            price: Number(item.price),
            payout_percentage: item.payout_percentage ?? DEFAULT_PAYOUT_PERCENTAGE,
            payout_amount: Number(item.payout_amount),
            is_percentage: item.payout_percentage !== null,
            fulfillment_status: item.fulfillment_status,
            is_paid: Boolean(item.is_paid),
          }))
        : []

      return {
        order_id: orderData.order_id,
        order_name: orderData.order_name,
        order_date: orderData.order_date,
        total_line_items: orderData.total_line_items,
        fulfilled_line_items: orderData.fulfilled_line_items,
        paid_line_items: orderData.paid_line_items,
        pending_line_items: orderData.pending_line_items,
        order_total: Number(orderData.order_total),
        payout_amount: Number(orderData.payout_amount),
        line_items: lineItems,
      }
    })

    // Filter by fulfillment status if specified
    if (options.fulfillmentStatus === "fulfilled") {
      orders = orders.filter((order) => order.fulfilled_line_items > 0)
    }

    // Filter out paid items if not including paid
    if (!options.includePaid) {
      orders = orders.map((order) => ({
        ...order,
        line_items: order.line_items.filter((item) => !item.is_paid),
        payout_amount: order.line_items
          .filter((item) => !item.is_paid)
          .reduce((sum, item) => sum + item.payout_amount, 0),
      }))
    }

    // Calculate totals
    const total_orders = orders.length
    const total_line_items = orders.reduce((sum, order) => sum + order.total_line_items, 0)
    const fulfilled_line_items = orders.reduce((sum, order) => sum + order.fulfilled_line_items, 0)
    const paid_line_items = orders.reduce((sum, order) => sum + order.paid_line_items, 0)
    const pending_line_items = orders.reduce((sum, order) => sum + order.pending_line_items, 0)
    const total_revenue = orders.reduce((sum, order) => sum + order.order_total, 0)
    const total_payout_amount = orders.reduce((sum, order) => sum + order.payout_amount, 0)

    return {
      vendor_name: vendorName,
      total_orders,
      total_line_items,
      fulfilled_line_items,
      paid_line_items,
      pending_line_items,
      total_revenue,
      total_payout_amount,
      orders,
    }
  } catch (error) {
    console.error("Error in calculateVendorPayout:", error)
    return null
  }
}

/**
 * Get pending line items for a vendor (fulfilled items not yet paid)
 */
export async function getPendingLineItems(
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<LineItemPayout[]> {
  const client = supabase || createClient()

  try {
    const { data, error } = await client.rpc("get_vendor_pending_line_items", {
      p_vendor_name: vendorName,
    })

    if (error) {
      console.error("Error fetching pending line items:", error)
      return []
    }

    if (!data) {
      return []
    }

    return data.map((item: any) => ({
      line_item_id: item.line_item_id,
      order_id: item.order_id,
      order_name: item.order_name,
      product_id: item.product_id,
      product_title: item.product_title,
      price: Number(item.price),
      payout_percentage: item.is_percentage ? item.payout_amount : null,
      payout_amount: calculateLineItemPayout({
        price: Number(item.price),
        payout_amount: item.payout_amount,
        is_percentage: item.is_percentage,
      }),
      is_percentage: item.is_percentage,
      fulfillment_status: item.fulfillment_status,
      is_paid: false,
    }))
  } catch (error) {
    console.error("Error in getPendingLineItems:", error)
    return []
  }
}




