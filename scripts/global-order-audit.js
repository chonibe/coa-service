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

async function globalOrderAudit() {
  console.log('--- Starting Global Order Audit & Edition Re-sync ---');
  
  // 1. Fetch all orders with raw data
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_name, raw_shopify_order_data, customer_email, customer_name')
    .not('raw_shopify_order_data', 'is', null);

  if (ordersError) {
    console.error('Error fetching orders:', ordersError.message);
    return;
  }

  console.log(`Processing ${orders.length} orders...`);

  // Map products to get images (optional but good for consistency)
  const { data: products } = await supabase.from('products').select('shopify_id, img_url');
  const productMap = new Map(products?.map(p => [p.shopify_id, p.img_url]) || []);

  // Fetch all warehouse orders for PII recovery
  const { data: warehouseOrders } = await supabase.from('warehouse_orders').select('shopify_order_id, ship_email, ship_name');
  const warehouseMap = new Map(warehouseOrders?.map(wo => [wo.shopify_order_id, wo]) || []);

  const productIdsToResequence = new Set();
  let updatedLineItems = 0;
  let skippedOrders = 0;

  for (const orderRecord of orders) {
    const order = orderRecord.raw_shopify_order_data;
    if (!order || !order.line_items) {
      skippedOrders++;
      continue;
    }

    const orderId = orderRecord.id;
    const orderName = orderRecord.order_name;
    const financialStatus = order.financial_status;

    // A. Identify removed items via refunds
    const removedLineItemIds = new Set();
    if (order.refunds && Array.isArray(order.refunds)) {
      order.refunds.forEach((refund) => {
        refund.refund_line_items?.forEach((ri) => {
          removedLineItemIds.add(ri.line_item_id.toString());
        });
      });
    }

    // B. PII Recovery (Basic)
    let ownerEmail = orderRecord.customer_email || order.email?.toLowerCase()?.trim() || null;
    let ownerName = orderRecord.customer_name || null;
    
    if (!ownerName) {
      const sources = [order.customer, order.shipping_address, order.billing_address];
      for (const s of sources) {
        if (s && (s.first_name || s.last_name)) {
          ownerName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
          break;
        }
      }
    }

    // Warehouse Fallback
    const whMatched = warehouseMap.get(orderId);
    if (whMatched) {
      ownerEmail = whMatched.ship_email?.toLowerCase()?.trim() || ownerEmail;
      ownerName = whMatched.ship_name || ownerName;
    }

    // C. Process Line Items
    const dbLineItems = order.line_items.map((li) => {
      const isRefunded = removedLineItemIds.has(li.id.toString());
      
      const removedProperty = li.properties?.find((p) => 
        (p.name === 'removed' || p.key === 'removed') && 
        (p.value === 'true' || p.value === true)
      );
      const isRemovedByProperty = removedProperty !== undefined;
      
      const isRemovedByQty = (li.fulfillable_quantity === 0 || li.fulfillable_quantity === '0') && 
                             li.fulfillment_status !== 'fulfilled';
      
      const isCancelled = financialStatus === 'voided';
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
        owner_email: ownerEmail,
        owner_name: ownerName,
        img_url: li.product_id ? productMap.get(li.product_id.toString()) || null : null,
        created_at: order.created_at,
        updated_at: new Date().toISOString()
      };
    });

    if (dbLineItems.length > 0) {
      const { error: liError } = await supabase
        .from('order_line_items_v2')
        .upsert(dbLineItems, { onConflict: 'line_item_id' });
      
      if (liError) {
        console.error(`Error upserting line items for order ${orderName}:`, liError.message);
      } else {
        updatedLineItems += dbLineItems.length;
      }
    }
    
    // Periodically log progress
    if (updatedLineItems % 100 === 0) {
      console.log(`Updated ${updatedLineItems} line items so far...`);
    }
  }

  console.log(`\nStep 1 Complete: Updated ${updatedLineItems} line items across ${orders.length} orders.`);
  
  // 2. Resequence Edition Numbers
  console.log(`\nStep 2: Resequencing edition numbers for ${productIdsToResequence.size} products...`);
  let productsProcessed = 0;
  for (const pid of productIdsToResequence) {
    const { error: rpcError } = await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
    if (rpcError) {
      console.error(`Error resequencing product ${pid}:`, rpcError.message);
    }
    productsProcessed++;
    if (productsProcessed % 10 === 0) {
      console.log(`Processed ${productsProcessed}/${productIdsToResequence.size} products...`);
    }
  }

  console.log(`\n--- Global Audit Finished Successfully ---`);
  console.log(`Total Orders Processed: ${orders.length}`);
  console.log(`Total Line Items Upserted: ${updatedLineItems}`);
  console.log(`Total Products Re-sequenced: ${productsProcessed}`);
}

globalOrderAudit();

