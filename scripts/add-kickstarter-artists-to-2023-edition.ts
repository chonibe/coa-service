import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addKickstarterArtistsTo2023Edition() {
  try {
    console.log('🔍 Finding artworks with "Kickstarter Artists" tag...\n')

    // Get all vendor product submissions
    const { data: allSubmissions, error: fetchError } = await supabase
      .from('vendor_product_submissions')
      .select('id, vendor_id, vendor_name, product_data, status')
      .in('status', ['pending', 'approved', 'published'])

    if (fetchError) {
      console.error('❌ Error fetching submissions:', fetchError)
      process.exit(1)
    }

    if (!allSubmissions || allSubmissions.length === 0) {
      console.log('✅ No submissions found!')
      return
    }

    // Filter submissions that have "Kickstarter Artists" in their tags
    const kickstarterArtworks = allSubmissions.filter((submission) => {
      const productData = submission.product_data as any
      const tags = productData?.tags || []
      return Array.isArray(tags) && tags.includes('Kickstarter Artists')
    })

    if (kickstarterArtworks.length === 0) {
      console.log('✅ No artworks found with "Kickstarter Artists" tag!')
      return
    }

    console.log(`📊 Found ${kickstarterArtworks.length} artworks with "Kickstarter Artists" tag\n`)

    // Group by vendor to find the "2023 Edition" series for each vendor
    const artworksByVendor = new Map<number, typeof kickstarterArtworks>()
    for (const artwork of kickstarterArtworks) {
      const vendorId = artwork.vendor_id
      if (!artworksByVendor.has(vendorId)) {
        artworksByVendor.set(vendorId, [])
      }
      artworksByVendor.get(vendorId)!.push(artwork)
    }

    console.log(`📦 Found artworks across ${artworksByVendor.size} vendor(s)\n`)

    let totalAdded = 0
    let totalSkipped = 0
    let errors = 0
    const results: any[] = []

    // Process each vendor
    for (const [vendorId, artworks] of artworksByVendor.entries()) {
      try {
        console.log(`🔄 Processing vendor ${vendorId} (${artworks.length} artworks)...`)

        // Find the "2023 Edition" series for this vendor
        const { data: series, error: seriesError } = await supabase
          .from('artwork_series')
          .select('id, name, vendor_id')
          .eq('vendor_id', vendorId)
          .eq('name', '2023 Edition')
          .eq('is_active', true)
          .maybeSingle()

        if (seriesError) {
          console.error(`   ❌ Error fetching series: ${seriesError.message}`)
          errors++
          continue
        }

        if (!series) {
          console.log(`   ⚠️  "2023 Edition" series not found for vendor ${vendorId}`)
          totalSkipped += artworks.length
          results.push({
            vendorId,
            success: false,
            error: 'Series not found',
            artworksSkipped: artworks.length
          })
          continue
        }

        console.log(`   ✅ Found series: "${series.name}" (${series.id})`)

        // Get existing members to avoid duplicates
        const { data: existingMembers, error: membersError } = await supabase
          .from('artwork_series_members')
          .select('submission_id')
          .eq('series_id', series.id)

        if (membersError) {
          console.error(`   ❌ Error fetching existing members: ${membersError.message}`)
          errors++
          continue
        }

        const existingSubmissionIds = new Set(
          (existingMembers || [])
            .map(m => m.submission_id)
            .filter(id => id !== null)
        )

        // Add artworks to series
        let addedCount = 0
        let skippedCount = 0

        for (const artwork of artworks) {
          // Skip if already in series
          if (existingSubmissionIds.has(artwork.id)) {
            console.log(`   ⏭️  Artwork "${(artwork.product_data as any).title || artwork.id}" already in series`)
            skippedCount++
            continue
          }

          // Get the highest display_order for this series to append new items
          const { data: maxOrderData } = await supabase
            .from('artwork_series_members')
            .select('display_order')
            .eq('series_id', series.id)
            .order('display_order', { ascending: false })
            .limit(1)

          const nextDisplayOrder = maxOrderData && maxOrderData.length > 0
            ? (maxOrderData[0].display_order || 0) + 1
            : 0

          // Insert into artwork_series_members
          const { error: insertError } = await supabase
            .from('artwork_series_members')
            .insert({
              series_id: series.id,
              submission_id: artwork.id,
              is_locked: false,
              display_order: nextDisplayOrder,
            })

          if (insertError) {
            console.error(`   ❌ Error adding artwork ${artwork.id}: ${insertError.message}`)
            errors++
          } else {
            addedCount++
            const title = (artwork.product_data as any).title || artwork.id
            console.log(`   ✅ Added "${title}" to series`)
          }
        }

        totalAdded += addedCount
        totalSkipped += skippedCount

        results.push({
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
        errors++
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
    console.log(`Vendors processed: ${artworksByVendor.size}`)
    console.log(`Total artworks found: ${kickstarterArtworks.length}`)
    console.log(`Artworks added to series: ${totalAdded}`)
    console.log(`Artworks skipped (already in series): ${totalSkipped}`)
    console.log(`Errors: ${errors}`)
    console.log('='.repeat(60))

    if (errors > 0) {
      console.log('\n⚠️  Some vendors had errors. Check the output above for details.')
    } else {
      console.log('\n✅ All artworks processed successfully!')
    }

    // Print detailed results
    console.log('\n📋 DETAILED RESULTS:')
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Vendor ${result.vendorId}:`)
      if (result.success) {
        console.log(`   Series: ${result.seriesName} (${result.seriesId})`)
        console.log(`   Added: ${result.artworksAdded}`)
        console.log(`   Skipped: ${result.artworksSkipped}`)
        console.log(`   Total: ${result.totalArtworks}`)
      } else {
        console.log(`   Error: ${result.error}`)
        if (result.artworksSkipped) {
          console.log(`   Skipped: ${result.artworksSkipped} artworks`)
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

addKickstarterArtistsTo2023Edition()

