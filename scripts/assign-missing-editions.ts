import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function assignMissingEditions() {
  try {
    console.log('🔍 Finding active items without edition numbers...\n')

    // Find products that have active items without edition numbers
    // First get all active items without edition numbers
    const { data: allItems, error: fetchError } = await supabase
      .from('order_line_items_v2')
      .select('product_id')
      .eq('status', 'active')
      .is('edition_number', null)

    if (fetchError) {
      console.error('❌ Error fetching items without edition numbers:', fetchError)
      process.exit(1)
    }

    // Filter out null/empty product_ids
    const itemsWithoutEditions = (allItems || []).filter(
      item => {
        const productId = item.product_id
        return productId !== null && 
               productId !== undefined && 
               String(productId).trim() !== ''
      }
    )

    if (!itemsWithoutEditions || itemsWithoutEditions.length === 0) {
      console.log('✅ No active items found without edition numbers!')
      return
    }

    // Get unique product IDs that need edition numbers assigned
    const uniqueProducts = [
      ...new Set(
        itemsWithoutEditions
          .map(item => String(item.product_id))
          .filter(id => id && id.trim() !== '')
      )
    ]

    console.log(`📊 Found ${itemsWithoutEditions.length} active items without edition numbers`)
    console.log(`📦 Across ${uniqueProducts.length} products\n`)

    const results = []
    let totalAssigned = 0
    let errors = 0

    // Assign edition numbers for each product
    for (const productId of uniqueProducts) {
      try {
        // Get count of items that will be assigned before calling
        const { count: itemsCount } = await supabase
          .from('order_line_items_v2')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', productId)
          .eq('status', 'active')
          .is('edition_number', null)

        console.log(`🔄 Processing product ${productId} (${itemsCount || 0} items need assignment)...`)

        // Call the assign_edition_numbers function
        const { data, error: assignError } = await supabase
          .rpc('assign_edition_numbers', { p_product_id: String(productId) })

        if (assignError) {
          console.error(`   ❌ Error: ${assignError.message}`)
          errors++
          results.push({
            productId,
            success: false,
            error: assignError.message,
            itemsNeedingAssignment: itemsCount || 0
          })
        } else {
          totalAssigned += data || 0
          console.log(`   ✅ Assigned ${data} edition numbers`)
          results.push({
            productId,
            success: true,
            editionNumbersAssigned: data || 0,
            itemsNeedingAssignment: itemsCount || 0
          })
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing product ${productId}:`, error.message)
        errors++
        results.push({
          productId,
          success: false,
          error: error.message || 'Unknown error'
        })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Products processed: ${uniqueProducts.length}`)
    console.log(`Products with errors: ${errors}`)
    console.log(`Total edition numbers assigned: ${totalAssigned}`)
    console.log(`Items that needed assignment: ${itemsWithoutEditions.length}`)
    console.log('='.repeat(60))

    if (errors > 0) {
      console.log('\n⚠️  Some products had errors. Check the output above for details.')
    } else {
      console.log('\n✅ All products processed successfully!')
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

assignMissingEditions()

