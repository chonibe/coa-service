/**
 * List all available products in the database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function listProducts() {
  console.log('📋 Listing all products in database...\n')

  const { data: submissions, error } = await supabase
    .from('vendor_product_submissions')
    .select('id, product_data, series_id, status, published_at')
    .not('product_data', 'is', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(20)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!submissions || submissions.length === 0) {
    console.log('❌ No products found in database')
    console.log('\n💡 Products need to be submitted through the vendor dashboard first')
    return
  }

  console.log(`✅ Found ${submissions.length} products:\n`)

  submissions.forEach((sub, idx) => {
    const data = sub.product_data || {}
    const handle = data.shopify_product_handle || data.handle || 'unknown'
    const title = data.title || data.name || 'Untitled'
    const shopifyId = data.shopify_product_id || 'not synced'
    const hasSeries = !!sub.series_id
    const hasEdition = !!(data.edition_size || data.edition_total)
    
    console.log(`${idx + 1}. ${title}`)
    console.log(`   Handle: ${handle}`)
    console.log(`   Shopify ID: ${shopifyId}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Series: ${hasSeries ? '✅' : '❌'}`)
    console.log(`   Edition: ${hasEdition ? `✅ (${data.edition_size || data.edition_total})` : '❌'}`)
    console.log(`   URL: https://app.thestreetcollector.com/shop/${handle}`)
    console.log('')
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('To see series/edition components on a product:')
  console.log('1. Pick a product handle from above')
  console.log('2. Visit: http://localhost:3000/shop/[handle]')
  console.log('3. Open browser console to see debug logs')
  console.log('')
  console.log('Products with ✅ Series will show ProductSeriesInfo')
  console.log('Products with ✅ Edition will show EditionInfo')
}

listProducts().catch(console.error)
