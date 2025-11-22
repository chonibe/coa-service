import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkUnassigned() {
  // Get all active items without edition numbers
  const { data: items, error } = await supabase
    .from('order_line_items_v2')
    .select('id, order_id, order_name, product_id, name, status, created_at')
    .eq('status', 'active')
    .is('edition_number', null)
    .order('product_id')
    .order('created_at')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!items || items.length === 0) {
    console.log('✅ No active items without edition numbers!')
    return
  }

  console.log(`\n📋 Found ${items.length} active items WITHOUT edition numbers:\n`)
  
  // Group by product
  const byProduct = new Map<string, typeof items>()
  for (const item of items) {
    const pid = String(item.product_id)
    if (!byProduct.has(pid)) {
      byProduct.set(pid, [])
    }
    byProduct.get(pid)!.push(item)
  }

  for (const [productId, productItems] of byProduct.entries()) {
    console.log(`\n📦 Product: ${productId} (${productItems.length} items)`)
    
    // Check edition size
    const { data: product } = await supabase
      .from('products')
      .select('edition_size, title')
      .or(`product_id.eq.${productId},product_id.eq.${parseInt(productId) || 0}`)
      .limit(1)
      .single()

    if (product) {
      console.log(`   Edition Size: ${product.edition_size || 'Open Edition'}`)
      console.log(`   Product Title: ${product.title || 'N/A'}`)
    } else {
      console.log(`   ⚠️  Product not found in products table`)
    }

    // Count existing active items with numbers
    const { count: existingCount } = await supabase
      .from('order_line_items_v2')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('status', 'active')
      .not('edition_number', 'is', null)

    console.log(`   Existing active items WITH numbers: ${existingCount || 0}`)
    console.log(`   Active items WITHOUT numbers: ${productItems.length}`)
    console.log(`   Total active items: ${(existingCount || 0) + productItems.length}`)

    if (product && product.edition_size && product.edition_size > 0) {
      const total = (existingCount || 0) + productItems.length
      if (total > product.edition_size) {
        console.log(`   ❌ EXCEEDS EDITION SIZE! (${total} > ${product.edition_size})`)
        console.log(`   🔍 These items cannot be assigned because edition is full`)
      }
    }

    // Show first few items
    console.log(`   Items:`)
    for (const item of productItems.slice(0, 5)) {
      console.log(`      - Order ${item.order_name}: ${item.name} (created: ${new Date(item.created_at).toLocaleDateString()})`)
    }
    if (productItems.length > 5) {
      console.log(`      ... and ${productItems.length - 5} more`)
    }
  }
}

checkUnassigned()

