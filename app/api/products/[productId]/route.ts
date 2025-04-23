import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  const productId = params.productId

  try {
    // Fetch product data from Shopify
    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/products/${productId}.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Failed to fetch product: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, product: data.product })
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch product" }, { status: 500 })
  }
}
