import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ShopifyProduct {
  id: number
  title: string
  vendor: string
  created_at: string
  updated_at: string
  status: string
  variants: Array<{
    id: number
    product_id: number
    title: string
    price: string
    sku: string
    position: number
    inventory_policy: string
    compare_at_price: string | null
    fulfillment_service: string
    inventory_management: string
    option1: string | null
    option2: string | null
    option3: string | null
    created_at: string
    updated_at: string
    taxable: boolean
    barcode: string
    grams: number
    image_id: number | null
    weight: number
    weight_unit: string
    inventory_item_id: number
    inventory_quantity: number
    old_inventory_quantity: number
    requires_shipping: boolean
  }>
  options: Array<{
    id: number
    product_id: number
    name: string
    position: number
    values: string[]
  }>
  images: Array<{
    id: number
    product_id: number
    position: number
    created_at: string
    updated_at: string
    alt: string | null
    width: number
    height: number
    src: string
    variant_ids: number[]
  }>
  image: {
    id: number
    product_id: number
    position: number
    created_at: string
    updated_at: string
    alt: string | null
    width: number
    height: number
    src: string
    variant_ids: number[]
  } | null
}

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const shopifyUrl = process.env.SHOPIFY_STORE_URL
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

  if (!shopifyUrl || !accessToken) {
    throw new Error("Shopify credentials not configured")
  }

  const response = await fetch(
    `${shopifyUrl}/admin/api/2023-10/products.json?limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch Shopify products: ${response.statusText}`)
  }

  const data = await response.json()
  return data.products
}

export async function POST(request: Request) {
  try {
    // Fetch products from Shopify
    const products = await fetchShopifyProducts()

    // Transform products for our database
    const transformedProducts = products.map(product => ({
      id: product.id.toString(),
      title: product.title,
      vendor: product.vendor,
      certificate_url: null, // This will be updated separately if needed
      created_at: product.created_at,
      updated_at: product.updated_at,
      status: product.status
    }))

    // Upsert products into our database
    const { error } = await supabase
      .from("products")
      .upsert(transformedProducts, {
        onConflict: "id",
        ignoreDuplicates: false
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${transformedProducts.length} products`,
      count: transformedProducts.length
    })
  } catch (error: any) {
    console.error("Error syncing products:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync products" },
      { status: 500 }
    )
  }
} 