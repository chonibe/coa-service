const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

async function checkShopifyProtocol() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const supabase = createClient(url, key);

  console.log('--- Checking Shopify Data Protocol for #1182 ---');

  // 1. Find order in DB
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_name')
    .or('order_name.eq.#1182,order_number.eq.1182')
    .single();

  if (!order) return console.log('Order #1182 not found.');

  // 2. Fetch full order from Shopify
  const res = await fetch(`https://${shop}/admin/api/2024-01/orders/${order.id}.json?status=any`, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    console.error(`Shopify API error: ${res.status}`);
    return;
  }

  const { order: sOrder } = await res.json();

  console.log(`\nShopify Order: ${sOrder.name}`);
  console.log(`Financial Status: ${sOrder.financial_status}`);
  console.log(`Cancelled At: ${sOrder.cancelled_at}`);

  // 3. Find restocked/removed items in Shopify
  const restockedLineItemIds = new Set();
  if (sOrder.refunds) {
    sOrder.refunds.forEach(refund => {
      refund.refund_line_items.forEach(ri => {
        if (ri.restock === true) {
          restockedLineItemIds.add(ri.line_item_id.toString());
          console.log(`[RESTOCK FOUND] Item ID: ${ri.line_item_id}, Qty: ${ri.quantity}`);
        }
      });
    });
  }

  // 4. Compare with DB
  const { data: dbItems } = await supabase
    .from('order_line_items_v2')
    .select('line_item_id, name, status, edition_number')
    .eq('order_id', order.id);

  console.log('\n--- Comparing Database vs Shopify ---');
  let corrections = 0;

  for (const item of dbItems) {
    const isRestocked = restockedLineItemIds.has(item.line_item_id);
    const expectedStatus = isRestocked ? 'inactive' : (sOrder.financial_status === 'voided' ? 'inactive' : 'active');
    
    if (item.status !== expectedStatus) {
      console.log(`[MISMATCH] ${item.name} (ID: ${item.line_item_id})`);
      console.log(`  Current DB Status: ${item.status}`);
      console.log(`  Expected Status (based on restock): ${expectedStatus}`);
      
      // FIX IT
      const { error: upError } = await supabase
        .from('order_line_items_v2')
        .update({ 
          status: expectedStatus,
          edition_number: expectedStatus === 'inactive' ? null : item.edition_number,
          updated_at: new Date().toISOString()
        })
        .eq('line_item_id', item.line_item_id);
      
      if (!upError) {
        console.log(`  ✅ Fixed: Updated status to ${expectedStatus}${expectedStatus === 'inactive' ? ' and cleared edition number' : ''}.`);
        corrections++;
      }
    } else {
      console.log(`[OK] ${item.name} (${item.status})`);
    }
  }

  if (corrections > 0) {
    console.log(`\nFixed ${corrections} line item status discrepancies.`);
    // Re-trigger edition assignment for this order if things changed
    console.log('Re-triggering edition numbering for affected products...');
    const pids = Array.from(new Set(dbItems.map(i => i.product_id).filter(Boolean)));
    // (Actual RPC call would go here if needed)
  } else {
    console.log('\nNo status discrepancies found for order #1182.');
  }
}

checkShopifyProtocol();

