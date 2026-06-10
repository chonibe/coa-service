/**
 * Shopify product handle for the Street Lamp PDP ("The Lamp" in collector-first nav).
 */
export function getStreetLampProductHandle(): string {
  return (
    process.env.NEXT_PUBLIC_STREET_LAMP_PRODUCT_HANDLE?.trim() || 'street_lamp'
  )
}

export function streetLampProductPath(): string {
  return `/shop/${getStreetLampProductHandle()}`
}
