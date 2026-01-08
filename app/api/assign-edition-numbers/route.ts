import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  const editionTotal = searchParams.get("editionTotal")

  if (!productId) {
    return NextResponse.json(
      { message: "Product ID parameter is required" },
      {
        status: 400,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins for the assignment API
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  }

  try {
    // Step 1: Fetch all fulfilled orders with the specified product
    const orders = await fetchAllOrdersWithProduct(productId)

    // Step 2: Sort orders by created_at date
    orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Step 3: Assign sequential edition numbers
    const editionAssignments = assignEditionNumbers(orders, productId, editionTotal || "")

    // Step 4: Update orders with edition numbers (in a real implementation)
    // This would call updateOrderWithEditionNumber for each assignment

    return NextResponse.json(
      {
        success: true,
        editionAssignments,
        totalOrders: orders.length,
      },
      {
        status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins for the assignment API
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  } catch (error: any) {
    console.error("Error assigning edition numbers:", error)
    return NextResponse.json(
      { message: "Error assigning edition numbers", error: error.message },
      {
        status: 500,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins for the assignment API
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  }
}

// Function to fetch all orders containing a specific product
async function fetchAllOrdersWithProduct(productId: string) {
  let allOrders = []
  let page = 1
  let hasMoreOrders = true

  while (hasMoreOrders) {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders.json?status=any&limit=250&page=${page}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const orders = data.orders || []

    // Filter orders that contain the specified product
    const filteredOrders = orders.filter((order: any) =>
      order.line_items.some((item: any) => item.product_id.toString() === productId.toString()),
    )

    allOrders = [...allOrders, ...filteredOrders]

    // Check if we need to fetch more pages
    if (orders.length < 250) {
      hasMoreOrders = false
    } else {
      page++
    }
  }

  return allOrders
}

// Function to assign sequential edition numbers to line items
function assignEditionNumbers(orders: any[], productId: string, editionTotal: string) {
  let editionCounter = 1
  const assignments = []

  orders.forEach((order) => {
    order.line_items.forEach((lineItem: any) => {
      if (lineItem.product_id.toString() === productId.toString()) {
        // For each quantity of the item, assign a sequential number
        for (let i = 0; i < lineItem.quantity; i++) {
          assignments.push({
            order_id: order.id,
            order_name: order.name,
            line_item_id: lineItem.id,
            product_id: lineItem.product_id,
            variant_id: lineItem.variant_id,
            edition_number: editionCounter,
            edition_total: editionTotal,
            created_at: order.created_at,
          })

          editionCounter++
        }
      }
    })
  })

  return assignments
}
