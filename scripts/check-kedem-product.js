/**
 * Check and configure kedem-1 product for series and edition display
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAndConfigureKedem() {
  console.log('🔍 Checking kedem-1 product...\n')

  // 1. Find the product submission
  const { data: submission, error: subError } = await supabase
    .from('vendor_product_submissions')
    .select(`
      id,
      product_data,
      series_id,
      vendor_id,
      status,
      approved_at,
      published_at
    `)
    .or(`product_data->>shopify_product_handle.eq.kedem-1,product_data->>handle.eq.kedem-1`)
    .single()

  if (subError || !submission) {
    console.log('❌ Product not found in database')
    console.log('Error:', subError?.message)
    console.log('\n💡 This product needs to be submitted through the vendor dashboard first')
    return
  }

  const productData = submission.product_data || {}
  
  console.log('✅ Product found:', productData.title || productData.name || 'Untitled')
  console.log('   Handle:', productData.shopify_product_handle || productData.handle)
  console.log('   Shopify ID:', productData.shopify_product_id)
  console.log('   Series ID:', submission.series_id || 'None')
  console.log('   Edition Size:', productData.edition_size || 'None')
  console.log('   Status:', submission.status)
  console.log('')

  // 2. Check if product is in a series
  if (submission.series_id) {
    const { data: series } = await supabase
      .from('artwork_series')
      .select('id, name, description')
      .eq('id', submission.series_id)
      .single()

    if (series) {
      console.log('📚 Part of series:', series.name)
      
      const { count } = await supabase
        .from('artwork_series_members')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', submission.series_id)

      console.log('   Total artworks in series:', count)
    }
  } else {
    console.log('❌ Not in any series')
    console.log('   👉 Need to add to a series for series component to show')
  }
  console.log('')

  // 3. Check edition info
  if (productData.edition_size || productData.edition_total) {
    console.log('📦 Edition Info:')
    console.log('   Edition Size:', productData.edition_size)
    console.log('   Edition Total:', productData.edition_total)
  } else {
    console.log('❌ No edition information')
    console.log('   👉 Need to set edition_size in product_data for edition component to show')
  }
  console.log('')

  // 4. Check if there are any series for this vendor
  const { data: vendorSeries } = await supabase
    .from('artwork_series')
    .select('id, name')
    .eq('vendor_id', submission.vendor_id)
    .limit(5)

  if (vendorSeries && vendorSeries.length > 0) {
    console.log('📋 Available series for this vendor:')
    vendorSeries.forEach(s => {
      console.log(`   - ${s.name} (ID: ${s.id})`)
    })
    console.log('')
  }

  // 5. Offer to configure
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📝 CONFIGURATION OPTIONS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  if (!productData.edition_size) {
    console.log('To add edition info, run:')
    console.log(`UPDATE vendor_product_submissions`)
    console.log(`SET product_data = jsonb_set(product_data, '{edition_size}', '100'::jsonb)`)
    console.log(`WHERE id = '${submission.id}';`)
    console.log('')
  }

  if (!submission.series_id && vendorSeries && vendorSeries.length > 0) {
    console.log('To add to a series, first add to artwork_series_members:')
    console.log(`INSERT INTO artwork_series_members (series_id, submission_id, display_order)`)
    console.log(`VALUES ('${vendorSeries[0].id}', '${submission.id}', 1);`)
    console.log('')
    console.log('Then update the submission:')
    console.log(`UPDATE vendor_product_submissions`)
    console.log(`SET series_id = '${vendorSeries[0].id}'`)
    console.log(`WHERE id = '${submission.id}';`)
    console.log('')
  }

  if (!vendorSeries || vendorSeries.length === 0) {
    console.log('💡 No series exist yet. Create one first in the vendor dashboard')
    console.log('   or use the series management page')
  }
}

checkAndConfigureKedem().catch(console.error)
