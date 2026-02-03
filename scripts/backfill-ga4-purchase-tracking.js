#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function backfillGA4PurchaseTracking() {
  console.log('🔄 Backfilling GA4 purchase tracking for ALL historical orders...\n')

  // Get ALL paid orders that don't already have GA4 tracking
  console.log('📅 Looking for ALL historical paid orders...')

  const { data: existingTrackedOrders, error: existingError } = await supabase
    .from('ga4_purchase_tracking')
    .select('order_id')

  if (existingError) {
    console.error('❌ Error fetching existing tracked orders:', existingError)
    return
  }

  const trackedOrderIds = new Set(existingTrackedOrders?.map(row => row.order_id) || [])

  console.log(`📊 Found ${trackedOrderIds.size} already tracked orders`)

  // Query for ALL historical orders that need tracking
  // We'll look in the orders table for ALL paid orders
  const { data: historicalOrders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_email,
      raw_shopify_order_data,
      processed_at,
      financial_status
    `)
    .eq('financial_status', 'paid')
    .not('id', 'in', `(${Array.from(trackedOrderIds).map(id => `'${id}'`).join(',')})`)

  if (ordersError) {
    console.error('❌ Error fetching historical orders:', ordersError)
    return
  }

  if (!historicalOrders || historicalOrders.length === 0) {
    console.log('✅ No historical orders found that need backfilling')
    return
  }

  console.log(`📦 Found ${historicalOrders.length} historical orders to backfill`)

  let successCount = 0
  let errorCount = 0

  for (const order of historicalOrders) {
    try {
      // Extract order data from the raw_shopify_order_data JSON
      const orderData = order.raw_shopify_order_data

      if (!orderData) {
        console.warn(`⚠️  No Shopify order data for order ${order.id}, skipping`)
        continue
      }

      // Transform the data similar to how the webhook does it
      const purchaseData = {
        orderId: order.id.toString(),
        orderName: orderData.name || `#${order.order_number}`,
        lineItems: (orderData.line_items || []).map((item) => ({
          id: (item.id ?? '').toString(),
          product_id: (item.product_id ?? '').toString(),
          title: item.title || '',
          variant_title: item.variant_title || '',
          vendor: item.vendor || '',
          product_type: item.product_type || '',
          quantity: item.quantity || 1,
          price: item.price || '0',
          line_price: (parseFloat(item.price || '0') * (item.quantity || 1)).toString()
        })),
        subtotal: parseFloat(orderData.subtotal_price || '0'),
        shipping: parseFloat(orderData.total_shipping_price_set?.shop_money?.amount || '0'),
        tax: parseFloat(orderData.total_tax || '0'),
        currency: orderData.currency || 'USD',
        processedAt: orderData.processed_at || order.processed_at,
        isBackfilled: true // Mark as backfilled for tracking
      }

      // Insert into GA4 tracking table
      const { error: insertError } = await supabase
        .from('ga4_purchase_tracking')
        .insert({
          order_id: order.id.toString(),
          purchase_data: purchaseData,
          tracked_at: null, // Will be set when client-side tracking occurs
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error(`❌ Error backfilling order ${order.id}:`, insertError)
        errorCount++
      } else {
        console.log(`✅ Backfilled order ${order.id} (${orderData.name || `#${order.order_number}`})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ Error processing order ${order.id}:`, error)
      errorCount++
    }
  }

  console.log(`\n📊 Backfill Summary:`)
  console.log(`- ✅ Successfully backfilled: ${successCount} orders`)
  console.log(`- ❌ Errors: ${errorCount} orders`)
  console.log(`- 📅 Date range: ALL historical orders`)
  console.log(`\n🔄 Backfilled orders will be tracked when customers visit their tracking pages!`)

  if (successCount > 0) {
    console.log(`\n💡 Next steps:`)
    console.log(`1. ALL historical purchases are now ready for GA4 tracking`)
    console.log(`2. When customers visit their order tracking pages, purchases will be sent to GA4`)
    console.log(`3. Check GA4 Realtime reports when users access their tracking links`)
    console.log(`4. Full historical analytics data will populate in GA4 over time`)
  }
}

backfillGA4PurchaseTracking().catch(console.error)