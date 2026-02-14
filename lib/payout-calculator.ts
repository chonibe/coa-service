import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { convertToUSD } from "@/lib/currency-converter"

export const DEFAULT_PAYOUT_PERCENTAGE = 25
export const MINIMUM_PAYOUT_AMOUNT = 25 // USD

// Vendors excluded from payout calculations (e.g., internal/company vendors)
const EXCLUDED_VENDORS = ["Street Collector", "street collector", "street-collector"]

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
  // Always use exactly DEFAULT_PAYOUT_PERCENTAGE% of the item price
  // Custom payout settings are disabled
  return (lineItem.price * DEFAULT_PAYOUT_PERCENTAGE) / 100
}

/**
 * Calculate payout for a specific order
 */
export async function calculateOrderPayout(
  orderId: string,
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<OrderPayout | null> {
  // Return null for excluded vendors
  if (EXCLUDED_VENDORS.includes(vendorName)) {
    return null
  }

  const client = supabase || createClient()

  try {
    const { data, error } = await client.rpc("get_vendor_payout_by_order", {
      p_vendor_name: vendorName,
      p_order_id: orderId,
    } as any) as { data: any[] | null; error: any }

    if (error) {
      console.error("Error calculating order payout:", error)
      return null
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null
    }

    const orderData = data[0] as any

    // Get order currency and raw Shopify data
    const { data: order } = await client
      .from('orders')
      .select('currency_code, raw_shopify_order_data')
      .eq('id', orderId)
      .single()

    const orderCurrency = (order as any)?.currency_code || 'USD'

    // Transform line items with original prices and currency conversion
    const lineItems: LineItemPayout[] = await Promise.all(
      (Array.isArray(orderData.line_items) ? orderData.line_items : []).map(async (item: any) => {
        // Get original price from Shopify order data (before discount)
        let originalPrice = Number(item.price)
        let originalCurrency = orderCurrency
        
        if ((order as any)?.raw_shopify_order_data?.line_items) {
          const shopifyLineItem = (order as any).raw_shopify_order_data.line_items.find(
            (li: any) => li.id.toString() === item.line_item_id
          )
          
          if (shopifyLineItem) {
            // Use original_price if available
            if (shopifyLineItem.original_price) {
              originalPrice = parseFloat(shopifyLineItem.original_price)
            } else if (shopifyLineItem.discount_allocations && shopifyLineItem.discount_allocations.length > 0) {
              // Calculate original price by adding back discounts
              const totalDiscount = shopifyLineItem.discount_allocations.reduce(
                (sum: number, disc: any) => sum + parseFloat(disc.amount || '0'),
                0
              )
              originalPrice = parseFloat(shopifyLineItem.price || '0') + totalDiscount
            } else {
              originalPrice = parseFloat(shopifyLineItem.price || '0')
            }
          }
        }

        // Historical exception: Up to September 2025, force $40 price and $10 payout
        const orderDate = new Date(orderData.order_date)
        const october2025 = new Date('2025-10-01')
        
        let priceForCalculation = await convertToUSD(originalPrice, originalCurrency)

        if (orderDate < october2025) {
          priceForCalculation = 40.00
        }

        const payoutPercentage = DEFAULT_PAYOUT_PERCENTAGE // Always 25%
        const isPercentage = true // Always percentage
        let recalculatedPayoutAmount = (priceForCalculation * payoutPercentage) / 100

        // Apply $10 minimum for orders before October 2025 (safety check)
        if (orderDate < october2025 && recalculatedPayoutAmount < 10) {
          recalculatedPayoutAmount = 10
        }

        return {
          line_item_id: item.line_item_id,
          order_id: orderData.order_id,
          order_name: orderData.order_name,
          product_id: item.product_id,
          product_title: item.product_title,
          price: priceForCalculation, // Use converted price
          payout_percentage: payoutPercentage,
          payout_amount: recalculatedPayoutAmount, // Recalculated with original price and conversion
          is_percentage: isPercentage,
          fulfillment_status: item.fulfillment_status,
          is_paid: Boolean(item.is_paid),
        }
      })
    )

    // Recalculate order totals
    const orderTotal = lineItems.reduce((sum, item) => sum + item.price, 0)
    const payoutAmount = lineItems
      .filter((item) => !item.is_paid)
      .reduce((sum, item) => sum + item.payout_amount, 0)

    return {
      order_id: orderData.order_id,
      order_name: orderData.order_name,
      order_date: orderData.order_date,
      total_line_items: orderData.total_line_items,
      fulfilled_line_items: orderData.fulfilled_line_items,
      paid_line_items: orderData.paid_line_items,
      pending_line_items: orderData.pending_line_items,
      order_total: orderTotal, // Recalculated with converted prices
      payout_amount: payoutAmount, // Recalculated with original prices and conversion
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
  // Return empty summary for excluded vendors
  if (EXCLUDED_VENDORS.includes(vendorName)) {
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

  const client = supabase || createClient()

  try {
    const { data, error } = await client.rpc("get_vendor_payout_by_order", {
      p_vendor_name: vendorName,
      p_order_id: options.orderId || null,
    } as any) as { data: any[] | null; error: any }

    if (error) {
      console.error("Error calculating vendor payout:", error)
      return null
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
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

    // Get all unique order IDs to fetch order currency and original prices
    const orderIds = [...new Set((data as any[]).map((orderData: any) => orderData.order_id))]
    const { data: ordersData } = await client
      .from('orders')
      .select('id, currency_code, raw_shopify_order_data')
      .in('id', orderIds)

    const ordersMap = new Map(
      (ordersData || []).map((order: any) => [order.id, order])
    )

    // Filter orders if needed and apply currency conversion + original prices
    let orders = await Promise.all(
      (data as any[]).map(async (orderData: any) => {
        const orderInfo = ordersMap.get(orderData.order_id) as any
        const orderCurrency = orderInfo?.currency_code || 'USD'

        // Process line items with original prices and currency conversion
        const lineItems: LineItemPayout[] = await Promise.all(
          (Array.isArray(orderData.line_items) ? orderData.line_items : []).map(async (item: any) => {
            // Get original price from Shopify order data (before discount)
            let originalPrice = Number(item.price)
            let originalCurrency = orderCurrency
            
            if (orderInfo?.raw_shopify_order_data?.line_items) {
              const shopifyLineItem = orderInfo.raw_shopify_order_data.line_items.find(
                (li: any) => li.id.toString() === item.line_item_id
              )
              
              if (shopifyLineItem) {
                // Use original_price if available
                if (shopifyLineItem.original_price) {
                  originalPrice = parseFloat(shopifyLineItem.original_price)
                } else if (shopifyLineItem.discount_allocations && shopifyLineItem.discount_allocations.length > 0) {
                  // Calculate original price by adding back discounts
                  const totalDiscount = shopifyLineItem.discount_allocations.reduce(
                    (sum: number, disc: any) => sum + parseFloat(disc.amount || '0'),
                    0
                  )
                  originalPrice = parseFloat(shopifyLineItem.price || '0') + totalDiscount
                } else {
                  originalPrice = parseFloat(shopifyLineItem.price || '0')
                }
              }
            }

            // Convert to USD if needed
            const priceForCalculation = await convertToUSD(originalPrice, originalCurrency)

            // Always use 25% payout with $10 minimum for orders before October 2025
            const payoutPercentage = DEFAULT_PAYOUT_PERCENTAGE // Always 25%
            const isPercentage = true // Always percentage
            let recalculatedPayoutAmount = (priceForCalculation * payoutPercentage) / 100

            // Apply $10 minimum for orders before October 2025
            const orderDate = new Date(orderData.order_date)
            const october2025 = new Date('2025-10-01')
            if (orderDate < october2025 && recalculatedPayoutAmount < 10) {
              recalculatedPayoutAmount = 10
            }

            return {
              line_item_id: item.line_item_id,
              order_id: orderData.order_id,
              order_name: orderData.order_name,
              product_id: item.product_id,
              product_title: item.product_title,
              price: priceForCalculation, // Use converted price
              payout_percentage: payoutPercentage,
              payout_amount: recalculatedPayoutAmount, // Recalculated with original price and conversion
              is_percentage: isPercentage,
              fulfillment_status: item.fulfillment_status,
              is_paid: Boolean(item.is_paid),
            }
          })
        )

        // Recalculate order totals
        const orderTotal = lineItems.reduce((sum, item) => sum + item.price, 0)
        const payoutAmount = lineItems
          .filter((item) => !item.is_paid)
          .reduce((sum, item) => sum + item.payout_amount, 0)

        return {
          order_id: orderData.order_id,
          order_name: orderData.order_name,
          order_date: orderData.order_date,
          total_line_items: orderData.total_line_items,
          fulfilled_line_items: orderData.fulfilled_line_items,
          paid_line_items: orderData.paid_line_items,
          pending_line_items: orderData.pending_line_items,
          order_total: orderTotal, // Recalculated with converted prices
          payout_amount: payoutAmount, // Recalculated with original prices and conversion
          line_items: lineItems,
        }
      })
    )

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
    const total_line_items = orders.reduce((sum: number, order: OrderPayout) => sum + order.total_line_items, 0)
    const fulfilled_line_items = orders.reduce((sum: number, order: OrderPayout) => sum + order.fulfilled_line_items, 0)
    const paid_line_items = orders.reduce((sum: number, order: OrderPayout) => sum + order.paid_line_items, 0)
    const pending_line_items = orders.reduce((sum: number, order: OrderPayout) => sum + order.pending_line_items, 0)
    const total_revenue = orders.reduce((sum: number, order: OrderPayout) => sum + order.order_total, 0)
    const total_payout_amount = orders.reduce((sum: number, order: OrderPayout) => sum + order.payout_amount, 0)

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
 * @deprecated LEGACY — Used for display/audit only, NOT for money calculations.
 * The authoritative balance comes from the ledger (calculateVendorBalance in vendor-balance-calculator.ts).
 */
export async function getPendingLineItems(
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<LineItemPayout[]> {
  // Return empty array for excluded vendors
  if (EXCLUDED_VENDORS.includes(vendorName)) {
    return []
  }

  const client = supabase || createClient()

  try {
    const { data, error } = await client.rpc("get_vendor_pending_line_items", {
      p_vendor_name: vendorName,
    } as any) as { data: any[] | null; error: any }

    if (error) {
      console.error("Error fetching pending line items:", error)
      return []
    }

    if (!data || !Array.isArray(data)) {
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




