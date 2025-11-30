import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const supabase = createClient()

    console.log('🔍 Getting all artworks from vendor catalogs...\n')

    // Get all vendor product submissions (artworks in catalog)
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from('vendor_product_submissions')
      .select('id, vendor_id, vendor_name, shopify_product_id, product_data')
      .in('status', ['pending', 'approved', 'published'])
      .order('vendor_id')
      .order('submitted_at', { ascending: false })

    if (submissionsError) {
      throw new Error(`Failed to fetch submissions: ${submissionsError.message}`)
    }

    if (!allSubmissions || allSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No artworks found in catalogs',
        summary: { totalArtworks: 0, vendorsProcessed: 0 }
      })
    }

    console.log(`📊 Found ${allSubmissions.length} artworks\n`)

    // Group by vendor
    const artworksByVendor = new Map<number, typeof allSubmissions>()
    for (const submission of allSubmissions) {
      const vendorId = submission.vendor_id
      if (!artworksByVendor.has(vendorId)) {
        artworksByVendor.set(vendorId, [])
      }
      artworksByVendor.get(vendorId)!.push(submission)
    }

    console.log(`📦 Found artworks across ${artworksByVendor.size} vendor(s)\n`)

    const results: any[] = []
    let totalAdded = 0
    let totalSkipped = 0
    let totalSeriesCreated = 0

    // Process each vendor
    for (const [vendorId, artworks] of artworksByVendor.entries()) {
      try {
        const vendorName = artworks[0].vendor_name
        console.log(`🔄 Processing vendor: ${vendorName} (${artworks.length} artworks)...`)

        // Check if "1st Edition" series exists
        let { data: series, error: seriesError } = await supabase
          .from('artwork_series')
          .select('id, name, vendor_id')
          .eq('vendor_id', vendorId)
          .eq('name', '1st Edition')
          .maybeSingle()

        if (seriesError) {
          console.error(`   ❌ Error fetching series: ${seriesError.message}`)
          results.push({
            vendorName,
            vendorId,
            success: false,
            error: seriesError.message
          })
          continue
        }

        // Create series if it doesn't exist
        if (!series) {
          console.log(`   📝 Creating "1st Edition" series...`)
          
          const { data: newSeries, error: createError } = await supabase
            .from('artwork_series')
            .insert({
              vendor_id: vendorId,
              vendor_name: vendorName,
              name: '1st Edition',
              description: 'Default series for all artworks',
              unlock_type: 'any_purchase',
              unlock_config: {},
              display_order: 0,
              is_active: true,
            })
            .select()
            .single()

          if (createError) {
            console.error(`   ❌ Error creating series: ${createError.message}`)
            results.push({
              vendorName,
              vendorId,
              success: false,
              error: createError.message
            })
            continue
          }

          series = newSeries
          totalSeriesCreated++
          console.log(`   ✅ Created series: "${series.name}" (${series.id})`)
        } else {
          console.log(`   ✅ Found existing series: "${series.name}" (${series.id})`)
        }

        // Get existing members to avoid duplicates
        const { data: existingMembers, error: membersError } = await supabase
          .from('artwork_series_members')
          .select('submission_id, shopify_product_id')
          .eq('series_id', series.id)

        if (membersError) {
          console.error(`   ❌ Error fetching existing members: ${membersError.message}`)
          results.push({
            vendorName,
            vendorId,
            success: false,
            error: membersError.message
          })
          continue
        }

        const existingSubmissionIds = new Set(
          (existingMembers || [])
            .map(m => m.submission_id)
            .filter(id => id !== null)
        )

        const existingShopifyIds = new Set(
          (existingMembers || [])
            .map(m => m.shopify_product_id)
            .filter(id => id !== null)
        )

        // Get the highest display_order for this series
        const { data: maxOrderData } = await supabase
          .from('artwork_series_members')
          .select('display_order')
          .eq('series_id', series.id)
          .order('display_order', { ascending: false })
          .limit(1)

        let nextDisplayOrder = maxOrderData && maxOrderData.length > 0
          ? (maxOrderData[0].display_order || 0) + 1
          : 0

        // Add artworks to series
        let addedCount = 0
        let skippedCount = 0

        for (const artwork of artworks) {
          // Skip if already in series
          if (existingSubmissionIds.has(artwork.id)) {
            skippedCount++
            continue
          }

          // Also check by shopify_product_id if available
          if (artwork.shopify_product_id) {
            const shopifyId = artwork.shopify_product_id.toString()
            if (existingShopifyIds.has(shopifyId)) {
              skippedCount++
              continue
            }
          }

          // Insert into artwork_series_members
          const { error: insertError } = await supabase
            .from('artwork_series_members')
            .insert({
              series_id: series.id,
              submission_id: artwork.id,
              shopify_product_id: artwork.shopify_product_id || null,
              is_locked: false,
              display_order: nextDisplayOrder,
            })

          if (insertError) {
            // If it's a duplicate error, skip it
            if (insertError.code === '23505') {
              skippedCount++
            } else {
              console.error(`   ❌ Error adding artwork ${artwork.id}: ${insertError.message}`)
            }
          } else {
            addedCount++
            nextDisplayOrder++
          }
        }

        totalAdded += addedCount
        totalSkipped += skippedCount

        results.push({
          vendorName,
          vendorId,
          seriesId: series.id,
          seriesName: series.name,
          success: true,
          artworksAdded: addedCount,
          artworksSkipped: skippedCount,
          totalArtworks: artworks.length
        })

        console.log(`   📊 Added ${addedCount}, skipped ${skippedCount} (already in series)\n`)

      } catch (error: any) {
        console.error(`   ❌ Error processing vendor ${vendorId}: ${error.message}`)
        results.push({
          vendorId,
          success: false,
          error: error.message
        })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total artworks in catalogs: ${allSubmissions.length}`)
    console.log(`Vendors processed: ${artworksByVendor.size}`)
    console.log(`Series created: ${totalSeriesCreated}`)
    console.log(`Artworks added to series: ${totalAdded}`)
    console.log(`Artworks skipped (already in series): ${totalSkipped}`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      summary: {
        totalArtworks: allSubmissions.length,
        vendorsProcessed: artworksByVendor.size,
        seriesCreated: totalSeriesCreated,
        artworksAdded: totalAdded,
        artworksSkipped: totalSkipped,
      },
      results
    })

  } catch (error: any) {
    console.error('Error creating default 1st Edition series:', error)
    return NextResponse.json(
      { error: 'Failed to process request', message: error.message },
      { status: 500 }
    )
  }
}


