import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { v4 as uuidv4 } from "uuid"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, lineItemId, orderId } = body

    if (!productId || !lineItemId || !orderId) {
      return NextResponse.json(
        { message: "Product ID, Line Item ID, and Order ID are required" },
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

    // Get the current highest sequential number for this product
    const currentHighestNumber = await getCurrentHighestSequentialNumber(productId)

    // Increment the number
    const newSequentialNumber = currentHighestNumber + 1

    // Generate a UUID that includes the sequential number
    // Format: product-{productId}-edition-{sequentialNumber}-{uuid}
    const sequentialUuid = `product-${productId}-edition-${newSequentialNumber}-${uuidv4()}`

    // Assign this UUID to the line item
    await assignUuidToLineItem(orderId, lineItemId, sequentialUuid, newSequentialNumber)

    // Update the product metafield to store the new highest number
    await updateProductSequentialCounter(productId, newSequentialNumber)

    return NextResponse.json(
      {
        success: true,
        sequentialUuid,
        sequentialNumber: newSequentialNumber,
        productId,
        lineItemId,
        orderId,
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
    console.error("Error generating sequential UUID:", error)
    return NextResponse.json(
      { message: "Error generating sequential UUID", error: error.message },
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

// Function to get the current highest sequential number for a product
async function getCurrentHighestSequentialNumber(productId: string): Promise<number> {
  try {
    // First, check if the product has a metafield storing the current highest number
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch product metafields: ${response.status}`)
    }

    const data = await response.json()
    const metafields = data.metafields || []

    // Look for the sequential_counter metafield
    const counterMetafield = metafields.find(
      (meta: any) => meta.key === "sequential_counter" && meta.namespace === "edition_numbering",
    )

    if (counterMetafield && counterMetafield.value) {
      return Number.parseInt(counterMetafield.value, 10)
    }

    // If no metafield exists, check existing line items to find the highest number
    // This is a fallback for products that already have line items but no counter metafield
    const existingHighestNumber = await findHighestExistingSequentialNumber(productId)
    return existingHighestNumber
  } catch (error) {
    console.error("Error getting current highest sequential number:", error)
    // If we can't determine the current highest number, start from 0
    return 0
  }
}

// Function to find the highest existing sequential number from line items
async function findHighestExistingSequentialNumber(productId: string): Promise<number> {
  try {
    // Fetch all orders with this product
    const allOrders = await fetchAllOrdersWithProduct(productId)
    let highestNumber = 0

    // Loop through all orders and line items to find the highest sequential number
    for (const order of allOrders) {
      for (const lineItem of order.line_items) {
        if (lineItem.product_id.toString() === productId.toString()) {
          // Check if this line item has a sequential number metafield
          if (lineItem.properties) {
            const sequentialProperty = lineItem.properties.find((prop: any) => prop.name === "_sequential_number")

            if (sequentialProperty && sequentialProperty.value) {
              const sequentialNumber = Number.parseInt(sequentialProperty.value, 10)
              if (!isNaN(sequentialNumber) && sequentialNumber > highestNumber) {
                highestNumber = sequentialNumber
              }
            }
          }
        }
      }
    }

    return highestNumber
  } catch (error) {
    console.error("Error finding highest existing sequential number:", error)
    return 0
  }
}

// Function to assign the UUID to a line item
async function assignUuidToLineItem(
  orderId: string,
  lineItemId: string,
  sequentialUuid: string,
  sequentialNumber: number,
): Promise<void> {
  try {
    // Update the line item with the sequential UUID as a property
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/orders/${orderId}.json`

    // First, get the current order to find the line item
    const getResponse = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch order: ${getResponse.status}`)
    }

    const orderData = await getResponse.json()
    const order = orderData.order

    // Find the line item
    const lineItemIndex = order.line_items.findIndex((item: any) => item.id.toString() === lineItemId.toString())

    if (lineItemIndex === -1) {
      throw new Error(`Line item ${lineItemId} not found in order ${orderId}`)
    }

    // Prepare the update payload
    // We'll add the sequential UUID and number as line item properties
    const properties = order.line_items[lineItemIndex].properties || []

    // Check if properties already exist for this line item
    const uuidPropertyIndex = properties.findIndex((prop: any) => prop.name === "_sequential_uuid")
    const numberPropertyIndex = properties.findIndex((prop: any) => prop.name === "_sequential_number")

    if (uuidPropertyIndex !== -1) {
      properties[uuidPropertyIndex].value = sequentialUuid
    } else {
      properties.push({ name: "_sequential_uuid", value: sequentialUuid })
    }

    if (numberPropertyIndex !== -1) {
      properties[numberPropertyIndex].value = sequentialNumber.toString()
    } else {
      properties.push({ name: "_sequential_number", value: sequentialNumber.toString() })
    }

    // Update the order with the new properties
    const updatePayload = {
      order: {
        id: orderId,
        line_items: [
          {
            id: lineItemId,
            properties: properties,
          },
        ],
      },
    }

    const updateResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`Failed to update line item: ${updateResponse.status} ${errorText}`)
    }
  } catch (error) {
    console.error("Error assigning UUID to line item:", error)
    throw error
  }
}

// Function to update the product metafield with the new highest sequential number
async function updateProductSequentialCounter(productId: string, sequentialNumber: number): Promise<void> {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}/metafields.json`

    // Check if the metafield already exists
    const getResponse = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch product metafields: ${getResponse.status}`)
    }

    const data = await getResponse.json()
    const metafields = data.metafields || []

    // Look for the sequential_counter metafield
    const counterMetafield = metafields.find(
      (meta: any) => meta.key === "sequential_counter" && meta.namespace === "edition_numbering",
    )

    if (counterMetafield) {
      // Update the existing metafield
      const updateUrl = `https://${SHOPIFY_SHOP}/admin/api/2023-10/metafields/${counterMetafield.id}.json`

      const updateResponse = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metafield: {
            id: counterMetafield.id,
            value: sequentialNumber.toString(),
            type: "number_integer",
          },
        }),
      })

      if (!updateResponse.ok) {
        throw new Error(`Failed to update metafield: ${updateResponse.status}`)
      }
    } else {
      // Create a new metafield
      const createResponse = await fetch(url, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metafield: {
            namespace: "edition_numbering",
            key: "sequential_counter",
            value: sequentialNumber.toString(),
            type: "number_integer",
          },
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create metafield: ${createResponse.status}`)
      }
    }
  } catch (error) {
    console.error("Error updating product sequential counter:", error)
    throw error
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
