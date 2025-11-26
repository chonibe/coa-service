import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { ProductSubmissionData } from "@/types/product-submission"

/**
 * Generates a handle from title
 */
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255)
}

/**
 * Validates product submission data
 */
function validateProductSubmission(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
    errors.push("Title is required")
  }

  if (!data.vendor || typeof data.vendor !== "string") {
    errors.push("Vendor is required")
  }

  // Validate edition size metafield
  if (!data.metafields || !Array.isArray(data.metafields)) {
    errors.push("Edition size is required")
  } else {
    const editionSizeMetafield = data.metafields.find(
      (m: any) => m.namespace === "custom" && m.key === "edition_size"
    )
    if (!editionSizeMetafield || !editionSizeMetafield.value) {
      errors.push("Edition size is required")
    }
  }

  if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
    errors.push("At least one variant is required")
  } else {
    data.variants.forEach((variant: any, index: number) => {
      if (!variant || typeof variant !== "object") {
        errors.push(`Variant ${index + 1}: Invalid variant data`)
        return
      }
      if (!variant.price || typeof variant.price !== "string") {
        errors.push(`Variant ${index + 1}: Price is required`)
      }
      // Validate price format
      if (variant.price && typeof variant.price === "string" && !/^\d+(\.\d{1,2})?$/.test(variant.price)) {
        errors.push(`Variant ${index + 1}: Price must be a valid number`)
      }
      // Validate SKU is present (should be auto-generated)
      if (!variant.sku || typeof variant.sku !== "string" || variant.sku.trim().length === 0) {
        errors.push(`Variant ${index + 1}: SKU is required`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const body = await request.json()
    const productData: ProductSubmissionData = body.product_data

    if (!productData) {
      console.error("Product submission error: No product data provided")
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 },
      )
    }

    // Ensure arrays are properly initialized
    if (!Array.isArray(productData.variants)) {
      console.error("Product submission error: Variants is not an array", productData.variants)
      return NextResponse.json(
        { error: "Invalid product data: variants must be an array" },
        { status: 400 },
      )
    }
    
    if (!Array.isArray(productData.metafields)) {
      productData.metafields = []
    }
    
    if (!Array.isArray(productData.images)) {
      productData.images = []
    }
    
    if (!Array.isArray(productData.tags)) {
      productData.tags = []
    }

    // Ensure vendor is set correctly
    productData.vendor = vendor.vendor_name

    // Generate handle if not provided
    if (!productData.handle || productData.handle.trim().length === 0) {
      productData.handle = generateHandle(productData.title)
    }

    // Validate submission
    const validation = validateProductSubmission(productData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 },
      )
    }

    // Add vendor tag if not already present
    if (!productData.tags || !Array.isArray(productData.tags)) {
      productData.tags = []
    }
    if (!productData.tags.includes(vendor.vendor_name)) {
      productData.tags.push(vendor.vendor_name)
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("vendor_product_submissions")
      .insert({
        vendor_id: vendor.id,
        vendor_name: vendor.vendor_name,
        status: "pending",
        product_data: productData as any,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (submissionError) {
      console.error("Error creating submission:", {
        message: submissionError.message,
        details: submissionError,
        productData: {
          title: productData.title,
          vendor: productData.vendor,
          variantsCount: productData.variants?.length,
          metafieldsCount: productData.metafields?.length,
          imagesCount: productData.images?.length,
        },
      })
      return NextResponse.json(
        { error: "Failed to create submission", message: submissionError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
      status: submission.status,
      message: "Product submitted for approval",
    })
  } catch (error: any) {
    console.error("Error submitting product:", error)
    return NextResponse.json(
      { error: "Failed to submit product", message: error.message },
      { status: 500 },
    )
  }
}

