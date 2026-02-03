/**
 * Diagnostic Script: Investigate Duplicate Artworks for a Collector
 * 
 * This script diagnoses why a collector might be seeing duplicate artworks.
 * It checks:
 * 1. The collector profile
 * 2. Orders associated with the collector
 * 3. Line items from those orders (both active and inactive)
 * 4. Duplicates by product_id and edition_number
 * 
 * Run with: node scripts/diagnose-collector-duplicates.js <collector_id_or_email>
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

async function diagnoseCollectorDuplicates(collectorId) {
  console.log('🔍 Diagnosing duplicate artworks for collector:', collectorId, '\n')

  try {
    // 1. Get the collector profile
    console.log('📋 Step 1: Fetching collector profile...')
    
    const isEmail = collectorId.includes('@')
    const isPublicId = /^[0-9a-f]{64}$/.test(collectorId)
    const isShopifyId = /^[0-9]+$/.test(collectorId)
    
    let profileQuery = supabase
      .from('collector_profile_comprehensive')
      .select('*')
    
    if (isPublicId) {
      profileQuery = profileQuery.eq('public_id', collectorId)
    } else if (isEmail) {
      profileQuery = profileQuery.eq('user_email', collectorId.toLowerCase().trim())
    } else if (isShopifyId) {
      profileQuery = profileQuery.eq('shopify_customer_id', collectorId)
    } else {
      profileQuery = profileQuery.eq('user_id', collectorId)
    }
    
    const { data: profiles, error: profileError } = await profileQuery

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No collector found with this identifier')
      return
    }

    const profile = profiles[0]
    console.log(`   ✅ Found collector: ${profile.display_name}`)
    console.log(`   - Email: ${profile.user_email}`)
    console.log(`   - Shopify ID: ${profile.shopify_customer_id}`)
    console.log(`   - Total Editions (reported): ${profile.total_editions}`)
    console.log(`   - Associated Order Names: ${JSON.stringify(profile.associated_order_names)}\n`)

    // 2. Fetch all orders for this collector
    console.log('📋 Step 2: Fetching orders...')
    
    const filters = []
    if (profile.shopify_customer_id) filters.push(`customer_id.eq.${profile.shopify_customer_id}`)
    if (profile.user_email) filters.push(`customer_email.ilike.${profile.user_email}`)
    if (profile.associated_order_names && profile.associated_order_names.length > 0) {
      const namesList = profile.associated_order_names.map(n => `"${n}"`).join(',')
      filters.push(`order_name.in.(${namesList})`)
    }
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_name,
        order_number,
        processed_at,
        financial_status,
        fulfillment_status,
        cancelled_at,
        order_line_items_v2 (
          id,
          line_item_id,
          product_id,
          name,
          edition_number,
          edition_total,
          status,
          restocked,
          refund_status,
          fulfillment_status,
          quantity,
          vendor_name
        )
      `)
      .or(filters.join(','))
      .order('processed_at', { ascending: false })

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    console.log(`   ✅ Found ${orders?.length || 0} orders\n`)

    // 3. Analyze all line items
    console.log('📋 Step 3: Analyzing line items...')
    
    const allLineItems = []
    const orderSummary = []
    
    for (const order of orders || []) {
      const lineItems = order.order_line_items_v2 || []
      const activeItems = lineItems.filter(li => li.status === 'active')
      const inactiveItems = lineItems.filter(li => li.status !== 'active')
      
      orderSummary.push({
        order_name: order.order_name,
        order_id: order.id,
        processed_at: order.processed_at,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        cancelled_at: order.cancelled_at,
        total_items: lineItems.length,
        active_items: activeItems.length,
        inactive_items: inactiveItems.length
      })
      
      for (const li of lineItems) {
        allLineItems.push({
          ...li,
          order_name: order.order_name,
          order_id: order.id,
          order_financial_status: order.financial_status,
          order_fulfillment_status: order.fulfillment_status,
          order_cancelled_at: order.cancelled_at
        })
      }
    }

    // Print order summary
    console.log('\n📊 Order Summary:')
    console.log('=' .repeat(120))
    console.log('Order Name'.padEnd(20) + 'Date'.padEnd(15) + 'Financial'.padEnd(15) + 'Fulfillment'.padEnd(15) + 'Cancelled'.padEnd(12) + 'Total'.padEnd(8) + 'Active'.padEnd(8) + 'Inactive')
    console.log('-'.repeat(120))
    
    for (const o of orderSummary) {
      console.log(
        (o.order_name || 'N/A').padEnd(20) +
        new Date(o.processed_at).toLocaleDateString().padEnd(15) +
        (o.financial_status || 'N/A').padEnd(15) +
        (o.fulfillment_status || 'N/A').padEnd(15) +
        (o.cancelled_at ? 'YES' : 'NO').padEnd(12) +
        String(o.total_items).padEnd(8) +
        String(o.active_items).padEnd(8) +
        String(o.inactive_items)
      )
    }
    console.log('=' .repeat(120))

    // 4. Find duplicates
    console.log('\n📋 Step 4: Finding duplicates...\n')
    
    // Group by product_id + edition_number
    const productEditionMap = new Map()
    
    for (const li of allLineItems) {
      if (!li.product_id) continue
      
      const key = `${li.product_id}-${li.edition_number || 'no-edition'}`
      if (!productEditionMap.has(key)) {
        productEditionMap.set(key, [])
      }
      productEditionMap.get(key).push(li)
    }
    
    // Find items with duplicates
    const duplicates = []
    for (const [key, items] of productEditionMap.entries()) {
      if (items.length > 1) {
        duplicates.push({ key, items })
      }
    }
    
    if (duplicates.length === 0) {
      console.log('   ✅ No duplicates found by product_id + edition_number\n')
    } else {
      console.log(`   ⚠️  Found ${duplicates.length} duplicate groups:\n`)
      
      for (const dup of duplicates) {
        console.log(`\n   🔴 ${dup.key}:`)
        console.log('   ' + '-'.repeat(100))
        for (const item of dup.items) {
          const statusIcon = item.status === 'active' ? '✅' : '❌'
          console.log(
            `   ${statusIcon} Line Item: ${item.line_item_id}` +
            `  | Order: ${item.order_name}` +
            `  | Status: ${item.status}` +
            `  | Restocked: ${item.restocked || false}` +
            `  | Refund: ${item.refund_status || 'none'}` +
            `  | Order Status: ${item.order_financial_status}/${item.order_fulfillment_status}`
          )
        }
      }
    }

    // 5. Check for line items that should be inactive but aren't
    console.log('\n📋 Step 5: Checking for incorrectly active items...\n')
    
    const incorrectlyActive = allLineItems.filter(li => {
      if (li.status !== 'active') return false
      
      // Should be inactive if...
      const shouldBeInactive = 
        li.restocked === true ||
        li.fulfillment_status === 'restocked' ||
        li.refund_status === 'refunded' ||
        li.order_financial_status === 'voided' ||
        li.order_financial_status === 'refunded' ||
        li.order_fulfillment_status === 'canceled' ||
        li.order_fulfillment_status === 'restocked' ||
        li.order_cancelled_at !== null
      
      return shouldBeInactive
    })

    if (incorrectlyActive.length === 0) {
      console.log('   ✅ All active items appear to be correctly marked\n')
    } else {
      console.log(`   ⚠️  Found ${incorrectlyActive.length} items that should be INACTIVE but are marked ACTIVE:\n`)
      
      for (const item of incorrectlyActive) {
        console.log(
          `   🔴 Line Item: ${item.line_item_id}` +
          `  | Product: ${item.product_id}` +
          `  | Name: ${item.name?.substring(0, 30)}...` +
          `  | Order: ${item.order_name}` +
          `  | Restocked: ${item.restocked}` +
          `  | Refund: ${item.refund_status}` +
          `  | Order: ${item.order_financial_status}/${item.order_fulfillment_status}`
        )
      }
    }

    // 6. Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total Orders: ${orders?.length || 0}`)
    console.log(`Total Line Items: ${allLineItems.length}`)
    console.log(`Active Line Items: ${allLineItems.filter(li => li.status === 'active').length}`)
    console.log(`Inactive Line Items: ${allLineItems.filter(li => li.status !== 'active').length}`)
    console.log(`Duplicate Groups (product+edition): ${duplicates.length}`)
    console.log(`Incorrectly Active Items: ${incorrectlyActive.length}`)
    
    // List all active items
    console.log('\n📋 All ACTIVE Line Items:')
    console.log('-'.repeat(100))
    const activeLineItems = allLineItems.filter(li => li.status === 'active')
    for (const li of activeLineItems) {
      console.log(
        `   ✅ ${li.line_item_id.padEnd(15)}` +
        `  | ${(li.order_name || 'N/A').padEnd(12)}` +
        `  | Ed: ${String(li.edition_number || '-').padEnd(4)}/${String(li.edition_total || '-').padEnd(4)}` +
        `  | ${(li.name || 'N/A').substring(0, 40)}`
      )
    }

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error.message)
    process.exit(1)
  }
}

// Get collector ID from command line args
const collectorId = process.argv[2]

if (!collectorId) {
  console.log('Usage: node scripts/diagnose-collector-duplicates.js <collector_id_or_email_or_shopify_id>')
  console.log('\nExamples:')
  console.log('  node scripts/diagnose-collector-duplicates.js 2d1dec461367a610551c61d9a96b3fd3324ebdc6e108d254738d19125ad150b8')
  console.log('  node scripts/diagnose-collector-duplicates.js user@example.com')
  console.log('  node scripts/diagnose-collector-duplicates.js 1234567890')
  process.exit(1)
}

diagnoseCollectorDuplicates(collectorId)
  .then(() => {
    console.log('\n✅ Diagnosis complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
