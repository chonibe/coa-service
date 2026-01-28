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

    // Also check for series-level benefits
    const { data: seriesBenefits } = await supabase
      .from("product_benefits")
      .select("hidden_series_id, vip_artwork_id, vip_series_id")
      .eq("series_id", seriesId)
      .is("product_id", null)

    let seriesConnections: {
      hidden_series?: { id: string; name: string } | null
      vip_artwork?: { id: string; title: string } | null
      vip_series?: { id: string; name: string } | null
    } = {}

    // Extract series-level connections
    if (seriesBenefits && seriesBenefits.length > 0) {
      for (const benefit of seriesBenefits) {
        if (benefit.hidden_series_id) {
          const { data: hiddenSeries } = await supabase
            .from("artwork_series")
            .select("id, name")
            .eq("id", benefit.hidden_series_id)
            .single()
          if (hiddenSeries) {
            seriesConnections.hidden_series = { id: hiddenSeries.id, name: hiddenSeries.name }
          }
        }
        if (benefit.vip_artwork_id) {
          const { data: vipArtwork } = await supabase
            .from("vendor_product_submissions")
            .select("id, product_data")
            .eq("id", benefit.vip_artwork_id)
            .single()
          if (vipArtwork?.product_data) {
            seriesConnections.vip_artwork = {
              id: vipArtwork.id,
              title: (vipArtwork.product_data as any).title || "Untitled"
            }
          }
        }
        if (benefit.vip_series_id) {
          const { data: vipSeries } = await supabase
            .from("artwork_series")
            .select("id, name")
            .eq("id", benefit.vip_series_id)
            .single()
          if (vipSeries) {
            seriesConnections.vip_series = { id: vipSeries.id, name: vipSeries.name }
          }
        }
      }
    }

    // Enrich with artwork details and benefits
    // Also track orphaned members to filter out
    const enrichedMembersRaw = await Promise.all(
      (members || []).map(async (member) => {
        let artworkTitle = ""
        let artworkImage = ""
        let hasBenefits = false
        let benefitCount = 0
        let isOrphaned = false
        let submissionShopifyProductId: string | null = null
        let connections: {
          hidden_series?: { id: string; name: string } | null
          vip_artwork?: { id: string; title: string } | null
          vip_series?: { id: string; name: string } | null
        } = {}

        if (member.submission_id) {
          const { data: submission, error: submissionError } = await supabase
            .from("vendor_product_submissions")
            .select("product_data, shopify_product_id")
            .eq("id", member.submission_id)
            .maybeSingle()
          
          // Check if submission is orphaned (doesn't exist)
          if (!submission || submissionError) {
            console.warn(`[Series Members API] Orphaned member detected: member ${member.id} references missing submission ${member.submission_id}`)
            isOrphaned = true
            // Don't return early - we'll filter these out at the end
          } else {
            // Store shopify_product_id for later use
            submissionShopifyProductId = submission.shopify_product_id
          }

          if (submission?.product_data && !isOrphaned) {
            artworkTitle = (submission.product_data as any).title || ""
            const images = (submission.product_data as any).images || []
            artworkImage = images[0]?.src || ""
            
            // Check for benefits in product_data (for unpublished artworks)
            const productDataBenefits = (submission.product_data as any)?.benefits || []
            const productDataBenefitCount = productDataBenefits.filter((b: any) => !b.is_series_level).length
            
            // Extract connection data from product_data benefits
            for (const benefit of productDataBenefits) {
              if (benefit.hidden_series_id) {
                const { data: hiddenSeries } = await supabase
                  .from("artwork_series")
                  .select("id, name")
                  .eq("id", benefit.hidden_series_id)
                  .single()
                if (hiddenSeries) {
                  connections.hidden_series = { id: hiddenSeries.id, name: hiddenSeries.name }
                }
              }
              if (benefit.vip_artwork_id) {
                const { data: vipArtwork } = await supabase
                  .from("vendor_product_submissions")
                  .select("id, product_data")
                  .eq("id", benefit.vip_artwork_id)
                  .single()
                if (vipArtwork?.product_data) {
                  connections.vip_artwork = {
                    id: vipArtwork.id,
                    title: (vipArtwork.product_data as any).title || "Untitled"
                  }
                }
              }
              if (benefit.vip_series_id) {
                const { data: vipSeries } = await supabase
                  .from("artwork_series")
                  .select("id, name")
                  .eq("id", benefit.vip_series_id)
                  .single()
                if (vipSeries) {
                  connections.vip_series = { id: vipSeries.id, name: vipSeries.name }
                }
              }
            }
            
            // Check for benefits in database (for published artworks)
            let dbBenefitCount = 0
            if (submission.shopify_product_id) {
              const { data: dbBenefits } = await supabase
                .from("product_benefits")
                .select("id, hidden_series_id, vip_artwork_id, vip_series_id")
                .eq("product_id", submission.shopify_product_id)
              
              if (dbBenefits && dbBenefits.length > 0) {
                dbBenefitCount = dbBenefits.length
                
                // Extract connection data from database benefits
                for (const benefit of dbBenefits) {
                  if (benefit.hidden_series_id) {
                    const { data: hiddenSeries } = await supabase
                      .from("artwork_series")
                      .select("id, name")
                      .eq("id", benefit.hidden_series_id)
                      .single()
                    if (hiddenSeries) {
                      connections.hidden_series = { id: hiddenSeries.id, name: hiddenSeries.name }
                    }
                  }
                  if (benefit.vip_artwork_id) {
                    const { data: vipArtwork } = await supabase
                      .from("vendor_product_submissions")
                      .select("id, product_data")
                      .eq("id", benefit.vip_artwork_id)
                      .single()
                    if (vipArtwork?.product_data) {
                      connections.vip_artwork = {
                        id: vipArtwork.id,
                        title: (vipArtwork.product_data as any).title || "Untitled"
                      }
                    }
                  }
                  if (benefit.vip_series_id) {
                    const { data: vipSeries } = await supabase
                      .from("artwork_series")
                      .select("id, name")
                      .eq("id", benefit.vip_series_id)
                      .single()
                    if (vipSeries) {
                      connections.vip_series = { id: vipSeries.id, name: vipSeries.name }
                    }
                  }
                }
              }
            }
            
            // Merge with series-level connections
            if (seriesConnections.hidden_series) {
              connections.hidden_series = seriesConnections.hidden_series
            }
            if (seriesConnections.vip_artwork) {
              connections.vip_artwork = seriesConnections.vip_artwork
            }
            if (seriesConnections.vip_series) {
              connections.vip_series = seriesConnections.vip_series
            }
            
            // Use whichever has more benefits (should be same, but handle both cases)
            const totalBenefitCount = Math.max(productDataBenefitCount, dbBenefitCount)
            // Also count series-level benefits
            const seriesBenefitCount = seriesBenefits?.length || 0
            const finalBenefitCount = totalBenefitCount + seriesBenefitCount
            if (finalBenefitCount > 0) {
              hasBenefits = true
              benefitCount = finalBenefitCount
            }
          }
        } else {
          // Even without submission, check for series-level connections
          if (seriesConnections.hidden_series) {
            connections.hidden_series = seriesConnections.hidden_series
          }
          if (seriesConnections.vip_artwork) {
            connections.vip_artwork = seriesConnections.vip_artwork
          }
          if (seriesConnections.vip_series) {
            connections.vip_series = seriesConnections.vip_series
          }
          if (seriesBenefits && seriesBenefits.length > 0) {
            hasBenefits = true
            benefitCount = seriesBenefits.length
          }
        }

        // Get product ID if shopify_product_id exists
        let productId: string | null = null
        if (submissionShopifyProductId && !isOrphaned) {
          const { data: product } = await supabase
            .from("products")
            .select("id")
            .eq("product_id", submissionShopifyProductId)
            .eq("vendor_name", vendorName)
            .maybeSingle()
          
          productId = product?.id || null
        }

        return {
          ...member,
          artwork_title: artworkTitle,
          artwork_image: artworkImage,
          has_benefits: hasBenefits,
          benefit_count: benefitCount,
          connections: Object.keys(connections).length > 0 ? connections : undefined,
          product_id: productId, // Add product_id for linking
          is_orphaned: isOrphaned, // Flag for orphaned submissions
        }
      })
    )

    // Filter out orphaned members (submissions that no longer exist)
    const enrichedMembers = enrichedMembersRaw.filter(member => !member.is_orphaned)
    
    // Log if any orphaned members were filtered out
    const orphanedCount = enrichedMembersRaw.length - enrichedMembers.length
    if (orphanedCount > 0) {
      console.warn(`[Series Members API] Filtered out ${orphanedCount} orphaned member(s) from series ${seriesId}. Run cleanup_orphaned_series_members() to remove them permanently.`)
    }

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

    // Check if member already exists (idempotent operation)
    const existingMemberQuery = supabase
      .from("artwork_series_members")
      .select("*")
      .eq("series_id", seriesId)
    
    if (submission_id) {
      existingMemberQuery.eq("submission_id", submission_id)
    } else if (shopify_product_id) {
      existingMemberQuery.eq("shopify_product_id", shopify_product_id)
    }

    const { data: existingMember, error: checkError } = await existingMemberQuery.maybeSingle()

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "not found" which is fine
      console.error("Error checking existing member:", checkError)
      return NextResponse.json({ error: "Failed to check existing member" }, { status: 500 })
    }

    // If member already exists, return it (idempotent)
    if (existingMember) {
      return NextResponse.json({ member: existingMember }, { status: 200 })
    }

    // Create new member
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
        // Double-check: member might have been added between check and insert
        const { data: doubleCheckMember } = await existingMemberQuery.maybeSingle()
        if (doubleCheckMember) {
          return NextResponse.json({ member: doubleCheckMember }, { status: 200 })
        }
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

