import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { safeJsonParse } from "@/lib/shopify-api"
import { createClient } from "@/lib/supabase/server"

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
 * Generates a handle from vendor name for use in Shopify collection handles
 */
export function getVendorCollectionHandle(vendorName: string): string {
  return vendorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Gets the collection title for a vendor
 */
export function getVendorCollectionTitle(vendorName: string): string {
  return `${vendorName} Collection`
}

/**
 * Searches for an existing collection by handle
 */
async function findCollectionByHandle(handle: string): Promise<string | null> {
  try {
    const response = await shopifyFetch2024(
      `collections.json?handle=${encodeURIComponent(handle)}`,
      {
        method: "GET",
      },
    )

    if (!response.ok) {
      return null
    }

    const data = await safeJsonParse(response)
    const collections = data.collections || []
    
    if (collections.length > 0) {
      return collections[0].id?.toString() || null
    }

    return null
  } catch (error) {
    console.error(`Error finding collection by handle ${handle}:`, error)
    return null
  }
}

/**
 * Creates a new collection in Shopify
 */
async function createShopifyCollection(
  title: string,
  handle: string,
): Promise<string | null> {
  try {
    const response = await shopifyFetch2024(
      `collections.json`,
      {
        method: "POST",
        body: JSON.stringify({
          collection: {
            title,
            handle,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create collection: ${response.status}`, errorText)
      throw new Error(`Failed to create collection: ${response.status}`)
    }

    const data = await safeJsonParse(response)
    return data.collection?.id?.toString() || null
  } catch (error) {
    console.error(`Error creating collection ${title}:`, error)
    throw error
  }
}

/**
 * Ensures a vendor collection exists in Shopify, creates it if it doesn't exist
 * Also updates the vendor_collections table in Supabase
 */
export async function ensureVendorCollection(
  vendorId: number,
  vendorName: string,
): Promise<{ collectionId: string; handle: string; title: string }> {
  const supabase = createClient()
  const handle = getVendorCollectionHandle(vendorName)
  const title = getVendorCollectionTitle(vendorName)

  // Check if collection already exists in database
  const { data: existingCollection } = await supabase
    .from("vendor_collections")
    .select("*")
    .eq("vendor_id", vendorId)
    .maybeSingle()

  if (existingCollection?.shopify_collection_id) {
    // Verify it still exists in Shopify
    const response = await shopifyFetch2024(
      `collections/${existingCollection.shopify_collection_id}.json`,
      { method: "GET" },
    )

    if (response.ok) {
      return {
        collectionId: existingCollection.shopify_collection_id,
        handle: existingCollection.shopify_collection_handle,
        title: existingCollection.collection_title,
      }
    }
  }

  // Check if collection exists in Shopify by handle
  let shopifyCollectionId = await findCollectionByHandle(handle)

  if (!shopifyCollectionId) {
    // Create new collection in Shopify
    shopifyCollectionId = await createShopifyCollection(title, handle)
  }

  if (!shopifyCollectionId) {
    throw new Error("Failed to get or create collection ID")
  }

  // Update or insert in database
  if (existingCollection) {
    await supabase
      .from("vendor_collections")
      .update({
        shopify_collection_id: shopifyCollectionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCollection.id)
  } else {
    await supabase.from("vendor_collections").insert({
      vendor_id: vendorId,
      vendor_name: vendorName,
      shopify_collection_id: shopifyCollectionId,
      shopify_collection_handle: handle,
      collection_title: title,
    })
  }

  return {
    collectionId: shopifyCollectionId,
    handle,
    title,
  }
}

/**
 * Assigns a product to a collection in Shopify
 * Uses the Collects API to create a collect (product-collection relationship)
 */
export async function assignProductToCollection(
  productId: string,
  collectionId: string,
): Promise<void> {
  try {
    // Use the Collects API to add product to collection
    const response = await shopifyFetch2024(
      `collects.json`,
      {
        method: "POST",
        body: JSON.stringify({
          collect: {
            product_id: productId,
            collection_id: collectionId,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      // If product is already in collection, that's okay
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.errors?.product_id?.includes("has already been taken")) {
          console.log(`Product ${productId} is already in collection ${collectionId}`)
          return
        }
      }
      console.error(
        `Failed to assign product ${productId} to collection ${collectionId}: ${response.status}`,
        errorText,
      )
      throw new Error(
        `Failed to assign product to collection: ${response.status}`,
      )
    }
  } catch (error) {
    console.error(
      `Error assigning product ${productId} to collection ${collectionId}:`,
      error,
    )
    throw error
  }
}

/**
 * Gets collection details from Shopify
 */
export async function getCollectionDetails(
  collectionId: string,
): Promise<any> {
  try {
    const response = await shopifyFetch2024(
      `collections/${collectionId}.json`,
      { method: "GET" },
    )

    if (!response.ok) {
      throw new Error(`Failed to get collection: ${response.status}`)
    }

    const data = await safeJsonParse(response)
    return data.collection
  } catch (error) {
    console.error(`Error getting collection ${collectionId}:`, error)
    throw error
  }
}
