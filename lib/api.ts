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

// Force mock data in preview environments to avoid CORS issues
const FORCE_MOCK_DATA = isPreviewEnvironment()

// Base URL for API calls - ensure it has the correct protocol
const API_BASE_URL = (() => {
  // For client-side rendering
  if (typeof window !== "undefined") {
    // Use relative URL to avoid CORS issues in preview environments
    return window.location.origin // Use window.location.origin for relative URLs
  }

  // For server-side rendering
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://v0-image-analysis-wine-six.vercel.app"
  // Ensure URL has https:// prefix
  if (!url.startsWith("http")) {
    return `https://${url}`
  }
  return url
})()

console.log(`API Base URL: ${API_BASE_URL}`)
console.log(`Using mock data: ${FORCE_MOCK_DATA ? "Yes (preview environment)" : "No (will try real API first)"}`)

/**
 * In a real implementation, this function would not exist as the order data
 * would come directly from Shopify's liquid templates.
 * This is only for our preview/demo purposes.
 */
export async function fetchCustomerOrders(customerId: string, cursor: string | null = null, limit = 5): Promise<any> {
  try {
    // Build the URL with query parameters - ensure this matches the Liquid template
    const baseURL = API_BASE_URL
    const relativeURL = "/api/fetch-orders-by-customer"
    const url = new URL(relativeURL, baseURL)
    url.searchParams.append("id", customerId)
    url.searchParams.append("limit", limit.toString())
    if (cursor) {
      url.searchParams.append("cursor", cursor)
    }

    console.log(`Attempting to fetch orders from: ${url.toString()}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      // Use a more robust fetch with proper error handling
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      // Log specific error details for debugging
      console.error("Fetch error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      })

      throw fetchError
    }
  } catch (error: any) {
    console.error("Error fetching orders:", error.name, error.message)
    throw error // Rethrow the error instead of falling back to mock data
  }
}

/**
 * Fetch edition information for a specific line item from Supabase
 * This is the main API we need from our backend
 */
export async function getEditionFromSupabase(orderId: string, lineItemId: string): Promise<any> {
  try {
    // Use relative URL to avoid CORS issues
    const url = new URL(`/api/editions/get-by-line-item`, window.location.origin)
    url.searchParams.append("order_id", orderId)
    url.searchParams.append("line_item_id", lineItemId)

    console.log(`Attempting to fetch edition from Supabase: ${url.toString()}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to get edition from Supabase: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error: any) {
    console.error("Error getting edition from Supabase:", error.name, error.message)
    throw error // Rethrow the error instead of returning null
  }
}

/**
 * Get sequential number for a line item
 * This is a fallback API if Supabase doesn't have the data
 */
export async function getSequentialNumber(orderId: string, lineItemId: string): Promise<any> {
  try {
    const url = new URL(`/api/get-sequential-number`, window.location.origin)
    url.searchParams.append("orderId", orderId)
    url.searchParams.append("lineItemId", lineItemId)

    console.log(`Attempting to fetch sequential number: ${url.toString()}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to get sequential number: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error: any) {
    console.error("Error getting sequential number:", error.name, error.message)
    throw error // Rethrow the error instead of returning null
  }
}

/**
 * Get edition number through the fallback API
 * This is a last resort if other methods fail
 */
export async function getEditionNumber(orderId: string, lineItemId: string, productId: string): Promise<any> {
  try {
    const url = new URL(`/api/get-edition-number`, window.location.origin)
    url.searchParams.append("orderId", orderId)
    url.searchParams.append("lineItemId", lineItemId)
    url.searchParams.append("productId", productId)

    console.log(`Attempting to fetch edition number: ${url.toString()}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to get edition number: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error: any) {
    console.error("Error getting edition number:", error.name, error.message)
    throw error // Rethrow the error instead of returning null
  }
}

/**
 * Update the status of a line item
 */
export async function updateItemStatus(
  lineItemId: string,
  orderId: string,
  status: "active" | "removed",
  reason?: string,
): Promise<any> {
  try {
    const url = new URL(`/api/update-line-item-status`, window.location.origin)

    console.log(`Attempting to update line item status: ${url.toString()}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItemId,
          orderId,
          status,
          reason,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to update line item status: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error: any) {
    console.error("Error updating line item status:", error.name, error.message)
    throw error
  }
}

// Update the syncEditionData function to properly format the request with an array of productIds
export async function syncEditionData(productId: string, forceSync = false): Promise<any> {
  try {
    const url = new URL(`/api/sync-all-products`, window.location.origin)

    console.log(`Attempting to sync edition data: ${url.toString()}`)
    console.log(`Product ID: ${productId}, Force Sync: ${forceSync}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for longer operation

    try {
      // IMPORTANT: The API expects an array of productIds, not a single productId
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: [productId], // Wrap the productId in an array as expected by the API
          forceSync,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error response from sync API: ${errorText}`)
        throw new Error(`Failed to sync edition data: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error: any) {
    console.error("Error syncing edition data:", error.name, error.message)
    throw error
  }
}
