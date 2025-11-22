import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function assignMissingEditions() {
  try {
    console.log('🔍 Finding active items without edition numbers...\n')

    // Get all active items without edition numbers, grouped by product
    const { data: items, error: fetchError } = await supabase
      .from('order_line_items_v2')
      .select('id, product_id, created_at')
      .eq('status', 'active')
      .is('edition_number', null)
      .order('product_id')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching items:', fetchError)
      process.exit(1)
    }

    if (!items || items.length === 0) {
      console.log('✅ No active items found without edition numbers!')
      return
    }

    // Filter valid product IDs
    const validItems = items.filter(item => {
      const pid = item.product_id
      return pid !== null && pid !== undefined && String(pid).trim() !== ''
    })

    // Group by product_id
    const itemsByProduct = new Map<string, typeof validItems>()
    for (const item of validItems) {
      const productId = String(item.product_id)
      if (!itemsByProduct.has(productId)) {
        itemsByProduct.set(productId, [])
      }
      itemsByProduct.get(productId)!.push(item)
    }

    console.log(`📊 Found ${validItems.length} active items without edition numbers`)
    console.log(`📦 Across ${itemsByProduct.size} products\n`)

    let totalAssigned = 0
    let errors = 0
    const results: any[] = []

    // Process each product
    for (const [productId, productItems] of itemsByProduct.entries()) {
      try {
        console.log(`🔄 Processing product ${productId} (${productItems.length} items)...`)

        // Get edition_size from products table
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('edition_size, product_id')
          .or(`product_id.eq.${productId},product_id.eq.${parseInt(productId) || 0}`)
          .limit(1)
          .single()

        if (productError || !product) {
          // Try to continue without edition size (open edition)
          console.log(`   ⚠️  Product not found in products table, treating as open edition`)
        }

        const editionSize = product?.edition_size
        const isOpenEdition = !editionSize || editionSize === 0

        // Get all active items for this product (including ones that already have numbers)
        // to determine the correct sequence
        const { data: allActiveItems, error: allItemsError } = await supabase
          .from('order_line_items_v2')
          .select('id, edition_number, created_at')
          .eq('product_id', productId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (allItemsError) {
          console.error(`   ❌ Error fetching all items: ${allItemsError.message}`)
          errors++
          continue
        }

        // Find the highest existing edition number
        const existingNumbers = (allActiveItems || [])
          .map(item => item.edition_number)
          .filter(num => num !== null && num !== undefined) as number[]
        
        const maxEdition = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
        let nextEdition = maxEdition + 1

        // Assign edition numbers to items without them
        for (const item of productItems) {
          // Check if we're exceeding edition size for limited editions
          if (!isOpenEdition && nextEdition > editionSize!) {
            console.error(`   ❌ Cannot assign edition ${nextEdition}: exceeds edition size of ${editionSize}`)
            errors++
            break
          }

          const { error: updateError } = await supabase
            .from('order_line_items_v2')
            .update({
              edition_number: nextEdition,
              edition_total: isOpenEdition ? null : editionSize,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)

          if (updateError) {
            console.error(`   ❌ Error updating item ${item.id}: ${updateError.message}`)
            errors++
          } else {
            totalAssigned++
            nextEdition++
          }
        }

        if (nextEdition > maxEdition + 1) {
          console.log(`   ✅ Assigned ${nextEdition - maxEdition - 1} edition numbers (${maxEdition + 1} to ${nextEdition - 1})`)
          results.push({
            productId,
            success: true,
            editionNumbersAssigned: nextEdition - maxEdition - 1,
            itemsNeedingAssignment: productItems.length
          })
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing product ${productId}: ${error.message}`)
        errors++
        results.push({
          productId,
          success: false,
          error: error.message
        })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Products processed: ${itemsByProduct.size}`)
    console.log(`Products with errors: ${errors}`)
    console.log(`Total edition numbers assigned: ${totalAssigned}`)
    console.log(`Items that needed assignment: ${validItems.length}`)
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

