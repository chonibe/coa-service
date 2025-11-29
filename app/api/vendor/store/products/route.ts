import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

// Proof print price constant
const PROOF_PRINT_PRICE = 8.00

// Function to fetch product price from Shopify by SKU
async function fetchProductPriceBySku(sku: string): Promise<number | null> {
  try {
    if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
      console.warn("Shopify credentials not configured, using default price")
      return null
    }

    // Search for product by SKU using GraphQL
    const graphqlQuery = `
      {
        products(first: 1, query: "sku:${sku}") {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    sku
                    price
                  }
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery }),
    })

    if (!response.ok) {
      console.error(`Failed to fetch product from Shopify: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.errors) {
      console.error("Shopify GraphQL errors:", data.errors)
      return null
    }

    const products = data.data?.products?.edges
    if (!products || products.length === 0) {
      console.warn(`Product with SKU ${sku} not found in Shopify`)
      return null
    }

    const product = products[0].node
    const variant = product.variants?.edges?.[0]?.node

    if (!variant || !variant.price) {
      console.warn(`No price found for product with SKU ${sku}`)
      return null
    }

    return parseFloat(variant.price)
  } catch (error) {
    console.error(`Error fetching product price for SKU ${sku}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor info to check discount eligibility and determine correct SKU
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, has_used_lamp_discount, tax_country, address")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Check if delivery address is set (required for Lamp purchases)
    // Use delivery_address if available, otherwise fall back to address
    const deliveryAddress = vendor.delivery_address || vendor.address
    const hasAddress = deliveryAddress && deliveryAddress.trim() !== ""

    // Determine correct SKU based on vendor address country (internal only)
    // streetlamp002 is for US, streetlamp001 is for EU/rest of world
    // Check tax_country first, then parse address for country information
    const vendorData = vendor as {
      id: number
      vendor_name: string
      has_used_lamp_discount: boolean | null
      tax_country: string | null
      address: string | null
    }
    
    const taxCountryUpper = (vendorData.tax_country || "").toUpperCase()
    const addressLower = (vendorData.address || "").toLowerCase()
    
    // US country indicators
    const isUS = 
      taxCountryUpper === "US" || 
      taxCountryUpper === "USA" ||
      taxCountryUpper === "UNITED STATES" ||
      /united states|usa\b|us\b|u\.s\.a|u\.s\./i.test(vendorData.address || "") ||
      /\b(california|new york|texas|florida|illinois|pennsylvania|ohio|georgia|north carolina|michigan|new jersey|virginia|washington|arizona|massachusetts|tennessee|indiana|missouri|maryland|wisconsin|colorado|minnesota|south carolina|alabama|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|new mexico|nebraska|west virginia|idaho|hawaii|new hampshire|maine|montana|rhode island|delaware|south dakota|north dakota|alaska|vermont|wyoming|district of columbia|dc)\b/i.test(addressLower)
    
    const lampSku = isUS ? "streetlamp002" : "streetlamp001"
    const lampName = "A Street Lamp"

    // Fetch actual price from Shopify
    const regularPrice = await fetchProductPriceBySku(lampSku)
    
    // Fallback price if Shopify fetch fails (should be configured)
    const fallbackPrice = 0
    const finalPrice = regularPrice ?? fallbackPrice

    // Lamp product - only show the one appropriate for vendor's location
    const lampProducts = [
      {
        sku: lampSku,
        name: lampName,
        type: "lamp" as const,
        regularPrice: finalPrice,
        discountEligible: !vendorData.has_used_lamp_discount,
        discountPercentage: vendorData.has_used_lamp_discount ? 0 : 50,
      },
    ]

    // Proof print product
    const proofPrintProduct = {
      type: "proof_print" as const,
      name: "Proof Print",
      price: PROOF_PRINT_PRICE,
      description: "Purchase a proof print of your artwork (up to 2 per artwork)",
    }

    return NextResponse.json({
      success: true,
      hasAddress,
      products: {
        lamps: lampProducts,
        proofPrints: proofPrintProduct,
      },
    })
  } catch (error: any) {
    console.error("Error fetching store products:", error)
    return NextResponse.json(
      { error: "Failed to fetch store products", message: error.message },
      { status: 500 }
    )
  }
}

