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
export async function getCustomerOrders(customerId: string): Promise<any> {
  if (FORCE_MOCK_DATA) {
    console.log("Using mock data for orders in preview environment")
    return {
      orders: [],
      pagination: {
        nextCursor: null,
        hasNextPage: false,
      },
    }
  }

  try {
    // Use relative URL to avoid CORS issues
    const url = new URL(`/api/fetch-orders-by-customer?id=${customerId}`, window.location.origin)

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
 * Update the status of a line item
 */
export async function updateLineItemStatus(
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

/**
 * Resequence edition numbers for a product
 */
export async function resequenceEditionNumbers(productId: string): Promise<any> {
  try {
    const url = new URL(`/api/editions/resequence`, window.location.origin)
    url.searchParams.append("productId", productId)

    console.log(`Attempting to resequence edition numbers: ${url.toString()}`)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

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
        throw new Error(`Failed to resequence edition numbers: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error: any) {
    console.error("Error resequencing edition numbers:", error.name, error.message)
    throw error
  }
}
