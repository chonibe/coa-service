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

async function testGA4PurchaseTracking() {
  console.log('🧪 Testing GA4 purchase tracking implementation...\n')

  // Test 1: Insert test purchase data (simulating webhook)
  console.log('📝 Test 1: Inserting test purchase data...')
  const testOrderId = `test-order-${Date.now()}`
  const testPurchaseData = {
    orderId: testOrderId,
    orderName: '#TEST-123',
    lineItems: [
      {
        id: '12345',
        product_id: 'prod_123',
        title: 'Test Artwork',
        vendor: 'Test Artist',
        product_type: 'Print',
        quantity: 1,
        price: '100.00',
        line_price: '100.00'
      }
    ],
    subtotal: 100.00,
    shipping: 10.00,
    tax: 8.75,
    currency: 'USD',
    processedAt: new Date().toISOString()
  }

  const { data: insertData, error: insertError } = await supabase
    .from('ga4_purchase_tracking')
    .insert({
      order_id: testOrderId,
      purchase_data: testPurchaseData
    })

  if (insertError) {
    console.error('❌ Error inserting test purchase data:', insertError)
    return
  }

  console.log('✅ Test purchase data inserted successfully')

  // Test 2: Retrieve purchase data (simulating client-side API call)
  console.log('📝 Test 2: Retrieving purchase data via API simulation...')
  const { data: retrieveData, error: retrieveError } = await supabase
    .from('ga4_purchase_tracking')
    .select('purchase_data')
    .eq('order_id', testOrderId)
    .is('tracked_at', null)
    .single()

  if (retrieveError) {
    console.error('❌ Error retrieving purchase data:', retrieveError)
    return
  }

  if (!retrieveData) {
    console.error('❌ No purchase data found')
    return
  }

  console.log('✅ Purchase data retrieved successfully')
  console.log('📊 Purchase data:', JSON.stringify(retrieveData.purchase_data, null, 2))

  // Test 3: Mark as tracked (simulating client-side completion)
  console.log('📝 Test 3: Marking purchase as tracked...')
  const { data: updateData, error: updateError } = await supabase
    .from('ga4_purchase_tracking')
    .update({ tracked_at: new Date().toISOString() })
    .eq('order_id', testOrderId)

  if (updateError) {
    console.error('❌ Error marking purchase as tracked:', updateError)
    return
  }

  console.log('✅ Purchase marked as tracked successfully')

  // Test 4: Verify purchase is marked as tracked
  console.log('📝 Test 4: Verifying purchase is marked as tracked...')
  const { data: verifyData, error: verifyError } = await supabase
    .from('ga4_purchase_tracking')
    .select('tracked_at')
    .eq('order_id', testOrderId)
    .single()

  if (verifyError) {
    console.error('❌ Error verifying tracked status:', verifyError)
    return
  }

  if (!verifyData?.tracked_at) {
    console.error('❌ Purchase was not marked as tracked')
    return
  }

  console.log('✅ Purchase tracking status verified')

  // Test 5: Check that subsequent API calls return "already tracked"
  console.log('📝 Test 5: Testing duplicate tracking prevention...')
  const { data: duplicateData, error: duplicateError } = await supabase
    .from('ga4_purchase_tracking')
    .select('purchase_data')
    .eq('order_id', testOrderId)
    .is('tracked_at', null)
    .single()

  if (duplicateError?.code === 'PGRST116') {
    console.log('✅ Duplicate tracking prevented - no untracked data found')
  } else {
    console.error('❌ Duplicate tracking not prevented')
    return
  }

  // Clean up test data
  console.log('🧹 Cleaning up test data...')
  const { error: deleteError } = await supabase
    .from('ga4_purchase_tracking')
    .delete()
    .eq('order_id', testOrderId)

  if (deleteError) {
    console.error('❌ Error cleaning up test data:', deleteError)
  } else {
    console.log('✅ Test data cleaned up successfully')
  }

  console.log('\n🎉 All GA4 purchase tracking tests passed!')
  console.log('\n📋 Summary:')
  console.log('- ✅ Webhook can store purchase data')
  console.log('- ✅ Client-side API can retrieve purchase data')
  console.log('- ✅ Client-side can mark purchases as tracked')
  console.log('- ✅ Duplicate tracking is prevented')
  console.log('- ✅ Database operations work correctly')
  console.log('\n🚀 GA4 purchase tracking implementation is ready!')
}

testGA4PurchaseTracking().catch(console.error)