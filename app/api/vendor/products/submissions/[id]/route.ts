import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: submission, error } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .eq("vendor_name", vendorName)
      .single()

    if (error || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      )
    }

    // Load existing benefits from database if product is published
    let existingBenefits: any[] = []
    if (submission.shopify_product_id) {
      // Load artwork-level benefits
      const { data: productBenefits } = await supabase
        .from("product_benefits")
        .select(`
          *,
          benefit_types (name, icon)
        `)
        .eq("product_id", submission.shopify_product_id)
      
      if (productBenefits) {
        existingBenefits = productBenefits.map((b: any) => ({
          id: b.id,
          benefit_type_id: b.benefit_type_id,
          title: b.title,
          description: b.description,
          content_url: b.content_url,
          access_code: b.access_code,
          starts_at: b.starts_at,
          expires_at: b.expires_at,
          is_series_level: false,
        }))
      }
    }

    // Also load series-level benefits if series is assigned
    if (submission.series_id) {
      const { data: seriesBenefits } = await supabase
        .from("product_benefits")
        .select(`
          *,
          benefit_types (name, icon)
        `)
        .eq("series_id", submission.series_id)
      
      if (seriesBenefits) {
        const seriesLevelBenefits = seriesBenefits.map((b: any) => ({
          id: b.id,
          benefit_type_id: b.benefit_type_id,
          title: b.title,
          description: b.description,
          content_url: b.content_url,
          access_code: b.access_code,
          starts_at: b.starts_at,
          expires_at: b.expires_at,
          is_series_level: true,
        }))
        existingBenefits = [...existingBenefits, ...seriesLevelBenefits]
      }
    }

    // Merge with benefits from product_data (for artwork-level benefits not yet in DB)
    const productDataBenefits = (submission.product_data as any)?.benefits || []
    const mergedBenefits = [...existingBenefits]
    
    // Add benefits from product_data that don't have an ID (not yet created in DB)
    for (const benefit of productDataBenefits) {
      if (!benefit.id && !benefit.is_series_level) {
        mergedBenefits.push(benefit)
      }
    }

    // Update product_data with merged benefits
    const updatedProductData = {
      ...submission.product_data,
      benefits: mergedBenefits,
    }

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        product_data: updatedProductData,
      },
    })
  } catch (error: any) {
    console.error("Error fetching submission:", error)
    return NextResponse.json(
      { error: "Failed to fetch submission", message: error.message },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    // Get existing submission
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)
      .single()

    if (fetchError || !existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found or you don't have permission to update it" },
        { status: 404 },
      )
    }

    // Only allow updates for pending or rejected submissions
    if (existingSubmission.status !== "pending" && existingSubmission.status !== "rejected") {
      return NextResponse.json(
        {
          error: "Cannot update submission",
          message: "You can only update pending or rejected submissions.",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const productData = body.product_data

    if (!productData) {
      return NextResponse.json(
        { error: "Product data is required" },
        { status: 400 },
      )
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

      seriesMetadata.series_name = series.name
    } else {
      seriesId = null
    }

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabase
      .from("vendor_product_submissions")
      .update({
        product_data: productData as any,
        series_id: seriesId,
        series_metadata: Object.keys(seriesMetadata).some(k => seriesMetadata[k] !== null && seriesMetadata[k] !== undefined) ? seriesMetadata : null,
        status: "pending", // Reset to pending when updated
        submitted_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("vendor_id", vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating submission:", updateError)
      return NextResponse.json(
        { error: "Failed to update submission", message: updateError.message },
        { status: 500 },
      )
    }

    // Handle series member updates
    const oldSeriesId = existingSubmission.series_id
    
    // If series changed, remove from old series first
    if (oldSeriesId && oldSeriesId !== seriesId) {
      await supabase
        .from("artwork_series_members")
        .delete()
        .eq("submission_id", params.id)
        .eq("series_id", oldSeriesId)
    }

    // Update or create member entry for new/current series
    if (seriesId) {
      // Check if member already exists for this series
      const { data: existingMember } = await supabase
        .from("artwork_series_members")
        .select("id")
        .eq("series_id", seriesId)
        .eq("submission_id", params.id)
        .maybeSingle()

      if (existingMember) {
        // Update existing member
        await supabase
          .from("artwork_series_members")
          .update({
            is_locked: seriesMetadata.is_locked || false,
            unlock_order: seriesMetadata.unlock_order || null,
          })
          .eq("id", existingMember.id)
      } else {
        // Create new member
        await supabase
          .from("artwork_series_members")
          .insert({
            series_id: seriesId,
            submission_id: params.id,
            is_locked: seriesMetadata.is_locked || false,
            unlock_order: seriesMetadata.unlock_order || null,
            display_order: 0,
          })
      }
    } else if (oldSeriesId) {
      // Remove from series if series_id was cleared
      await supabase
        .from("artwork_series_members")
        .delete()
        .eq("submission_id", params.id)
        .eq("series_id", oldSeriesId)
    }

    // Handle benefits: Update series-level benefits, store artwork-level benefits in product_data
    if (productData.benefits && Array.isArray(productData.benefits) && productData.benefits.length > 0) {
      const seriesLevelBenefits = productData.benefits.filter((b: any) => b.is_series_level && seriesId)
      const artworkLevelBenefits = productData.benefits.filter((b: any) => !b.is_series_level)

      // Get existing series-level benefits from database
      if (seriesId) {
        const { data: existingSeriesBenefits } = await supabase
          .from("product_benefits")
          .select("id")
          .eq("series_id", seriesId)

        const existingIds = new Set((existingSeriesBenefits || []).map((b: any) => b.id))
        const newBenefitIds = new Set(seriesLevelBenefits.filter((b: any) => b.id).map((b: any) => b.id))

        // Delete benefits that were removed
        for (const existingId of existingIds) {
          if (!newBenefitIds.has(existingId)) {
            await supabase.from("product_benefits").delete().eq("id", existingId).eq("series_id", seriesId)
          }
        }

        // Create or update series-level benefits
        for (const benefit of seriesLevelBenefits) {
          if (benefit.id && existingIds.has(benefit.id)) {
            // Update existing benefit
            await supabase
              .from("product_benefits")
              .update({
                benefit_type_id: benefit.benefit_type_id,
                title: benefit.title,
                description: benefit.description || null,
                content_url: benefit.content_url || null,
                access_code: benefit.access_code || null,
                starts_at: benefit.starts_at || null,
                expires_at: benefit.expires_at || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", benefit.id)
          } else {
            // Create new benefit
            await supabase.from("product_benefits").insert({
              series_id: seriesId,
              product_id: null,
              vendor_name: vendor.vendor_name,
              benefit_type_id: benefit.benefit_type_id,
              title: benefit.title,
              description: benefit.description || null,
              content_url: benefit.content_url || null,
              access_code: benefit.access_code || null,
              starts_at: benefit.starts_at || null,
              expires_at: benefit.expires_at || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          }
        }
      }

      // Artwork-level benefits are stored in product_data and will be created when product is published
    } else if (seriesId) {
      // If no benefits provided but series exists, check if we should clear series-level benefits
      // For now, we'll leave existing benefits intact unless explicitly removed
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: "Submission updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating submission:", error)
    return NextResponse.json(
      { error: "Failed to update submission", message: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()

    // Get existing submission to verify ownership and status
    const { data: submission, error: fetchError } = await supabase
      .from("vendor_product_submissions")
      .select("*")
      .eq("id", params.id)
      .eq("vendor_name", vendorName)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "Submission not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    // Only allow deletion for pending or rejected submissions
    if (submission.status !== "pending" && submission.status !== "rejected") {
      return NextResponse.json(
        {
          error: "Cannot delete submission",
          message: "You can only delete pending or rejected submissions. Contact admin to reject/unpublish approved or published submissions.",
        },
        { status: 400 },
      )
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from("vendor_product_submissions")
      .delete()
      .eq("id", params.id)
      .eq("vendor_name", vendorName)

    if (deleteError) {
      console.error("Error deleting submission:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete submission", message: deleteError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting submission:", error)
    return NextResponse.json(
      { error: "Failed to delete submission", message: error.message },
      { status: 500 },
    )
  }
}