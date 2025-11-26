import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { safeJsonParse } from "@/lib/shopify-api"
import type { ProductSubmissionData, ProductImage, ProductMetafield, ProductVariant } from "@/types/product-submission"

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
 * Uploads an image to Shopify and returns the image object
 */
export async function uploadProductImage(
  productId: string,
  image: ProductImage,
  position?: number,
): Promise<any> {
  try {
    const imageData: any = {
      src: image.src,
    }

    if (image.alt) {
      imageData.alt = image.alt
    }

    if (position !== undefined) {
      imageData.position = position
    } else if (image.position !== undefined) {
      imageData.position = image.position
    }

    const response = await shopifyFetch2024(
      `products/${productId}/images.json`,
      {
        method: "POST",
        body: JSON.stringify({
          image: imageData,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to upload image for product ${productId}:`, errorText)
      throw new Error(`Failed to upload image: ${response.status}`)
    }

    const data = await safeJsonParse(response)
    return data.image
  } catch (error) {
    console.error(`Error uploading image for product ${productId}:`, error)
    throw error
  }
}

/**
 * Uploads multiple images to a product
 */
export async function uploadProductImages(
  productId: string,
  images: ProductImage[],
): Promise<any[]> {
  const uploadedImages: any[] = []

  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    try {
      const uploaded = await uploadProductImage(productId, image, i + 1)
      uploadedImages.push(uploaded)
      // Small delay to avoid rate limiting
      if (i < images.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error)
      // Continue with other images even if one fails
    }
  }

  return uploadedImages
}

/**
 * Sets a metafield on a product
 */
export async function setProductMetafield(
  productId: string,
  metafield: ProductMetafield,
): Promise<any> {
  try {
    const response = await shopifyFetch2024(
      `products/${productId}/metafields.json`,
      {
        method: "POST",
        body: JSON.stringify({
          metafield: {
            namespace: metafield.namespace,
            key: metafield.key,
            value: metafield.value,
            type: metafield.type,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to set metafield for product ${productId}:`, errorText)
      // Don't throw - metafields are optional
      return null
    }

    const data = await safeJsonParse(response)
    return data.metafield
  } catch (error) {
    console.error(`Error setting metafield for product ${productId}:`, error)
    // Don't throw - metafields are optional
    return null
  }
}

/**
 * Sets multiple metafields on a product
 */
export async function setProductMetafields(
  productId: string,
  metafields: ProductMetafield[],
): Promise<any[]> {
  const results: any[] = []

  for (const metafield of metafields) {
    try {
      const result = await setProductMetafield(productId, metafield)
      if (result) {
        results.push(result)
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to set metafield ${metafield.namespace}.${metafield.key}:`, error)
      // Continue with other metafields
    }
  }

  return results
}

/**
 * Gets metafields for a specific product
 */
async function getProductMetafieldsFromShopify(productId: string): Promise<any[]> {
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

/**
 * Fetches a metafield definition by ID to get namespace and key
 */
async function fetchMetafieldDefinition(metafieldDefinitionId: number): Promise<{ namespace: string; key: string; type: string } | null> {
  try {
    const response = await shopifyFetch2024(
      `metafield_definitions/${metafieldDefinitionId}.json`,
      { method: "GET" },
    )

    if (!response.ok) {
      console.error(`Failed to fetch metafield definition ${metafieldDefinitionId}: ${response.status}`)
      return null
    }

    const data = await safeJsonParse(response)
    const definition = data.metafield_definition
    
    if (!definition) {
      return null
    }

    return {
      namespace: definition.namespace || "custom",
      key: definition.key || "",
      type: definition.type?.name || "url",
    }
  } catch (error) {
    console.error(`Error fetching metafield definition ${metafieldDefinitionId}:`, error)
    return null
  }
}

/**
 * Updates an existing metafield on a product by metafield ID
 */
async function updateProductMetafieldById(
  productId: string,
  metafieldId: number,
  value: string,
): Promise<any> {
  try {
    const response = await shopifyFetch2024(
      `products/${productId}/metafields/${metafieldId}.json`,
      {
        method: "PUT",
        body: JSON.stringify({
          metafield: {
            value: value,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to update metafield ${metafieldId} for product ${productId}:`, errorText)
      return null
    }

    const data = await safeJsonParse(response)
    return data.metafield
  } catch (error) {
    console.error(`Error updating metafield ${metafieldId} for product ${productId}:`, error)
    return null
  }
}

/**
 * Sets PDF URL metafield for Street Design PDF
 * Metafield Definition ID: 244948926850
 */
export async function setStreetDesignPdfMetafield(
  productId: string,
  pdfUrl: string,
): Promise<any> {
  const STREET_DESIGN_PDF_METAFIELD_DEFINITION_ID = 244948926850
  
  try {
    // First, fetch the metafield definition to get namespace and key
    const definition = await fetchMetafieldDefinition(STREET_DESIGN_PDF_METAFIELD_DEFINITION_ID)
    
    if (!definition) {
      console.error("Could not fetch Street Design PDF metafield definition")
      return null
    }

    console.log(`Setting Street Design PDF metafield with namespace: ${definition.namespace}, key: ${definition.key}`)
    
    // Check if the metafield already exists on the product
    const existingMetafields = await getProductMetafieldsFromShopify(productId)
    
    const existingMetafield = existingMetafields.find(
      (m: any) => m.namespace === definition.namespace && m.key === definition.key
    )
    
    if (existingMetafield) {
      // Update existing metafield by ID
      console.log(`Updating existing Street Design PDF metafield (ID: ${existingMetafield.id})`)
      return await updateProductMetafieldById(productId, existingMetafield.id, pdfUrl)
    } else {
      // Create new metafield
      console.log("Creating new Street Design PDF metafield")
      return await setProductMetafield(productId, {
        namespace: definition.namespace,
        key: definition.key,
        value: pdfUrl,
        type: definition.type,
      })
    }
  } catch (error) {
    console.error(`Error setting Street Design PDF metafield for product ${productId}:`, error)
    return null
  }
}

/**
 * Deletes a product from Shopify
 */
export async function deleteShopifyProduct(productId: string): Promise<boolean> {
  try {
    const response = await shopifyFetch2024(
      `products/${productId}.json`,
      {
        method: "DELETE",
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to delete product ${productId} from Shopify:`, errorText)
      return false
    }

    console.log(`Product ${productId} deleted from Shopify successfully`)
    return true
  } catch (error) {
    console.error(`Error deleting product ${productId} from Shopify:`, error)
    return false
  }
}

/**
 * Sets print files URL metafield for custom.print_files
 * Metafield Definition ID: 270101873026
 */
export async function setPrintFilesMetafield(
  productId: string,
  pdfUrl: string,
): Promise<any> {
  const PRINT_FILES_METAFIELD_DEFINITION_ID = 270101873026
  
  try {
    // First, fetch the metafield definition to get namespace and key
    const definition = await fetchMetafieldDefinition(PRINT_FILES_METAFIELD_DEFINITION_ID)
    
    if (!definition) {
      console.error("Could not fetch print files metafield definition, using default custom.print_files")
      // Fallback to known namespace/key
      return await setProductMetafield(productId, {
        namespace: "custom",
        key: "print_files",
        value: pdfUrl,
        type: "url",
      })
    }

    console.log(`Setting print files metafield with namespace: ${definition.namespace}, key: ${definition.key}`)
    
    // Check if the metafield already exists on the product
    const existingMetafields = await getProductMetafieldsFromShopify(productId)
    
    const existingMetafield = existingMetafields.find(
      (m: any) => m.namespace === definition.namespace && m.key === definition.key
    )
    
    if (existingMetafield) {
      // Update existing metafield by ID
      console.log(`Updating existing print files metafield (ID: ${existingMetafield.id})`)
      return await updateProductMetafieldById(productId, existingMetafield.id, pdfUrl)
    } else {
      // Create new metafield
      console.log("Creating new print files metafield")
      return await setProductMetafield(productId, {
        namespace: definition.namespace,
        key: definition.key,
        value: pdfUrl,
        type: definition.type,
      })
    }
  } catch (error) {
    console.error(`Error setting print files metafield for product ${productId}:`, error)
    return null
  }
}

/**
 * Creates product variants
 * Note: Variants are typically created as part of the product creation
 * This function can be used to update or add variants after initial creation
 */
export async function createProductVariant(
  productId: string,
  variant: ProductVariant,
): Promise<any> {
  try {
    const variantData: any = {
      price: variant.price,
      sku: variant.sku || "",
    }

    if (variant.compare_at_price) {
      variantData.compare_at_price = variant.compare_at_price
    }

    if (variant.inventory_quantity !== undefined) {
      variantData.inventory_quantity = variant.inventory_quantity
    }

    if (variant.inventory_management) {
      variantData.inventory_management = variant.inventory_management
    }

    if (variant.requires_shipping !== undefined) {
      variantData.requires_shipping = variant.requires_shipping
    }

    if (variant.weight !== undefined) {
      variantData.weight = variant.weight
    }

    if (variant.weight_unit) {
      variantData.weight_unit = variant.weight_unit
    }

    // Handle options if provided
    if (variant.options) {
      // Convert options object to array format Shopify expects
      const optionsArray: string[] = []
      for (const [key, value] of Object.entries(variant.options)) {
        optionsArray.push(value)
      }
      // Note: Shopify expects options to be set at product level, not variant level
      // For now, we'll just store the option values
    }

    const response = await shopifyFetch2024(
      `products/${productId}/variants.json`,
      {
        method: "POST",
        body: JSON.stringify({
          variant: variantData,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create variant for product ${productId}:`, errorText)
      throw new Error(`Failed to create variant: ${response.status}`)
    }

    const data = await safeJsonParse(response)
    return data.variant
  } catch (error) {
    console.error(`Error creating variant for product ${productId}:`, error)
    throw error
  }
}

/**
 * Generates a handle from title if not provided
 */
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255)
}

