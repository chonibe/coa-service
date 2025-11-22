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

async function checkEditionNumbers() {
  console.log('Checking edition numbers in order_line_items_v2...\n')

  // Get summary statistics
  const { data: summary, error: summaryError } = await supabase
    .from('order_line_items_v2')
    .select('status, edition_number', { count: 'exact' })

  if (summaryError) {
    console.error('Error fetching summary:', summaryError)
    return
  }

  // Get active items with edition numbers
  const { data: withEditions, error: withError } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, order_name, product_id, name, edition_number, edition_total, status, fulfillment_status, created_at')
    .eq('status', 'active')
    .not('edition_number', 'is', null)
    .order('created_at', { ascending: true })
    .limit(100)

  if (withError) {
    console.error('Error fetching items with editions:', withError)
  } else {
    console.log(`\n=== Items WITH Edition Numbers (showing first 100) ===`)
    console.log(`Total: ${withEditions?.length || 0} items\n`)
    
    if (withEditions && withEditions.length > 0) {
      // Group by product
      const byProduct = new Map<string, any[]>()
      withEditions.forEach(item => {
        const key = item.product_id || 'unknown'
        if (!byProduct.has(key)) {
          byProduct.set(key, [])
        }
        byProduct.get(key)!.push(item)
      })

      console.log(`Products with edition numbers: ${byProduct.size}\n`)
      
      for (const [productId, items] of Array.from(byProduct.entries()).slice(0, 10)) {
        const editions = items.map(i => i.edition_number).filter(Boolean).sort((a, b) => a - b)
        console.log(`Product ${productId} (${items[0].name || 'Unknown'}):`)
        console.log(`  - Total items: ${items.length}`)
        console.log(`  - Edition range: ${editions[0]} - ${editions[editions.length - 1]}`)
        console.log(`  - Edition total: ${items[0].edition_total || 'N/A'}`)
        console.log(`  - Sample orders: ${items.slice(0, 3).map(i => i.order_name).join(', ')}`)
        console.log('')
      }
    }
  }

  // Get active items WITHOUT edition numbers
  const { data: withoutEditions, error: withoutError } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, order_name, product_id, name, status, fulfillment_status, created_at')
    .eq('status', 'active')
    .is('edition_number', null)
    .order('created_at', { ascending: true })
    .limit(100)

  if (withoutError) {
    console.error('Error fetching items without editions:', withoutError)
  } else {
    console.log(`\n=== Items WITHOUT Edition Numbers (showing first 100) ===`)
    console.log(`Total: ${withoutEditions?.length || 0} items\n`)
    
    if (withoutEditions && withoutEditions.length > 0) {
      // Group by product
      const byProduct = new Map<string, any[]>()
      withoutEditions.forEach(item => {
        const key = item.product_id || 'unknown'
        if (!byProduct.has(key)) {
          byProduct.set(key, [])
        }
        byProduct.get(key)!.push(item)
      })

      console.log(`Products missing edition numbers: ${byProduct.size}\n`)
      
      for (const [productId, items] of Array.from(byProduct.entries()).slice(0, 10)) {
        console.log(`Product ${productId} (${items[0].name || 'Unknown'}):`)
        console.log(`  - Items without edition: ${items.length}`)
        console.log(`  - Fulfillment status: ${[...new Set(items.map(i => i.fulfillment_status))].join(', ')}`)
        console.log(`  - Sample orders: ${items.slice(0, 3).map(i => i.order_name).join(', ')}`)
        console.log('')
      }
    }
  }

  // Get product-level summary
  const { data: allActive, error: allError } = await supabase
    .from('order_line_items_v2')
    .select('product_id, name, edition_number, status')
    .eq('status', 'active')
    .not('product_id', 'is', null)

  if (!allError && allActive) {
    const productSummary = new Map<string, { total: number, withEdition: number, withoutEdition: number, name: string }>()
    
    allActive.forEach(item => {
      const key = item.product_id
      if (!productSummary.has(key)) {
        productSummary.set(key, { total: 0, withEdition: 0, withoutEdition: 0, name: item.name || 'Unknown' })
      }
      const summary = productSummary.get(key)!
      summary.total++
      if (item.edition_number !== null && item.edition_number !== undefined) {
        summary.withEdition++
      } else {
        summary.withoutEdition++
      }
    })

    console.log(`\n=== Product Summary ===`)
    console.log(`Total products with active items: ${productSummary.size}\n`)
    
    const sorted = Array.from(productSummary.entries())
      .sort((a, b) => b[1].withoutEdition - a[1].withoutEdition)
      .slice(0, 20)

    console.log('Top products needing edition numbers:')
    for (const [productId, summary] of sorted) {
      if (summary.withoutEdition > 0) {
        console.log(`  ${productId} (${summary.name}): ${summary.withEdition}/${summary.total} have editions (${summary.withoutEdition} missing)`)
      }
    }
  }
}

checkEditionNumbers()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })

