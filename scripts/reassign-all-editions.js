/**
 * Script: Trigger Edition Number Reassignment for All Products
 * 
 * This script calls the assign_edition_numbers function for ALL products
 * to ensure the protocol is enforced:
 * - Resets edition numbers for inactive/canceled/refunded items
 * - Reassigns sequential numbers to active items only
 * - Preserves authenticated (NFC-claimed) editions
 * 
 * Run with: node scripts/reassign-all-editions.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function reassignAllEditions() {
  console.log('🔄 Starting edition number reassignment for all products...\n')

  try {
    // 1. Get all unique product IDs from line items
    console.log('📋 Step 1: Fetching all products with line items...')
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('order_line_items_v2')
      .select('product_id')
      .not('product_id', 'is', null)

    if (lineItemsError) {
      throw new Error(`Failed to fetch line items: ${lineItemsError.message}`)
    }

    const productIds = [...new Set(lineItems.map(li => li.product_id).filter(Boolean))]
    console.log(`   Found ${productIds.length} unique products\n`)

    // 2. Call assign_edition_numbers for each product
    console.log('🔄 Step 2: Reassigning edition numbers...')
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (const productId of productIds) {
      try {
        const { data, error } = await supabase.rpc('assign_edition_numbers', {
          p_product_id: productId
        })

        if (error) {
          console.error(`   ❌ Product ${productId}: ${error.message}`)
          errorCount++
          errors.push({ productId, error: error.message })
        } else {
          console.log(`   ✅ Product ${productId}: ${data} editions assigned`)
          successCount++
        }
      } catch (error) {
        console.error(`   ❌ Product ${productId}: ${error.message}`)
        errorCount++
        errors.push({ productId, error: error.message })
      }
    }

    // 3. Summary
    console.log('\n✅ Reassignment Complete!')
    console.log('📊 Summary:')
    console.log(`   - Total products processed: ${productIds.length}`)
    console.log(`   - Successful: ${successCount}`)
    console.log(`   - Errors: ${errorCount}`)

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      errors.forEach(({ productId, error }) => {
        console.log(`   - Product ${productId}: ${error}`)
      })
    }

    // 4. Verify inactive items are cleared
    console.log('\n📋 Step 3: Verifying inactive items...')
    const { data: inactiveWithEditions, error: verifyError } = await supabase
      .from('order_line_items_v2')
      .select('line_item_id, product_id, name, status, edition_number')
      .eq('status', 'inactive')
      .not('edition_number', 'is', null)

    if (verifyError) {
      console.error(`   ❌ Verification failed: ${verifyError.message}`)
    } else {
      console.log(`   Found ${inactiveWithEditions?.length || 0} inactive items still with edition numbers`)
      
      if (inactiveWithEditions && inactiveWithEditions.length > 0) {
        console.log('   ⚠️  These items should have been cleared but were not:')
        inactiveWithEditions.slice(0, 10).forEach(item => {
          console.log(`      - ${item.name} (${item.line_item_id}): Edition #${item.edition_number}, Status: ${item.status}`)
        })
        if (inactiveWithEditions.length > 10) {
          console.log(`      ... and ${inactiveWithEditions.length - 10} more`)
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Error during reassignment:', error.message)
    process.exit(1)
  }
}

// Run the reassignment
reassignAllEditions()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
