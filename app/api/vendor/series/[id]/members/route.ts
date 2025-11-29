import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const seriesId = params.id

    // Verify series belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Fetch members
    const { data: members, error: membersError } = await supabase
      .from("artwork_series_members")
      .select("*")
      .eq("series_id", seriesId)
      .order("display_order", { ascending: true })
      .order("unlock_order", { ascending: true, nullsLast: true })

    if (membersError) {
      console.error("Error fetching members:", membersError)
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    // Enrich with artwork details and benefits
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        let artworkTitle = ""
        let artworkImage = ""
        let hasBenefits = false
        let benefitCount = 0

        if (member.submission_id) {
          const { data: submission } = await supabase
            .from("vendor_product_submissions")
            .select("product_data, shopify_product_id")
            .eq("id", member.submission_id)
            .single()

          if (submission?.product_data) {
            artworkTitle = (submission.product_data as any).title || ""
            const images = (submission.product_data as any).images || []
            artworkImage = images[0]?.src || ""
            
            // Check for benefits in product_data (for unpublished artworks)
            const productDataBenefits = (submission.product_data as any)?.benefits || []
            const productDataBenefitCount = productDataBenefits.filter((b: any) => !b.is_series_level).length
            
            // Check for benefits in database (for published artworks)
            let dbBenefitCount = 0
            if (submission.shopify_product_id) {
              const { data: dbBenefits } = await supabase
                .from("product_benefits")
                .select("id")
                .eq("product_id", submission.shopify_product_id)
              
              if (dbBenefits && dbBenefits.length > 0) {
                dbBenefitCount = dbBenefits.length
              }
            }
            
            // Use whichever has more benefits (should be same, but handle both cases)
            const totalBenefitCount = Math.max(productDataBenefitCount, dbBenefitCount)
            if (totalBenefitCount > 0) {
              hasBenefits = true
              benefitCount = totalBenefitCount
            }
          }
        }

        return {
          ...member,
          artwork_title: artworkTitle,
          artwork_image: artworkImage,
          has_benefits: hasBenefits,
          benefit_count: benefitCount,
        }
      })
    )

    return NextResponse.json({ members: enrichedMembers })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/[id]/members:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const seriesId = params.id

    // Verify series belongs to vendor
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id")
      .eq("id", seriesId)
      .eq("vendor_id", vendor.id)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    const body = await request.json()
    const { submission_id, shopify_product_id, is_locked, unlock_order, display_order } = body

    if (!submission_id && !shopify_product_id) {
      return NextResponse.json({ error: "Either submission_id or shopify_product_id is required" }, { status: 400 })
    }

    // Verify submission belongs to vendor
    if (submission_id) {
      const { data: submission, error: subError } = await supabase
        .from("vendor_product_submissions")
        .select("vendor_id")
        .eq("id", submission_id)
        .single()

      if (subError || !submission || submission.vendor_id !== vendor.id) {
        return NextResponse.json({ error: "Submission not found or does not belong to vendor" }, { status: 404 })
      }
    }

    // Create member
    const { data: member, error: createError } = await supabase
      .from("artwork_series_members")
      .insert({
        series_id: seriesId,
        submission_id: submission_id || null,
        shopify_product_id: shopify_product_id || null,
        is_locked: is_locked || false,
        unlock_order: unlock_order || null,
        display_order: display_order || 0,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating member:", createError)
      if (createError.code === "23505") {
        return NextResponse.json({ error: "This artwork is already in the series" }, { status: 400 })
      }
      return NextResponse.json({ error: "Failed to add member to series" }, { status: 500 })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error: any) {
    console.error("Error in POST /api/vendor/series/[id]/members:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

