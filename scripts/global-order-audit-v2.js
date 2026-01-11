const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase URL or Service Role Key is missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function globalOrderAuditV2() {
  console.log('--- Starting Global Order Audit V2 (Including Cancellation Check) ---');
  
  // 1. Fetch all orders with raw data
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_name, raw_shopify_order_data, customer_email, customer_name, cancelled_at')
    .not('raw_shopify_order_data', 'is', null);

  if (ordersError) {
    console.error('Error fetching orders:', ordersError.message);
    return;
  }

  console.log(`Processing ${orders.length} orders...`);

  const productIdsToResequence = new Set();
  let updatedLineItems = 0;

  for (const orderRecord of orders) {
    const order = orderRecord.raw_shopify_order_data;
    if (!order || !order.line_items) continue;

    const orderId = orderRecord.id;
    const orderName = orderRecord.order_name;
    const financialStatus = order.financial_status;
    const cancelledAt = order.cancelled_at || orderRecord.cancelled_at;

    const removedLineItemIds = new Set();
    if (order.refunds && Array.isArray(order.refunds)) {
      order.refunds.forEach((refund) => {
        refund.refund_line_items?.forEach((ri) => {
          removedLineItemIds.add(ri.line_item_id.toString());
        });
      });
    }

    const dbLineItems = order.line_items.map((li) => {
      const isRefunded = removedLineItemIds.has(li.id.toString());
      
      const removedProperty = li.properties?.find((p) => 
        (p.name === 'removed' || p.key === 'removed') && 
        (p.value === 'true' || p.value === true)
      );
      const isRemovedByProperty = removedProperty !== undefined;
      
      const isRemovedByQty = (li.fulfillable_quantity === 0 || li.fulfillable_quantity === '0') && 
                             li.fulfillment_status !== 'fulfilled';
      
      // CRITICAL FIX: Include cancelled_at check
      const isCancelled = financialStatus === 'voided' || cancelledAt !== null;
      const isFulfilled = li.fulfillment_status === 'fulfilled';
      const isPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(financialStatus);
      
      const isInactive = isRefunded || isRemovedByProperty || isRemovedByQty || isCancelled;
      const status = isInactive ? 'inactive' : (isPaid || isFulfilled ? 'active' : 'inactive');

      if (li.product_id) productIdsToResequence.add(li.product_id.toString());

      return {
        order_id: orderId,
        order_name: orderName,
        line_item_id: li.id.toString(),
        product_id: li.product_id ? li.product_id.toString() : null,
        variant_id: li.variant_id ? li.variant_id.toString() : null,
        name: li.title,
        description: li.title,
        quantity: li.quantity,
        price: parseFloat(li.price || '0'),
        sku: li.sku || null,
        vendor_name: li.vendor,
        fulfillment_status: li.fulfillment_status,
        status: status,
        owner_email: orderRecord.customer_email?.toLowerCase()?.trim(),
        owner_name: orderRecord.customer_name,
        created_at: order.created_at,
        updated_at: new Date().toISOString()
      };
    });

    if (dbLineItems.length > 0) {
      const { error: liError } = await supabase
        .from('order_line_items_v2')
        .upsert(dbLineItems, { onConflict: 'line_item_id' });
      
      if (liError) {
        console.error(`Error upserting for ${orderName}:`, liError.message);
      } else {
        updatedLineItems += dbLineItems.length;
      }
    }
  }

  console.log(`\nStep 1 Complete: Updated ${updatedLineItems} line items.`);
  
  // 2. Resequence Edition Numbers
  console.log(`\nStep 2: Resequencing edition numbers for ${productIdsToResequence.size} products...`);
  let productsProcessed = 0;
  for (const pid of productIdsToResequence) {
    await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
    productsProcessed++;
    if (productsProcessed % 20 === 0) console.log(`Processed ${productsProcessed}...`);
  }

  console.log(`\nGlobal Audit V2 Finished Successfully.`);
}

globalOrderAuditV2();