/**
 * Creates a product in Shopify
 */
export async function createShopifyProduct(
  productData: ProductSubmissionData,
): Promise<any> {
  try {
    // Prepare product payload
    const productPayload: any = {
      title: productData.title,
      vendor: productData.vendor,
      handle: productData.handle || generateHandle(productData.title),
      product_type: productData.product_type || "",
    }

    // Add description if provided
    if (productData.description) {
      productPayload.body_html = productData.description
    }

    // Add tags
    if (productData.tags && productData.tags.length > 0) {
      productPayload.tags = productData.tags.join(", ")
    }

    // Add vendor tag
    const tags = productPayload.tags ? productPayload.tags.split(", ") : []
    if (!tags.includes(productData.vendor)) {
      tags.push(productData.vendor)
    }
    productPayload.tags = tags.join(", ")

    // Prepare variants
    if (productData.variants && productData.variants.length > 0) {
      productPayload.variants = productData.variants.map((variant) => {
        const variantData: any = {
          price: variant.price,
          sku: variant.sku || "",
        }

        if (variant.compare_at_price) {
          variantData.compare_at_price = variant.compare_at_price
        }

        if (variant.inventory_quantity !== undefined) {
          variantData.inventory_quantity = variant.inventory_quantity
        }

        if (variant.inventory_management) {
          variantData.inventory_management = variant.inventory_management
        }

        if (variant.requires_shipping !== undefined) {
          variantData.requires_shipping = variant.requires_shipping
        } else {
          variantData.requires_shipping = true // Default to requiring shipping
        }

        if (variant.weight !== undefined) {
          variantData.weight = variant.weight
        }

        if (variant.weight_unit) {
          variantData.weight_unit = variant.weight_unit
        }

        return variantData
      })
    } else {
      // Default variant if none provided
      productPayload.variants = [
        {
          price: "0.00",
          sku: "",
          requires_shipping: true,
        },
      ]
    }

    // Create product
    const response = await shopifyFetch2024(
      `products.json`,
      {
        method: "POST",
        body: JSON.stringify({
          product: productPayload,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to create product:", errorText)
      throw new Error(`Failed to create product: ${response.status} - ${errorText}`)
    }

    const data = await safeJsonParse(response)
    const product = data.product

    // Upload images if provided
    if (productData.images && productData.images.length > 0) {
      try {
        await uploadProductImages(product.id.toString(), productData.images)
      } catch (error) {
        console.error("Failed to upload some images, but product was created:", error)
        // Continue - product was created successfully
      }
    }

    // Set metafields if provided
    if (productData.metafields && productData.metafields.length > 0) {
      try {
        await setProductMetafields(product.id.toString(), productData.metafields)
      } catch (error) {
        console.error("Failed to set some metafields, but product was created:", error)
        // Continue - product was created successfully
      }
    }

    return product
  } catch (error) {
    console.error("Error creating Shopify product:", error)
    throw error
  }
}

