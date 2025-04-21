// app/api/webhooks/shopify/orders/route.ts
const isLimitedEdition = (item: any) => {
  return (
    item.properties?.some((prop: any) => prop.name === "limited_edition" && prop.value === "true") ||
    (item.variant &&
      item.variant.product &&
      item.variant.product.tags &&
      typeof item.variant.product.tags === "string" &&
      item.variant.product.tags.toLowerCase().includes("limited"))
  )
}

// Remove the return statement
// return isLimitedEdition
