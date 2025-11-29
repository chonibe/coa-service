/**
 * Helper functions to format vendor delivery addresses for Shopify orders
 */

export interface ShopifyAddressFormat {
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  country: string | null
  zip: string | null
  phone: string | null
  name: string | null
}

export interface VendorDeliveryAddress {
  delivery_address1: string | null
  delivery_address2: string | null
  delivery_city: string | null
  delivery_province: string | null
  delivery_country: string | null
  delivery_zip: string | null
  delivery_phone: string | null
  delivery_name: string | null
}

/**
 * Convert vendor delivery address to Shopify address format
 */
export function formatVendorAddressForShopify(
  vendorAddress: VendorDeliveryAddress
): ShopifyAddressFormat {
  return {
    address1: vendorAddress.delivery_address1 || null,
    address2: vendorAddress.delivery_address2 || null,
    city: vendorAddress.delivery_city || null,
    province: vendorAddress.delivery_province || null,
    country: vendorAddress.delivery_country || null,
    zip: vendorAddress.delivery_zip || null,
    phone: vendorAddress.delivery_phone || null,
    name: vendorAddress.delivery_name || null,
  }
}

/**
 * Check if vendor has a complete delivery address
 */
export function hasCompleteDeliveryAddress(
  vendorAddress: VendorDeliveryAddress
): boolean {
  return !!(
    vendorAddress.delivery_address1 &&
    vendorAddress.delivery_city &&
    vendorAddress.delivery_province &&
    vendorAddress.delivery_country &&
    vendorAddress.delivery_zip
  )
}

