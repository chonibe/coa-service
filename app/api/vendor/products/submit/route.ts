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
    const isTimed = data.metafields.find(
      (m: any) => m.namespace === "custom" && m.key === "timed_edition" && m.value === "true"
    )

    if (!isTimed) {
      const editionSizeMetafield = data.metafields.find(
        (m: any) => m.namespace === "custom" && m.key === "edition_size"
      )
      if (!editionSizeMetafield || !editionSizeMetafield.value) {
        errors.push("Edition size is required")
      }
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
          // Auto-generate SKU if missing
      if (!variant.sku || typeof variant.sku !== "string" || variant.sku.trim().length === 0) {
        // Generate SKU if missing
        const vendorPrefix = (data.vendor || "VENDOR")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 6)
        const productCode = (data.title || "PRODUCT")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 6)
        const variantSuffix = index > 0 ? `-V${index + 1}` : ""
        variant.sku = `${vendorPrefix}-${productCode}${variantSuffix}`
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

    // If first image is still a base64 data URL (shouldn't happen after upload), log warning
    if (productData.images && productData.images.length > 0 && productData.images[0].src) {
      const firstImage = productData.images[0]
      if (firstImage.src.startsWith("data:image/")) {
        console.warn("Masked image is still base64. This should have been uploaded earlier. Attempting to upload now...")
        try {
          // Convert base64 to buffer
          const base64Data = firstImage.src.split(",")[1]
          const buffer = Buffer.from(base64Data, "base64")
          
          // Generate file path
          const timestamp = Date.now()
          const sanitizedVendorName = vendor.vendor_name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
          const fileName = `${timestamp}_masked_product_image.png`
          const filePath = `product_submissions/${sanitizedVendorName}/${fileName}`
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, buffer, {
              contentType: "image/png",
              upsert: false,
            })
          
          if (uploadError) {
            console.error("Error uploading masked image to library:", uploadError)
            // Continue with submission even if upload fails
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(filePath)
            
            // Update image src to use the uploaded URL
            productData.images[0].src = urlData.publicUrl
            console.log(`Masked image saved to library: ${urlData.publicUrl}`)
          }
        } catch (error) {
          console.error("Error processing masked image:", error)
          // Continue with submission even if processing fails
        }
      }
    }

    // Validate and handle series assignment
    let seriesId: string | null = productData.series_id || null
    const seriesMetadata: any = {
      series_name: productData.series_name || null,
      is_locked: productData.is_locked || false,
      unlock_order: productData.unlock_order || null,
    }

    if (seriesId) {
      // Verify series belongs to vendor
      const { data: series, error: seriesError } = await supabase
        .from("artwork_series")
        .select("id, name")
        .eq("id", seriesId)
        .eq("vendor_id", vendor.id)
        .single()

      if (seriesError || !series) {
        return NextResponse.json(
          { error: "Series not found or does not belong to vendor" },
          { status: 400 },
        )
      }

      // Update series metadata with actual series name
      seriesMetadata.series_name = series.name
    } else {
      // Clear series metadata if no series
      seriesId = null
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("vendor_product_submissions")
      .insert({
        vendor_id: vendor.id,
        vendor_name: vendor.vendor_name,
        status: "pending",
        product_data: productData as any,
        series_id: seriesId,
        series_metadata: Object.keys(seriesMetadata).some(k => seriesMetadata[k] !== null && seriesMetadata[k] !== undefined) ? seriesMetadata : null,
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
          seriesId: seriesId,
        },
      })
      return NextResponse.json(
        { error: "Failed to create submission", message: submissionError.message },
        { status: 500 },
      )
    }

    // If series is assigned, create series member entry
    if (seriesId && submission) {
      const { error: memberError } = await supabase
        .from("artwork_series_members")
        .insert({
          series_id: seriesId,
          submission_id: submission.id,
          is_locked: seriesMetadata.is_locked || false,
          unlock_order: seriesMetadata.unlock_order || null,
          display_order: 0, // Will be updated later if needed
        })

      if (memberError) {
        console.error("Error creating series member:", memberError)
        // Don't fail submission if member creation fails - can be fixed later
      }
    }

    // Handle benefits: Create series-level benefits immediately, artwork-level benefits will be created when product is published
    if (productData.benefits && Array.isArray(productData.benefits) && productData.benefits.length > 0) {
      const seriesLevelBenefits = productData.benefits.filter((b: any) => b.is_series_level && seriesId)
      const artworkLevelBenefits = productData.benefits.filter((b: any) => !b.is_series_level)

      // Create series-level benefits immediately
      for (const benefit of seriesLevelBenefits) {
        try {
          const { error: benefitError } = await supabase.from("product_benefits").insert({
            series_id: seriesId,
            product_id: null,
            hidden_series_id: (benefit as any).hidden_series_id || null,
            vendor_name: vendor.vendor_name,
            benefit_type_id: benefit.benefit_type_id,
            title: benefit.title,
            description: benefit.description || null,
            content_url: benefit.content_url || null,
            access_code: benefit.access_code || null,
            starts_at: benefit.starts_at || null,
            expires_at: benefit.expires_at || null,
            vip_artwork_id: (benefit as any).vip_artwork_id || null,
            vip_series_id: (benefit as any).vip_series_id || null,
            credits_amount: (benefit as any).credits_amount || null,
            drop_date: (benefit as any).drop_date || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (benefitError) {
            console.error("Error creating series-level benefit:", benefitError)
            // Don't fail submission if benefit creation fails
          }
        } catch (error) {
          console.error("Error processing series-level benefit:", error)
          // Continue with other benefits
        }
      }

      // Artwork-level benefits are stored in product_data and will be created when product is published
      // (They need product_id which is only available after publication)
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

