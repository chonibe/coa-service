import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { safeJsonParse } from "@/lib/shopify-api"
import type { ShopifyMetafieldDefinition } from "@/types/product-submission"

const API_VERSION = "2024-01"

// Wrapper for shopifyFetch that uses 2024-01 API version
async function shopifyFetch2024(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const fullUrl = url.startsWith("https") ? url : `https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}/${url}`

  const headers = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    if (response.status === 429) {
      const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "1", 10)
      await delay(retryAfter * 1000)
      if (retries > 0) {
        return shopifyFetch2024(url, options, retries - 1)
      }
    }

    return response
  } catch (error) {
    console.error("Error making Shopify API request:", error)
    if (retries > 0) {
      await delay(1000)
      return shopifyFetch2024(url, options, retries - 1)
    }
    throw error
  }
}

/**
 * Fetches all metafield definitions from Shopify
 */
export async function fetchMetafieldDefinitions(): Promise<ShopifyMetafieldDefinition[]> {
  try {
    const metafieldDefinitions: ShopifyMetafieldDefinition[] = []
    let hasNextPage = true
    let pageInfo: string | null = null

    while (hasNextPage) {
      let url = `https://${SHOPIFY_SHOP}/admin/api/${API_VERSION}/metafield_definitions.json?owner_type=product&limit=250`
      
      if (pageInfo) {
        url += `&page_info=${pageInfo}`
      }

      const response = await shopifyFetch2024(url, { method: "GET" })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to fetch metafield definitions:", errorText)
        break
      }

      const data = await safeJsonParse(response)
      const definitions = data.metafield_definitions || []

      for (const def of definitions) {
        metafieldDefinitions.push({
          namespace: def.namespace || "",
          key: def.key || "",
          name: def.name || `${def.namespace}.${def.key}`,
          type: def.type?.name || "single_line_text_field",
          description: def.description || undefined,
          required: false, // Shopify doesn't enforce required on metafields
        })
      }

      // Check for pagination
      const linkHeader = response.headers.get("link")
      if (linkHeader) {
        const match = linkHeader.match(/<[^>]+[?&]page_info=([^>]+)>; rel="next"/)
        pageInfo = match ? match[1] : null
        hasNextPage = !!pageInfo
      } else {
        hasNextPage = false
      }
    }

    return metafieldDefinitions
  } catch (error) {
    console.error("Error fetching metafield definitions:", error)
    // Return common metafields if API call fails
    return [
      {
        namespace: "custom",
        key: "edition_size",
        name: "Edition Size",
        type: "number_integer",
        description: "The total number of editions for this product",
      },
    ]
  }
}

/**
 * Gets metafields for a specific product
 */
export async function getProductMetafields(productId: string): Promise<any[]> {
  try {
    const response = await shopifyFetch2024(
      `products/${productId}/metafields.json`,
      { method: "GET" },
    )

    if (!response.ok) {
      return []
    }

    const data = await safeJsonParse(response)
    return data.metafields || []
  } catch (error) {
    console.error(`Error getting metafields for product ${productId}:`, error)
    return []
  }
}
