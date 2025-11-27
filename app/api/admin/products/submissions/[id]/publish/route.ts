import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getAdminEmailFromCookieStore } from "@/lib/admin-session"
import { createClient } from "@/lib/supabase/server"
import { createShopifyProduct } from "@/lib/shopify/product-creation"
import { ensureVendorCollection, assignProductToCollection } from "@/lib/shopify/collections"
import {
  generateProductDescription,
  extractEditionSize,
  extractSeriesSize,
  extractReleaseDate,
} from "@/lib/shopify/product-description-generator"

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

    // Get vendor info including bio and instagram_url
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, vendor_name, bio, instagram_url")
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

    // Prepare product data
    const productData = submission.product_data as any

    // Extract metafields for edition size, series size, and release date
    const metafields = productData.metafields || []
    const editionSize = extractEditionSize(metafields)
    const seriesSize = extractSeriesSize(metafields)
    const releaseDate = extractReleaseDate(metafields) || submission.published_at || new Date().toISOString()

    // Generate the product description HTML
    const generatedDescription = generateProductDescription({
      title: productData.title,
      vendorName: vendor.vendor_name,
      editionSize: editionSize,
      seriesSize: seriesSize,
      releaseDate: releaseDate,
      vendorBio: vendor.bio || null,
      instagramUrl: vendor.instagram_url || null,
      existingDescription: productData.description || null,
    })

    // Update product data with generated description
    const productDataWithDescription = {
      ...productData,
      description: generatedDescription,
    }

    // Create product in Shopify
    const shopifyProduct = await createShopifyProduct(productDataWithDescription)

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

    // Set PDF metafields if PDF URL exists
    if (productData.print_files?.pdf_url) {
      try {
        const { setStreetDesignPdfMetafield, setPrintFilesMetafield, setProductMetafield } = await import("@/lib/shopify/product-creation")
        
        // Set the Street Design PDF metafield (by definition ID 244948926850)
        await setStreetDesignPdfMetafield(shopifyProductId, productData.print_files.pdf_url)
        console.log(`Set Street Design PDF metafield for product ${shopifyProductId}`)
        
        // Set print files metafield (custom.print_files, definition ID 270101873026)
        await setPrintFilesMetafield(shopifyProductId, productData.print_files.pdf_url)
        console.log(`Set custom.print_files metafield for product ${shopifyProductId}`)
        
        // Also set custom.pdf_link metafield with the Supabase PDF URL
        await setProductMetafield(shopifyProductId, {
          namespace: "custom",
          key: "pdf_link",
          value: productData.print_files.pdf_url,
          type: "url",
        })
        console.log(`Set custom.pdf_link metafield for product ${shopifyProductId}`)
      } catch (error) {
        console.error("Failed to set PDF metafields, but product was created:", error)
        // Continue - product was created successfully
      }
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

