import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { updateAllProductsWithBarcodes, updateProductVariantsWithBarcodes } from "@/lib/shopify/product-creation"

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const { productId, limit } = await request.json()

    if (productId) {
      // Update a specific product
      console.log(`Updating barcodes for product: ${productId}`)
      await updateProductVariantsWithBarcodes(productId)

      return NextResponse.json({
        success: true,
        message: `Barcodes updated for product ${productId}`,
        productId
      })
    } else {
      // Update all products
      const updateLimit = Math.min(limit || 100, 1000) // Max 1000 to prevent abuse
      console.log(`Updating barcodes for up to ${updateLimit} products`)

      const result = await updateAllProductsWithBarcodes(updateLimit)

      return NextResponse.json({
        success: true,
        message: `Updated ${result.updated} out of ${result.total} products with barcodes`,
        ...result
      })
    }

  } catch (error: any) {
    console.error("Error updating barcodes:", error)
    return NextResponse.json(
      { error: "Failed to update barcodes", message: error.message },
      { status: 500 }
    )
  }
}