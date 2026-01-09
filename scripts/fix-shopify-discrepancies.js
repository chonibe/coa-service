const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function fixDiscrepancies() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const shop = env.match(/SHOPIFY_SHOP=["']?(.*?)["']?(\r|\n|$)/)[1];
  const token = env.match(/SHOPIFY_ACCESS_TOKEN=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log(`Using shop: ${shop}`);

  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  const shopifyOrders = new Map();
  for (const record of records) {
    const id = record['Id'];
    if (!id) continue;
    if (!shopifyOrders.has(id)) {
      shopifyOrders.set(id, {
        id: id,
        name: record['Name'],
        financial_status: record['Financial Status'],
        cancelled_at: record['Cancelled at'] || null
      });
    }
  }

  const { data: dbOrders } = await supabase.from('orders').select('id, order_name, financial_status, cancelled_at');
  const dbOrderMap = new Map(dbOrders.map(o => [o.id, o]));
  
  const idsToSync = [];
  for (const [id, sOrder] of shopifyOrders) {
    const dbOrder = dbOrderMap.get(id);
    if (!dbOrder) continue;

    const sVoided = sOrder.financial_status === 'voided' || !!sOrder.cancelled_at;
    const dbVoided = dbOrder.financial_status === 'voided' || !!dbOrder.cancelled_at;

    if (sVoided !== dbVoided) {
      idsToSync.push({ id, name: sOrder.name, shopifyStatus: sOrder.financial_status, dbStatus: dbOrder.financial_status });
    }
  }

  console.log(`Starting fix for ${idsToSync.length} inconsistent orders...`);

  for (let i = 0; i < idsToSync.length; i++) {
    const { id, name, shopifyStatus, dbStatus } = idsToSync[i];
    console.log(`[${i+1}/${idsToSync.length}] Fixing order ${name} (${id})... Status: DB(${dbStatus}) -> Shopify(${shopifyStatus})`);
    
    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/orders/${id}.json`, {
        headers: { "X-Shopify-Access-Token": token }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${name}: ${response.statusText}`);
        continue;
      }
      
      const { order } = await response.json();
      
      // Determine archived status
      const shopifyTags = (order.tags || "").toLowerCase();
      const archived = shopifyTags.includes("archived") || order.closed_at !== null || order.cancel_reason !== null;

      // Extract name, phone, address
      const getShopifyName = (order) => {
        const sources = [order.customer, order.shipping_address, order.billing_address];
        for (const s of sources) {
          if (s && (s.first_name || s.last_name)) {
            return `${s.first_name || ''} ${s.last_name || ''}`.trim();
          }
        }
        return null;
      };

      const ownerName = getShopifyName(order);
      const ownerPhone = order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || null;
      const ownerAddress = order.shipping_address || order.billing_address || null;

      // Update order in DB
      const { error: updateError } = await supabase.from('orders').update({
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        cancelled_at: order.cancelled_at,
        archived: archived,
        customer_name: ownerName,
        customer_phone: ownerPhone,
        shipping_address: ownerAddress,
        raw_shopify_order_data: order,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (updateError) {
        console.error(`Error updating ${name}:`, updateError);
      } else {
        // Also update line items status
        const isCancelled = !!order.cancelled_at || order.financial_status === 'voided';
        const { error: liError } = await supabase.from('order_line_items_v2').update({
          status: isCancelled ? 'inactive' : 'active',
          updated_at: new Date().toISOString()
        }).eq('order_id', id);
        
        if (liError) console.error(`Error updating line items for ${name}:`, liError);
        
        // Trigger edition reassignment for any products in this order
        const productIds = Array.from(new Set(order.line_items.map(li => li.product_id?.toString()).filter(Boolean)));
        for (const pid of productIds) {
          await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
        }
        console.log(`Successfully fixed ${name}`);
      }
    } catch (err) {
      console.error(`Unexpected error for ${name}:`, err);
    }
    
    // Rate limiting
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 500));
  }

  console.log('Fix complete.');
}

fixDiscrepancies();
