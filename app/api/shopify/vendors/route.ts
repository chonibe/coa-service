import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const shopifyDomain = process.env.SHOPIFY_SHOP
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

    if (!shopifyDomain || !accessToken) {
      return NextResponse.json({ error: "Shopify credentials not configured" }, { status: 500 })
    }

    // Fetch products using Shopify Admin API
    // We'll fetch products and extract unique vendors from them
    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-10/products.json?limit=250&fields=vendor`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Shopify API error:", errorText)
      return NextResponse.json({ error: "Failed to fetch products from Shopify" }, { status: response.status })
    }

    const data = await response.json()

    // Extract unique vendors from products
    const vendors = [...new Set(data.products.map((product: any) => product.vendor))]
      .filter(Boolean) // Remove empty vendors
      .sort() // Sort alphabetically

    return NextResponse.json({ vendors })
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}
