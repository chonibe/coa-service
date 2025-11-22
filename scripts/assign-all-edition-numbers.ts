import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function assignAllEditionNumbers() {
  console.log('Assigning edition numbers to all active items...\n')

  // Get all unique product IDs that have active items
  const { data: allItems, error: itemsError } = await supabase
    .from('order_line_items_v2')
    .select('product_id')
    .eq('status', 'active')
    .not('product_id', 'is', null)

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    return
  }

  const productIds = [...new Set(allItems?.map(item => item.product_id).filter(Boolean) || [])]
  console.log(`Found ${productIds.length} unique products with active items\n`)

  let successCount = 0
  let errorCount = 0
  const results: Array<{ productId: string, assigned: number, error?: string }> = []

  for (const productId of productIds) {
    try {
      console.log(`Assigning edition numbers for product ${productId}...`)
      
      const { data, error } = await supabase
        .rpc('assign_edition_numbers', { p_product_id: productId })

      if (error) {
        console.error(`  Error: ${error.message}`)
        errorCount++
        results.push({ productId, assigned: 0, error: error.message })
      } else {
        const assigned = data || 0
        console.log(`  ✓ Assigned ${assigned} edition numbers`)
        successCount++
        results.push({ productId, assigned })
      }
    } catch (error: any) {
      console.error(`  Exception: ${error.message}`)
      errorCount++
      results.push({ productId, assigned: 0, error: error.message })
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total products: ${productIds.length}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  
  const totalAssigned = results.reduce((sum, r) => sum + r.assigned, 0)
  console.log(`Total edition numbers assigned: ${totalAssigned}`)

  // Show products with most assignments
  const topProducts = results
    .filter(r => r.assigned > 0)
    .sort((a, b) => b.assigned - a.assigned)
    .slice(0, 10)

  if (topProducts.length > 0) {
    console.log(`\nTop products by edition assignments:`)
    topProducts.forEach(r => {
      console.log(`  ${r.productId}: ${r.assigned} editions`)
    })
  }

  // Show errors
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.log(`\nProducts with errors:`)
    errors.forEach(r => {
      console.log(`  ${r.productId}: ${r.error}`)
    })
  }
}

assignAllEditionNumbers()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

