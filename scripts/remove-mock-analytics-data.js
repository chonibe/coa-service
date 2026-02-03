#!/usr/bin/env node

/**
 * Remove Mock Analytics Data Script
 * Cleans up fake/test data from analytics dashboards
 *
 * This script removes:
 * - Mock orders created by populate-test-collector.js (TEST-ORDER-*)
 * - Mock line items created by populate-test-collector.js (TEST-LI-*)
 * - Test payout data created by create-test-payout-data scripts (TEST-ORD-*, TEST-LI-*)
 * - Any orders/line items with "beigelbills@gmail.com" (test collector)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function removeMockAnalyticsData() {
  console.log('🧹 Starting mock analytics data cleanup...');

  // Load environment
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  let removedCount = 0;

  try {
    // 1. Remove mock line items from populate-test-collector.js
    console.log('\n📦 Removing mock line items (TEST-LI-*)...');
    const { data: mockLineItems, error: liError } = await supabase
      .from('order_line_items_v2')
      .select('line_item_id, name, vendor_name')
      .ilike('line_item_id', 'TEST-LI-%');

    if (liError) {
      console.error('Error fetching mock line items:', liError);
    } else if (mockLineItems && mockLineItems.length > 0) {
      console.log(`Found ${mockLineItems.length} mock line items:`);
      mockLineItems.forEach(item => {
        console.log(`  - ${item.name} by ${item.vendor_name} (${item.line_item_id})`);
      });

      const { error: deleteLiError } = await supabase
        .from('order_line_items_v2')
        .delete()
        .ilike('line_item_id', 'TEST-LI-%');

      if (deleteLiError) {
        console.error('Error deleting mock line items:', deleteLiError);
      } else {
        console.log(`✅ Deleted ${mockLineItems.length} mock line items`);
        removedCount += mockLineItems.length;
      }
    } else {
      console.log('✅ No mock line items found');
    }

    // 2. Remove mock orders from populate-test-collector.js
    console.log('\n🛒 Removing mock orders (TEST-ORDER-*)...');
    const { data: mockOrders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, customer_email')
      .ilike('id', 'TEST-ORDER-%');

    if (orderError) {
      console.error('Error fetching mock orders:', orderError);
    } else if (mockOrders && mockOrders.length > 0) {
      console.log(`Found ${mockOrders.length} mock orders:`);
      mockOrders.forEach(order => {
        console.log(`  - Order #${order.order_number} for ${order.customer_email} (${order.id})`);
      });

      const { error: deleteOrderError } = await supabase
        .from('orders')
        .delete()
        .ilike('id', 'TEST-ORDER-%');

      if (deleteOrderError) {
        console.error('Error deleting mock orders:', deleteOrderError);
      } else {
        console.log(`✅ Deleted ${mockOrders.length} mock orders`);
        removedCount += mockOrders.length;
      }
    } else {
      console.log('✅ No mock orders found');
    }

    // 3. Remove test payout data (TEST-ORD-*)
    console.log('\n💰 Removing test payout data (TEST-ORD-*)...');
    const { data: testPayoutOrders, error: payoutOrderError } = await supabase
      .from('orders')
      .select('id, order_number, customer_email')
      .ilike('id', 'TEST-ORD-%');

    if (payoutOrderError) {
      console.error('Error fetching test payout orders:', payoutOrderError);
    } else if (testPayoutOrders && testPayoutOrders.length > 0) {
      console.log(`Found ${testPayoutOrders.length} test payout orders:`);
      testPayoutOrders.forEach(order => {
        console.log(`  - Order #${order.order_number} for ${order.customer_email} (${order.id})`);
      });

      const { error: deletePayoutOrderError } = await supabase
        .from('orders')
        .delete()
        .ilike('id', 'TEST-ORD-%');

      if (deletePayoutOrderError) {
        console.error('Error deleting test payout orders:', deletePayoutOrderError);
      } else {
        console.log(`✅ Deleted ${testPayoutOrders.length} test payout orders`);
        removedCount += testPayoutOrders.length;
      }
    } else {
      console.log('✅ No test payout orders found');
    }

    // 4. Remove test payout line items (TEST-LI-* with timestamps)
    const { data: testPayoutLineItems, error: payoutLiError } = await supabase
      .from('order_line_items_v2')
      .select('line_item_id, name, vendor_name')
      .ilike('line_item_id', 'TEST-LI-%');

    // Filter out the ones already deleted above (from populate-test-collector)
    const remainingTestLi = testPayoutLineItems?.filter(item =>
      !item.line_item_id.includes('TEST-LI-') || item.line_item_id.length > 12
    ) || [];

    if (remainingTestLi.length > 0) {
      console.log(`Found ${remainingTestLi.length} additional test line items:`);
      remainingTestLi.forEach(item => {
        console.log(`  - ${item.name} by ${item.vendor_name} (${item.line_item_id})`);
      });

      const { error: deletePayoutLiError } = await supabase
        .from('order_line_items_v2')
        .delete()
        .in('line_item_id', remainingTestLi.map(item => item.line_item_id));

      if (deletePayoutLiError) {
        console.error('Error deleting test payout line items:', deletePayoutLiError);
      } else {
        console.log(`✅ Deleted ${remainingTestLi.length} test payout line items`);
        removedCount += remainingTestLi.length;
      }
    }

    // 5. Remove test collector profile (beigelbills@gmail.com)
    console.log('\n👤 Removing test collector profile...');
    const { data: testProfiles, error: profileError } = await supabase
      .from('collector_profiles')
      .select('email, first_name, last_name')
      .eq('email', 'beigelbills@gmail.com');

    if (profileError) {
      console.error('Error fetching test profiles:', profileError);
    } else if (testProfiles && testProfiles.length > 0) {
      console.log(`Found ${testProfiles.length} test collector profile(s):`);
      testProfiles.forEach(profile => {
        console.log(`  - ${profile.first_name} ${profile.last_name} (${profile.email})`);
      });

      const { error: deleteProfileError } = await supabase
        .from('collector_profiles')
        .delete()
        .eq('email', 'beigelbills@gmail.com');

      if (deleteProfileError) {
        console.error('Error deleting test profiles:', deleteProfileError);
      } else {
        console.log(`✅ Deleted ${testProfiles.length} test collector profile(s)`);
        removedCount += testProfiles.length;
      }
    } else {
      console.log('✅ No test collector profiles found');
    }

    // 6. Remove test vendor (Test Artisan)
    console.log('\n🎨 Removing test vendor...');
    const { data: testVendors, error: vendorError } = await supabase
      .from('vendors')
      .select('vendor_name, contact_email')
      .eq('vendor_name', 'Test Artisan');

    if (vendorError) {
      console.error('Error fetching test vendors:', vendorError);
    } else if (testVendors && testVendors.length > 0) {
      console.log(`Found ${testVendors.length} test vendor(s):`);
      testVendors.forEach(vendor => {
        console.log(`  - ${vendor.vendor_name} (${vendor.contact_email})`);
      });

      const { error: deleteVendorError } = await supabase
        .from('vendors')
        .delete()
        .eq('vendor_name', 'Test Artisan');

      if (deleteVendorError) {
        console.error('Error deleting test vendors:', deleteVendorError);
      } else {
        console.log(`✅ Deleted ${testVendors.length} test vendor(s)`);
        removedCount += testVendors.length;
      }
    } else {
      console.log('✅ No test vendors found');
    }

    console.log(`\n🎉 Cleanup complete! Removed ${removedCount} mock/test records from analytics.`);
    console.log('\n📊 Analytics will now show only real sales and artist data.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  removeMockAnalyticsData();
}

module.exports = { removeMockAnalyticsData };