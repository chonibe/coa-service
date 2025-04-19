import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const shopifyDomain = process.env.SHOPIFY_SHOP
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN

    if (!shopifyDomain || !accessToken) {
      return NextResponse.json({
        success: false,
        error: "Shopify credentials not configured",
      })
    }

    // Test connection by fetching shop info
    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Shopify API error: ${errorText}`,
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: `Connected to ${data.shop.name} (${data.shop.myshopify_domain})`,
      shop: data.shop,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown Shopify connection error",
    })
  }
}
