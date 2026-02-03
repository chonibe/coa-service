/**
 * Cleanup Script: Mark Inactive Line Items
 * 
 * This script finds and marks line items as 'inactive' if they meet any of these criteria:
 * 1. Parent order has financial_status = 'voided'
 * 2. Parent order has cancelled_at != null
 * 3. Parent order has fulfillment_status = 'canceled'
 * 4. Line item has restocked = true
 * 5. Line item has fulfillment_status = 'restocked'
 * 
 * Run with: node scripts/cleanup-inactive-line-items.js
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

async function cleanupInactiveLineItems() {
  console.log('🔍 Starting cleanup of inactive line items...\n')

  try {
    // 1. Find all orders that are canceled/voided
    console.log('📋 Step 1: Finding canceled/voided orders...')
    const { data: canceledOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_name, financial_status, fulfillment_status, cancelled_at')
      .or('financial_status.eq.voided,cancelled_at.not.is.null,fulfillment_status.eq.canceled')

    if (ordersError) {
      throw new Error(`Failed to fetch canceled orders: ${ordersError.message}`)
    }

    console.log(`   Found ${canceledOrders?.length || 0} canceled/voided orders\n`)

    // 2. Find line items from these orders that are still marked as 'active'
    if (canceledOrders && canceledOrders.length > 0) {
      const canceledOrderIds = canceledOrders.map(o => o.id)
      
      console.log('📋 Step 2: Finding active line items from canceled orders...')
      const { data: activeLineItems, error: lineItemsError } = await supabase
        .from('order_line_items_v2')
        .select('id, line_item_id, order_id, name, status')
        .in('order_id', canceledOrderIds)
        .eq('status', 'active')

      if (lineItemsError) {
        throw new Error(`Failed to fetch active line items: ${lineItemsError.message}`)
      }

      console.log(`   Found ${activeLineItems?.length || 0} active line items from canceled orders\n`)

      // 3. Mark these line items as inactive
      if (activeLineItems && activeLineItems.length > 0) {
        console.log('🔄 Step 3: Marking line items as inactive...')
        const lineItemIds = activeLineItems.map(li => li.line_item_id)
        
        const { error: updateError } = await supabase
          .from('order_line_items_v2')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .in('line_item_id', lineItemIds)

        if (updateError) {
          throw new Error(`Failed to update line items: ${updateError.message}`)
        }

        console.log(`   ✅ Successfully marked ${activeLineItems.length} line items as inactive\n`)
        
        // Log the affected orders
        console.log('📊 Affected Orders:')
        const orderNames = new Set(activeLineItems.map(li => {
          const order = canceledOrders.find(o => o.id === li.order_id)
          return order?.order_name
        }))
        orderNames.forEach(name => console.log(`   - ${name}`))
      }
    }

    // 4. Find line items marked as restocked
    console.log('\n📋 Step 4: Finding restocked line items...')
    const { data: restockedItems, error: restockedError } = await supabase
      .from('order_line_items_v2')
      .select('id, line_item_id, order_id, name, status')
      .or('restocked.eq.true,fulfillment_status.eq.restocked')
      .eq('status', 'active')

    if (restockedError) {
      throw new Error(`Failed to fetch restocked items: ${restockedError.message}`)
    }

    console.log(`   Found ${restockedItems?.length || 0} restocked line items still marked as active\n`)

    // 5. Mark restocked items as inactive
    if (restockedItems && restockedItems.length > 0) {
      console.log('🔄 Step 5: Marking restocked items as inactive...')
      const restockedLineItemIds = restockedItems.map(li => li.line_item_id)
      
      const { error: restockedUpdateError } = await supabase
        .from('order_line_items_v2')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .in('line_item_id', restockedLineItemIds)

      if (restockedUpdateError) {
        throw new Error(`Failed to update restocked items: ${restockedUpdateError.message}`)
      }

      console.log(`   ✅ Successfully marked ${restockedItems.length} restocked items as inactive\n`)
    }

    // 6. Summary
    console.log('\n✅ Cleanup Complete!')
    console.log('📊 Summary:')
    console.log(`   - Canceled/voided orders processed: ${canceledOrders?.length || 0}`)
    console.log(`   - Line items marked inactive (from canceled orders): ${activeLineItems?.length || 0}`)
    console.log(`   - Restocked items marked inactive: ${restockedItems?.length || 0}`)
    console.log(`   - Total line items updated: ${(activeLineItems?.length || 0) + (restockedItems?.length || 0)}`)

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message)
    process.exit(1)
  }
}

// Run the cleanup
cleanupInactiveLineItems()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
