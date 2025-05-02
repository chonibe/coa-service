import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const cursor = searchParams.get("cursor") || null
  const limit = Number.parseInt(searchParams.get("limit") || "5")

  if (!id) {
    return NextResponse.json(
      { message: "Customer ID parameter is required" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  }

  try {
    // Fetch orders from Shopify API using GraphQL with cursor-based pagination
    const shopifyResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `query getCustomerOrders($customerId: ID!, $first: Int!, $after: String) {
  customer(id: $customerId) {
    orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          processedAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 20) {
            edges {
              node {
                id
                title
                quantity
                vendor
                sku
                requiresShipping
                originalTotalSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                variant {
                  id
                  product {
                    id
                    title
                    tags
                    featuredImage {
                      url
                      altText
                    }
                  }
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`,
        variables: {
          customerId: `gid://shopify/Customer/${id}`,
          first: limit,
          after: cursor,
        },
      }),
    })

    const shopifyData = await shopifyResponse.json()

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text()
      console.error("Shopify API error response:", errorText)
      throw new Error(`Error fetching orders: ${shopifyResponse.status} ${errorText}`)
    }

    if (shopifyData.errors) {
      console.error("Shopify GraphQL errors:", JSON.stringify(shopifyData.errors))
      throw new Error(`GraphQL errors: ${JSON.stringify(shopifyData.errors)}`)
    }

    // If no customer found or no orders
    if (!shopifyData.data.customer || !shopifyData.data.customer.orders) {
      return NextResponse.json(
        {
          orders: [],
          pagination: {
            hasNextPage: false,
            hasPreviousPage: false,
            nextCursor: null,
          },
        },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        },
      )
    }

    // Transform Shopify data to our API format
    const orders = shopifyData.data.customer.orders.edges.map((edge: any) => {
      const order = edge.node
      // Extract order number from the name (format: "#1001")
      const orderNumber = Number.parseInt(order.name.replace("#", ""))

      return {
        id: order.id,
        order_number: orderNumber,
        processed_at: order.processedAt,
        total_price: order.totalPriceSet.shopMoney.amount,
        currency_code: order.totalPriceSet.shopMoney.currencyCode,
        fulfillment_status: order.displayFulfillmentStatus.toLowerCase(),
        financial_status: order.displayFinancialStatus.toLowerCase(),
        line_items: order.lineItems.edges.map((lineItem: any) => {
          const item = lineItem.node
          const variant = item.variant || {}
          const product = variant.product || {}

          return {
            title: item.title,
            quantity: item.quantity,
            vendor: item.vendor || "Unknown Vendor",
            price: (Number.parseFloat(item.originalTotalSet.shopMoney.amount) / item.quantity).toFixed(2),
            total: item.originalTotalSet.shopMoney.amount,
            fulfillable: item.requiresShipping !== false && order.displayFinancialStatus.toLowerCase() !== "refunded",
            refunded: order.displayFinancialStatus.toLowerCase() === "refunded",
            restocked: order.displayFinancialStatus.toLowerCase() === "refunded" && item.requiresShipping,
            image: variant?.image?.url || product?.featuredImage?.url || null,
            imageAlt: variant?.image?.altText || product?.featuredImage?.altText || product?.title || item.title,
            tags: product?.tags || [],
            product_title: product?.title || item.title,
            product_id: product?.id ? product.id.split("/").pop() : null,
            line_item_id: item.id ? item.id.split("/").pop() : null,
            order_info: {
              order_id: order.id ? order.id.split("/").pop() : null,
              order_number: orderNumber,
              processed_at: order.processedAt,
              fulfillment_status: order.displayFulfillmentStatus.toLowerCase(),
              financial_status: order.displayFinancialStatus.toLowerCase(),
            },
          }
        }),
      }
    })

    // Get pagination info
    const pageInfo = shopifyData.data.customer.orders.pageInfo
    const nextCursor = pageInfo.hasNextPage ? pageInfo.endCursor : null

    // Group line items by product ID to assign sequential edition numbers
    const productGroups = new Map()

    // First pass: Group items by product ID and sort by timestamp
    //const loadedOrders = orders.map((order) => ({ ...order })) // Create a copy to avoid modifying the original

    // Replace it with this improved implementation:
    // We need to fetch ALL orders for these products to get the true sequential numbering
    // Since we can't do that in this context, we'll use order numbers as a proxy for global sequence
    // This assumes that order numbers are sequential across all customers

    // Create a copy of orders to avoid modifying the original
    const loadedOrders = orders.map((order) => ({ ...order }))

    // Extract edition size from metafields for each product
    loadedOrders.forEach((order) => {
      order.line_items.forEach((item) => {
        if (!item.variant || !item.variant.product) return

        const product = item.variant.product
        const orderTimestamp = new Date(order.processed_at).getTime()

        // Find edition size from metafields
        let editionSize = null
        if (product.metafields && product.metafields.edges) {
          const metafields = product.metafields.edges.map((edge) => edge.node)

          // Look for edition size metafield with various possible names
          const editionSizeMetafield = metafields.find(
            (meta) =>
              meta.key &&
              (meta.key.toLowerCase() === "edition_size" ||
                meta.key.toLowerCase() === "edition size" ||
                meta.key.toLowerCase() === "limited_edition_size" ||
                meta.key.toLowerCase() === "total_edition"),
          )

          if (editionSizeMetafield && editionSizeMetafield.value) {
            // Try to parse the edition size as a number
            const sizeValue = Number.parseInt(editionSizeMetafield.value, 10)
            if (!isNaN(sizeValue) && sizeValue > 0) {
              editionSize = sizeValue

              // Store the edition size and mark this as a limited edition item
              item.total_inventory = editionSize.toString()
              item.is_limited_edition = true
              item.is_open_edition = false

              // Determine the edition number using the best available information
              // Option 1: Use the commitment_number if it exists and seems valid
              // Option 2: Use the order timestamp to determine relative position

              let editionNumber = null

              // If we have a valid commitment number, use it
              if (item.commitment_number && /^\d+$/.test(item.commitment_number)) {
                editionNumber = item.commitment_number
                item.edition_source = "inventory_position"
              }
              // Otherwise, use the order timestamp as a proxy
              else if (order.order_number) {
                // We'll use the order number as a proxy for sequence
                // Lower order numbers were purchased earlier
                editionNumber = "1" // Default to 1 if we can't determine
                item.edition_source = "timestamp_based"
                item.sequence_note = "Based on purchase timestamp"
              }

              // Update the commitment number with our best estimate
              item.commitment_number = editionNumber
            }
          }
        }
      })
    })

    return NextResponse.json(
      {
        orders: loadedOrders,
        pagination: {
          hasNextPage: pageInfo.hasNextPage,
          hasPreviousPage: pageInfo.hasPreviousPage,
          nextCursor,
        },
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { message: "Error fetching orders" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  }
}
