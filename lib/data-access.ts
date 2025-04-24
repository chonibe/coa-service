import { mockResponseData } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"

/**
 * Client-side data access helper that either uses API calls to the proxy
 * or falls back to mock data in preview environments
 */

// Determine if we're in a preview environment
const isPreviewEnvironment = () => {
  // Check if we're in a Vercel preview deployment
  if (typeof window !== "undefined") {
    // Check for preview URL patterns
    const isVercelPreview = window.location.hostname.includes("vercel.app")
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    return isVercelPreview || isLocalhost
  }
  return false
}

export async function getCustomerOrders(customerId: string): Promise<any> {
  if (isPreviewEnvironment()) {
    console.log("Using mock data for orders in preview environment")
    return mockResponseData
  }

  try {
    console.log(`Fetching orders for customer ID: ${customerId} from Supabase`)

    // Fetch line items from Supabase for the given customer ID
    const { data: lineItems, error } = await supabase
      .from("order_line_items")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching orders from Supabase:", error)
      throw new Error("Failed to fetch orders from Supabase")
    }

    if (!lineItems || lineItems.length === 0) {
      console.log(`No orders found for customer ID: ${customerId}`)
      return {
        orders: [],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
        },
      }
    }

    // Transform the data to match the expected format
    const transformedData = transformSupabaseDataToOrders(lineItems)
    return transformedData
  } catch (error: any) {
    console.error("Error fetching orders:", error.name, error.message)
    throw error // Rethrow the error instead of falling back to mock data
  }
}

// Transform Supabase data to match the expected orders format
function transformSupabaseDataToOrders(supabaseData: any[]) {
  // Group line items by order_id
  const orderMap = new Map()

  supabaseData.forEach((item) => {
    if (!orderMap.has(item.order_id)) {
      orderMap.set(item.order_id, {
        id: item.order_id,
        order_number: item.order_name?.replace("#", "") || item.order_id,
        processed_at: item.created_at,
        fulfillment_status: "fulfilled", // Default value
        financial_status: "paid", // Default value
        line_items: [],
      })
    }

    // Add this line item to the order
    const order = orderMap.get(item.order_id)
    order.line_items.push({
      id: item.line_item_id,
      line_item_id: item.line_item_id,
      product_id: item.product_id,
      title: `Product ${item.product_id}`, // Default title
      quantity: 1,
      price: "0.00", // Default price
      total: "0.00", // Default total
      vendor: "Unknown Vendor",
      image: "/placeholder.svg?height=400&width=400",
      tags: [],
      fulfillable: item.status === "active",
      is_limited_edition: true,
      total_inventory: item.edition_total?.toString() || "100",
      inventory_quantity: 0,
      status: item.status,
      removed_reason: item.removed_reason,
      order_info: {
        order_id: item.order_id,
        order_number: item.order_name?.replace("#", "") || item.order_id,
        processed_at: item.created_at,
        fulfillment_status: "fulfilled", // Default value
        financial_status: "paid", // Default value
      },
    })
  })

  // Convert the map to an array of orders
  const orders = Array.from(orderMap.values())

  return {
    orders,
    pagination: {
      nextCursor: null,
      hasNextPage: false,
    },
  }
}
