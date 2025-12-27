import Client from "shopify-buy"

const SHOPIFY_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || "your-shopify-domain.myshopify.com"
const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "your-storefront-access-token"

export const shopifyClient = Client.buildClient({
  domain: SHOPIFY_DOMAIN,
  storefrontAccessToken: SHOPIFY_STOREFRONT_ACCESS_TOKEN,
})

export async function getShopifyProductById(productId: string) {
  try {
    const product = await shopifyClient.product.fetch(productId)
    return JSON.parse(JSON.stringify(product))
  } catch (error) {
    console.error(`Error fetching Shopify product ${productId}:`, error)
    return null
  }
}

export async function createCheckout() {
  try {
    return await shopifyClient.checkout.create()
  } catch (error) {
    console.error("Error creating Shopify checkout:", error)
    return null
  }
}

export async function addItemToCheckout(checkoutId: string, variantId: string, quantity: number) {
  try {
    const lineItemsToAdd = [
      {
        variantId,
        quantity,
      },
    ]
    return await shopifyClient.checkout.addLineItems(checkoutId, lineItemsToAdd)
  } catch (error) {
    console.error("Error adding item to checkout:", error)
    return null
  }
}

export async function updateItemInCheckout(checkoutId: string, lineItemId: string, quantity: number) {
  try {
    const lineItemsToUpdate = [
      {
        id: lineItemId,
        quantity,
      },
    ]
    return await shopifyClient.checkout.updateLineItems(checkoutId, lineItemsToUpdate)
  } catch (error) {
    console.error("Error updating item in checkout:", error)
    return null
  }
}

export async function removeItemFromCheckout(checkoutId: string, lineItemIds: string[]) {
  try {
    return await shopifyClient.checkout.removeLineItems(checkoutId, lineItemIds)
  } catch (error) {
    console.error("Error removing item from checkout:", error)
    return null
  }
}

export async function fetchCheckout(checkoutId: string) {
  try {
    return await shopifyClient.checkout.fetch(checkoutId)
  } catch (error) {
    console.error("Error fetching checkout:", error)
    return null
  }
}


