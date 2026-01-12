require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mock syncShopifyOrder since importing TS utility in JS is complex here
// Copying logic from lib/shopify/order-sync-utils.ts
async function robustSync(supabase, order) {
    const orderId = order.id.toString();
    const orderName = order.name;
    
    let ownerEmail = order.email?.toLowerCase()?.trim() || null;
    const getShopifyName = (o) => {
        const sources = [o.customer, o.shipping_address, o.billing_address];
        for (const s of sources) {
            if (s && (s.first_name || s.last_name)) {
                return `${s.first_name || ''} ${s.last_name || ''}`.trim();
            }
        }
        return null;
    };
    let ownerName = getShopifyName(order);
    let ownerPhone = order.customer?.phone || order.shipping_address?.phone || order.billing_address?.phone || null;
    let ownerAddress = order.shipping_address || order.billing_address || null;

    const isGift = (orderName || "").toLowerCase().startsWith('simply');
    const shopifyTags = (order.tags || "").toLowerCase();
    const archived = shopifyTags.includes("archived") || order.closed_at !== null || order.cancel_reason !== null;

    const orderData = {
        id: orderId,
        order_number: order.order_number?.toString() || orderName.replace('#', ''),
        order_name: orderName,
        processed_at: order.processed_at || order.created_at,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status || 'pending',
        total_price: parseFloat(order.current_total_price || order.total_price || '0'),
        currency_code: order.currency || 'USD',
        customer_email: ownerEmail,
        customer_name: ownerName,
        customer_phone: ownerPhone,
        shipping_address: ownerAddress,
        updated_at: new Date().toISOString(),
        raw_shopify_order_data: order,
        cancelled_at: order.cancelled_at || null,
        archived: archived,
        shopify_order_status: order.status || null,
        source: isGift ? 'warehouse' : 'shopify',
        customer_id: order.customer?.id?.toString() || null,
        shopify_id: orderId,
        created_at: order.created_at,
    };

    await supabase.from('orders').upsert(orderData);

    const removedLineItemIds = new Set();
    if (order.refunds && Array.isArray(order.refunds)) {
        order.refunds.forEach((refund) => {
            refund.refund_line_items?.forEach((ri) => {
                removedLineItemIds.add(ri.line_item_id);
            });
        });
    }

    const shopifyProductIds = order.line_items.map((li) => li.product_id).filter(Boolean);
    const { data: products } = await supabase
        .from('products')
        .select('shopify_id, img_url, image_url')
        .in('shopify_id', shopifyProductIds);
    const productMap = new Map(products?.map(p => [p.shopify_id, p.img_url || p.image_url]) || []);

    const dbLineItems = order.line_items.map((li) => {
        const isRefunded = removedLineItemIds.has(li.id);
        const removedProperty = li.properties?.find((p) => 
            (p.name === 'removed' || p.key === 'removed') && 
            (p.value === 'true' || p.value === true)
        );
        const isRemovedByProperty = removedProperty !== undefined;
        const isRemovedByQty = (li.fulfillable_quantity === 0 || li.fulfillable_quantity === '0') && 
                               li.fulfillment_status !== 'fulfilled';
        const isCancelled = order.financial_status === 'voided' || order.cancelled_at !== null;
        const isFulfilled = li.fulfillment_status === 'fulfilled';
        const isPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status);
        
        const isInactive = isRefunded || isRemovedByProperty || isRemovedByQty || isCancelled;
        const status = isInactive ? 'inactive' : (isPaid || isFulfilled ? 'active' : 'inactive');

        return {
            order_id: orderId,
            order_name: orderName,
            line_item_id: li.id.toString(),
            product_id: li.product_id?.toString() || '',
            variant_id: li.variant_id?.toString() || null,
            name: li.title,
            description: li.title,
            quantity: li.quantity,
            price: parseFloat(li.price),
            sku: li.sku || null,
            vendor_name: li.vendor,
            fulfillment_status: li.fulfillment_status,
            status: status,
            owner_email: ownerEmail,
            owner_name: ownerName,
            img_url: li.product_id ? productMap.get(li.product_id.toString()) || null : null,
            created_at: order.created_at,
            updated_at: new Date().toISOString(),
        };
    });

    await supabase.from('order_line_items_v2').upsert(dbLineItems, { onConflict: 'line_item_id' });

    const allProductIds = Array.from(new Set(dbLineItems.map((li) => li.product_id))).filter(Boolean);
    for (const pid of allProductIds) {
        await supabase.rpc('assign_edition_numbers', { p_product_id: pid });
    }
}

async function reSyncDiscrepancies() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, key);

    const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    console.log('Fetching orders with discrepancies...');
    const { data: dbOrders } = await supabase
        .from('orders')
        .select('id, order_name, customer_id')
        .or('financial_status.eq.voided,fulfillment_status.in.(canceled,restocked)');

    // Also include orders for the specific collector mentioned
    const { data: collectorOrders } = await supabase
        .from('orders')
        .select('id, order_name, customer_id')
        .eq('customer_id', '7908039164131');

    const ordersToSync = [...new Map([...(dbOrders || []), ...(collectorOrders || [])].map(o => [o.id, o])).values()];

    console.log(`Processing ${ordersToSync.length} orders...`);

    for (const order of ordersToSync) {
        try {
            process.stdout.write(`\rSyncing ${order.order_name} (${order.id})...`);
            
            // Use status=any to find archived orders
            const res = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/orders/${order.id}.json?status=any`, {
                headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN }
            });

            if (!res.ok) {
                console.log(`\n⚠️ Failed to fetch ${order.order_name} from Shopify: ${res.status}`);
                continue;
            }

            const { order: sOrder } = await res.json();
            if (!sOrder) continue;

            await robustSync(supabase, sOrder);

        } catch (err) {
            console.error(`\n❌ Error processing ${order.id}:`, err.message);
        }
    }

    console.log('\n\n✅ Done! Line items and editions are synchronized.');
}

reSyncDiscrepancies();

