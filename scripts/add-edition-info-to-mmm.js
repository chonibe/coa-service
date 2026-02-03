/**
 * Add edition information to the "mmm" product so we can see EditionInfo component
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addEditionInfo() {
  console.log('🎨 Adding edition info to "mmm" product...\n')

  // Update the product with edition info
  const { data, error } = await supabase
    .from('vendor_product_submissions')
    .update({
      product_data: supabase.rpc('jsonb_set', {
        target: supabase.from('vendor_product_submissions').select('product_data').eq('product_data->>handle', 'mmm').single(),
        path: '{edition_size}',
        new_value: '100'
      })
    })
    .eq('product_data->>handle', 'mmm')
    .select()

  if (error) {
    console.log('❌ Error:', error.message)
    console.log('\nTrying alternative method...\n')
    
    // Get the product first
    const { data: product } = await supabase
      .from('vendor_product_submissions')
      .select('id, product_data')
      .eq('product_data->>handle', 'mmm')
      .single()

    if (product) {
      const updatedData = {
        ...product.product_data,
        edition_size: 100,
        edition_total: 100
      }

      const { error: updateError } = await supabase
        .from('vendor_product_submissions')
        .update({ product_data: updatedData })
        .eq('id', product.id)

      if (updateError) {
        console.log('❌ Update failed:', updateError.message)
      } else {
        console.log('✅ Successfully added edition info!')
        console.log('   Edition Size: 100')
        console.log('   Edition Total: 100')
        console.log('\n🎉 Now visit: http://localhost:3000/shop/mmm')
        console.log('   You should see BOTH components:')
        console.log('   - 📚 ProductSeriesInfo (already has series)')
        console.log('   - 📦 EditionInfo (just added edition size)')
      }
    }
  } else {
    console.log('✅ Successfully added edition info!')
  }
}

addEditionInfo().catch(console.error)
