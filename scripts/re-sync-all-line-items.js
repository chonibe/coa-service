const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.error('No .env file found');
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?(.*?)["']?\s*$/);
        if (match) process.env[match[1]] = match[2];
    });
}
loadEnv();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resyncLineItems() {
    console.log('🚀 Starting re-sync of all Shopify line items...');

    // 1. Fetch products for image mapping
    const { data: products } = await supabase.from('products').select('shopify_id, img_url, name');
    const productMap = new Map(products?.map(p => [p.shopify_id, p]) || []);

    // 2. Fetch recent orders from DB (last 500)
    const { data: dbOrders } = await supabase
        .from('orders')
        .select('id, order_name, customer_email, customer_name, processed_at')
        .not('id', 'like', 'WH-%')
        .order('processed_at', { ascending: false })
        .limit(500);

    console.log(`Processing ${dbOrders.length} orders...`);

    for (const order of dbOrders) {
        try {
            process.stdout.write(`\rSyncing ${order.order_name} (${order.id})...`);
            
            const res = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/orders/${order.id}.json`, {
                headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN }
            });

            if (!res.ok) {
                console.log(`\n⚠️ Skipping ${order.order_name}: ${res.status}`);
                continue;
            }

            const { order: sOrder } = await res.json();
            if (!sOrder.line_items) continue;

            // Map to v2 line items
            const lineItems = sOrder.line_items.map(li => {
                const pId = li.product_id?.toString();
                const product = productMap.get(pId);
                const isArtwork = product && (product.edition_size || product.vendor_name !== 'Street Collector');

                return {
                    line_item_id: li.id.toString(),
                    order_id: sOrder.id.toString(),
                    order_name: sOrder.name,
                    product_id: pId,
                    variant_id: li.variant_id?.toString(),
                    name: li.title,
                    description: li.title,
                    price: parseFloat(li.price),
                    quantity: li.quantity,
                    sku: li.sku,
                    vendor_name: li.vendor,
                    fulfillment_status: li.fulfillment_status || 'pending',
                    status: sOrder.cancelled_at ? 'inactive' : 'active',
                    created_at: sOrder.created_at,
                    updated_at: new Date().toISOString(),
                    img_url: product?.img_url || null,
                    owner_email: order.customer_email || sOrder.email?.toLowerCase(),
                    owner_name: order.customer_name || (sOrder.customer ? `${sOrder.customer.first_name} ${sOrder.customer.last_name}` : null)
                };
            });

            // Upsert line items
            const { error: upsertError } = await supabase
                .from('order_line_items_v2')
                .upsert(lineItems, { onConflict: 'line_item_id' });

            if (upsertError) console.error(`\n❌ Error upserting line items for ${order.order_name}:`, upsertError.message);

        } catch (err) {
            console.error(`\n❌ Error processing ${order.id}:`, err.message);
        }
    }

    console.log('\n\n✅ Done! Line items are synchronized.');
    
    // 3. Re-assign edition numbers
    console.log('Re-triggering edition assignment...');
    const uniquePIds = [...new Set(products.map(p => p.shopify_id))];
    for (const pId of uniquePIds) {
        await supabase.rpc('assign_edition_numbers', { p_product_id: pId });
    }
    console.log('✅ Editions reassigned.');
}

resyncLineItems();

