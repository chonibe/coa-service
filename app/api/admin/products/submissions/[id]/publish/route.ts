import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import { createShopifyProduct } from "@/lib/shopify/product-creation"
import { ensureVendorCollection, assignProductToCollection } from "@/lib/shopify/collections"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const adminEmail = getAdminEmailFromCookieStore(request.cookies)
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin email not found" }, { status: 401 })
  }

  try {
    const supabase = createClient()

    // Get existing submission
    const { data: submission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      )
    }

    if (submission.status !== "approved") {
      return NextResponse.json(
        { error: `Cannot publish submission with status: ${submission.status}. Submission must be approved first.` },
        { status: 400 },
      )
    }

    if (submission.shopify_product_id) {
      return NextResponse.json(
        { error: "Product already published to Shopify" },
        { status: 400 },
      )
    }

    // Get vendor info
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("id", submission.vendor_id)
      .single()

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 },
      )
    }

    // Ensure vendor collection exists
    const { collectionId, handle } = await ensureVendorCollection(
      vendor.id,
      vendor.vendor_name,
    )

    // Create product in Shopify
    const productData = submission.product_data as any
    const shopifyProduct = await createShopifyProduct(productData)

    if (!shopifyProduct || !shopifyProduct.id) {
      throw new Error("Failed to create product in Shopify")
    }

    const shopifyProductId = shopifyProduct.id.toString()

    // Assign product to vendor collection
    try {
      await assignProductToCollection(shopifyProductId, collectionId)
    } catch (error) {
      console.error("Failed to assign product to collection, but product was created:", error)
      // Continue - product was created successfully
    }

    // Update submission to published
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("vendor_product_submissions")
      .update({
        status: "published",
        shopify_product_id: shopifyProductId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating submission after publish:", updateError)
      // Product was created in Shopify, but we failed to update the record
      // Log this for manual reconciliation
      return NextResponse.json(
        {
          error: "Product created in Shopify but failed to update submission record",
          shopify_product_id: shopifyProductId,
          message: updateError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      shopify_product: {
        id: shopifyProductId,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
      },
      message: "Product published successfully to Shopify",
    })
  } catch (error: any) {
    console.error("Error publishing product:", error)
    return NextResponse.json(
      { error: "Failed to publish product", message: error.message },
      { status: 500 },
    )
  }
}

