/**
 * Fix Script: Mark Refunded Line Items as Inactive
 * 
 * This script finds line items that:
 * 1. Have status='active' but fulfillment_status is null
 * 2. Appear in the refunds of their parent order
 * 
 * These items were refunded/removed but not correctly marked as inactive
 * due to a type mismatch bug in the sync logic.
 * 
 * Run with: node scripts/fix-refunded-line-items.js
 * Dry run:  node scripts/fix-refunded-line-items.js --dry-run
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
const isDryRun = process.argv.includes('--dry-run')

async function fixRefundedLineItems() {
  console.log(`🔍 Finding refunded line items that are incorrectly marked as active...`)
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`)

  try {
    // 1. Find all active line items with null fulfillment_status
    console.log('📋 Step 1: Finding active items with null fulfillment_status...')
    const { data: suspectItems, error: suspectError } = await supabase
      .from('order_line_items_v2')
      .select('id, line_item_id, order_id, order_name, name, status, fulfillment_status, edition_number')
      .eq('status', 'active')
      .is('fulfillment_status', null)

    if (suspectError) {
      throw new Error(`Failed to fetch suspect items: ${suspectError.message}`)
    }

    console.log(`   Found ${suspectItems?.length || 0} active items with null fulfillment_status\n`)

    if (!suspectItems || suspectItems.length === 0) {
      console.log('✅ No suspect items found. All looks good!')
      return
    }

    // 2. Get orders with refunds for these items
    const orderIds = [...new Set(suspectItems.map(li => li.order_id))]
    console.log(`📋 Step 2: Checking ${orderIds.length} orders for refund data...`)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_name, raw_shopify_order_data')
      .in('id', orderIds)

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    // 3. Build a map of refunded line item IDs from Shopify data
    const refundedLineItemIds = new Set()
    
    for (const order of orders || []) {
      const rawData = order.raw_shopify_order_data
      if (!rawData || !rawData.refunds) continue

      for (const refund of rawData.refunds) {
        for (const refundLineItem of refund.refund_line_items || []) {
          refundedLineItemIds.add(refundLineItem.line_item_id.toString())
        }
      }
    }

    console.log(`   Found ${refundedLineItemIds.size} refunded line item IDs in Shopify data\n`)

    // 4. Find items that are in both lists (suspect + refunded)
    const itemsToFix = suspectItems.filter(li => refundedLineItemIds.has(li.line_item_id))

    console.log(`📋 Step 3: Identified ${itemsToFix.length} items that need to be marked inactive:\n`)

    if (itemsToFix.length === 0) {
      console.log('✅ No items need fixing!')
      return
    }

    // Print the items
    for (const item of itemsToFix) {
      console.log(`   🔴 ${item.line_item_id} | ${item.order_name} | ${item.name} | Ed: ${item.edition_number || '-'}`)
    }

    // 5. Fix the items
    if (!isDryRun) {
      console.log(`\n🔄 Updating ${itemsToFix.length} line items...`)
      
      const lineItemIds = itemsToFix.map(li => li.line_item_id)
      
      const { error: updateError } = await supabase
        .from('order_line_items_v2')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .in('line_item_id', lineItemIds)

      if (updateError) {
        throw new Error(`Failed to update items: ${updateError.message}`)
      }

      console.log(`   ✅ Successfully marked ${itemsToFix.length} items as inactive`)
    } else {
      console.log(`\n⚠️  DRY RUN: No changes made. Run without --dry-run to apply fixes.`)
    }

    // 6. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total suspect items (active + null fulfillment): ${suspectItems.length}`)
    console.log(`Refunded line items found in Shopify data: ${refundedLineItemIds.size}`)
    console.log(`Items that need fixing: ${itemsToFix.length}`)
    console.log(`Items fixed: ${isDryRun ? '0 (dry run)' : itemsToFix.length}`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

fixRefundedLineItems()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
