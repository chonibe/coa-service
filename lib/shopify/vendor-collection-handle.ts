/**
 * Pure helpers for vendor → Shopify collection handle/title.
 * Safe for client bundles (no env or Admin API dependencies).
 */

/** Generates a handle from vendor name for use in Shopify collection handles */
export function getVendorCollectionHandle(vendorName: string): string {
  return vendorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Gets the collection title for a vendor */
export function getVendorCollectionTitle(vendorName: string): string {
  return `${vendorName} Collection`
}
