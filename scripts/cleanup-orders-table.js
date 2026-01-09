const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env
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
        if (match) {
            process.env[match[1]] = match[2];
        }
    });
}

loadEnv();

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHINADIVISION_API_KEY = process.env.CHINADIVISION_API_KEY || "5f91972f8d59ec8039cecfec3adcead5";

if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !CHINADIVISION_API_KEY) {
    console.error('❌ Missing required environment variables. Check .env file.');
    console.log({
        SHOPIFY_SHOP: !!SHOPIFY_SHOP,
        SHOPIFY_ACCESS_TOKEN: !!SHOPIFY_ACCESS_TOKEN,
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY,
        CHINADIVISION_API_KEY: !!CHINADIVISION_API_KEY
    });
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchAllShopifyOrders(startDate) {
    console.log(`[Shopify] Fetching all orders since ${startDate}...`);
    let allOrders = [];
    let nextPageUrl = `https://${SHOPIFY_SHOP}/admin/api/2024-01/orders.json?status=any&created_at_min=${startDate}&limit=250`;

    while (nextPageUrl) {
        try {
            const response = await fetch(nextPageUrl, {
                headers: {
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Shopify API error: ${response.status} ${text}`);
            }

            const data = await response.json();
            allOrders = allOrders.concat(data.orders || []);

            const linkHeader = response.headers.get("link");
            const nextMatch = linkHeader?.match(/<([^>]+)>; rel="next"/);
            nextPageUrl = nextMatch ? nextMatch[1] : null;

            process.stdout.write(`\r[Shopify] Fetched ${allOrders.length} orders...`);
        } catch (error) {
            console.error('\n[Shopify] Error during fetch:', error.message);
            break;
        }
    }
    console.log('\n[Shopify] Fetch complete.');
    return allOrders;
}

async function fetchAllWarehouseOrders(startDate, endDate) {
    console.log(`[Warehouse] Fetching all orders from ${startDate} to ${endDate}...`);
    let allOrders = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const url = `https://api.chinadivision.com/orders-info?page=${page}&page_size=250&start=${startDate}&end=${endDate}`;
            const response = await fetch(url, {
                headers: { 'apikey': CHINADIVISION_API_KEY }
            });

            if (!response.ok) {
                throw new Error(`Warehouse API error: ${response.status}`);
            }

            const data = await response.json();
            if (data.code !== 0) {
                console.warn(`\n[Warehouse] API Error: ${data.msg}`);
                break;
            }

            const orders = data.data.order_infos || [];
            if (orders.length === 0) {
                hasMore = false;
                break;
            }

            allOrders = allOrders.concat(orders);
            process.stdout.write(`\r[Warehouse] Fetched ${allOrders.length} orders so far (Page ${page})...`);
            page++;
            if (page > 200) break; // Safety
        } catch (error) {
            console.error('\n[Warehouse] Error during fetch:', error.message);
            break;
        }
    }
    console.log('\n[Warehouse] Fetch complete.');
    return allOrders;
}

async function cleanupOrders(live = false) {
    const dryRun = !live;
    console.log(`\n🚀 Starting Cleanup (Mode: ${dryRun ? 'DRY RUN' : 'LIVE'})\n`);

    const startDate = "2023-01-01T00:00:00Z";
    const warehouseStartDate = "2023-01-01";
    const warehouseEndDate = new Date().toISOString().split('T')[0];

    // 1. Fetch everything
    const [shopifyOrders, warehouseOrders, { data: existingOrders }] = await Promise.all([
        fetchAllShopifyOrders(startDate),
        fetchAllWarehouseOrders(warehouseStartDate, warehouseEndDate),
        supabase.from('orders').select('*')
    ]);

    console.log(`\n📊 Inventory:`);
    console.log(`- Shopify: ${shopifyOrders.length}`);
    console.log(`- Warehouse: ${warehouseOrders.length}`);
    console.log(`- Database: ${existingOrders?.length || 0}`);

    const orderUpserts = [];
    const warehouseCacheUpserts = [];
    const idsToDelete = [];

    // Create lookup maps
    const shopifyByNameMap = new Map();
    const shopifyByIdMap = new Map();
    const shopifyByEmailMap = new Map();

    shopifyOrders.forEach(o => {
        const id = String(o.id);
        const name = o.name.toLowerCase();
        const email = o.email?.toLowerCase();
        
        shopifyByIdMap.set(id, o);
        shopifyByNameMap.set(name, o);
        if (email) {
            if (!shopifyByEmailMap.has(email)) shopifyByEmailMap.set(email, []);
            shopifyByEmailMap.get(email).push(o);
        }
    });

    // Map to track warehouse records that have been matched to a Shopify order
    const matchedWhSysIds = new Set();

    // 2. Process Shopify Orders (Primary Source of Truth)
    console.log("\n[Step 1] Syncing Shopify orders and matching with warehouse data...");
    for (const shopifyOrder of shopifyOrders) {
        const shopifyId = String(shopifyOrder.id);
        const orderName = shopifyOrder.name;
        const isGift = orderName.toLowerCase().startsWith('simply');
        
        // Find matching warehouse order for enrichment
        // Priority 1: Match by shopify_order_id in warehouse data
        // Priority 2: Match by order_id (e.g. #1234)
        // Priority 3: Match by email and order number (if ID is missing)
        let matchedWh = warehouseOrders.find(wo => 
            String(wo.shopify_order_id) === shopifyId || 
            wo.order_id.toLowerCase() === orderName.toLowerCase() ||
            (wo.ship_email?.toLowerCase() === shopifyOrder.email?.toLowerCase() && 
             wo.order_id.replace('#', '') === shopifyOrder.order_number.toString())
        );

        if (matchedWh) matchedWhSysIds.add(matchedWh.sys_order_id);

        const orderData = {
            id: shopifyId,
            order_number: shopifyOrder.order_number,
            order_name: orderName,
            processed_at: shopifyOrder.processed_at || shopifyOrder.created_at,
            financial_status: shopifyOrder.financial_status,
            fulfillment_status: shopifyOrder.fulfillment_status,
            total_price: parseFloat(shopifyOrder.current_total_price || "0"),
            currency_code: shopifyOrder.currency,
            customer_email: (matchedWh?.ship_email || shopifyOrder.email || "").toLowerCase().trim(),
            customer_name: (matchedWh?.ship_name || (shopifyOrder.customer ? `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}`.trim() : null) || "").trim(),
            customer_phone: matchedWh?.ship_phone || shopifyOrder.customer?.phone || shopifyOrder.shipping_address?.phone || null,
            shipping_address: matchedWh?.ship_address || shopifyOrder.shipping_address || null,
            customer_id: shopifyOrder.customer?.id ? String(shopifyOrder.customer.id) : null,
            shopify_id: shopifyId,
            raw_shopify_order_data: shopifyOrder,
            created_at: shopifyOrder.created_at,
            cancelled_at: shopifyOrder.cancelled_at,
            archived: !!(shopifyOrder.closed_at || (shopifyOrder.tags || "").toLowerCase().includes("archived")),
            shopify_order_status: shopifyOrder.status,
            source: isGift ? 'warehouse' : 'shopify',
            updated_at: new Date().toISOString()
        };

        orderUpserts.push(orderData);

        if (matchedWh) {
            warehouseCacheUpserts.push({
                id: matchedWh.sys_order_id,
                order_id: matchedWh.order_id,
                shopify_order_id: shopifyId,
                ship_email: matchedWh.ship_email?.toLowerCase(),
                ship_name: `${matchedWh.first_name || ''} ${matchedWh.last_name || ''}`.trim(),
                ship_phone: matchedWh.ship_phone,
                ship_address: {
                    address1: matchedWh.ship_address1,
                    address2: matchedWh.ship_address2,
                    city: matchedWh.ship_city,
                    state: matchedWh.ship_state,
                    zip: matchedWh.ship_zip,
                    country: matchedWh.ship_country
                },
                tracking_number: matchedWh.tracking_number,
                status: matchedWh.status,
                status_name: matchedWh.status_name,
                raw_data: matchedWh,
                updated_at: new Date().toISOString()
            });
        }
    }

    // 3. Process Warehouse-only Orders
    console.log("[Step 2] Processing Warehouse orders that don't match Shopify...");
    for (const whOrder of warehouseOrders) {
        if (matchedWhSysIds.has(whOrder.sys_order_id)) continue;

        // User instruction: "if you cannot locate a paired shopify order id or email do not mark them as shopify"
        const emailMatch = whOrder.ship_email ? shopifyByEmailMap.get(whOrder.ship_email.toLowerCase()) : null;
        
        // If it has a shopify_order_id or an email match, it might be a shopify order we missed in the fetch
        // but the user said "if you cannot locate... do not mark them as shopify"
        // So we only mark as shopify if we actually found a match in our fetched list.
        const source = 'warehouse';
        const dbId = `WH-${whOrder.sys_order_id || whOrder.order_id}`;
        const isGift = whOrder.order_id.toLowerCase().startsWith('simply');

        const orderData = {
            id: dbId,
            order_number: parseInt(whOrder.order_id.replace(/\D/g, '')) || 0,
            order_name: whOrder.order_id,
            processed_at: whOrder.date_added || new Date().toISOString(),
            financial_status: 'paid',
            fulfillment_status: whOrder.status === 3 ? 'fulfilled' : 'pending',
            total_price: 0,
            currency_code: 'USD',
            customer_email: whOrder.ship_email?.toLowerCase() || null,
            customer_name: whOrder.ship_name || null,
            customer_phone: whOrder.ship_phone || null,
            shipping_address: whOrder.ship_address || null,
            source: source,
            raw_shopify_order_data: { source: isGift ? 'simply_gift' : 'warehouse_manual' },
            updated_at: new Date().toISOString()
        };

        orderUpserts.push(orderData);
        
        warehouseCacheUpserts.push({
            id: whOrder.sys_order_id || whOrder.order_id,
            order_id: whOrder.order_id,
            shopify_order_id: whOrder.shopify_order_id || null,
            ship_email: whOrder.ship_email?.toLowerCase(),
            ship_name: `${whOrder.first_name || ''} ${whOrder.last_name || ''}`.trim(),
            ship_phone: whOrder.ship_phone,
            ship_address: {
                address1: whOrder.ship_address1,
                address2: whOrder.ship_address2,
                city: whOrder.ship_city,
                state: whOrder.ship_state,
                zip: whOrder.ship_zip,
                country: whOrder.ship_country
            },
            tracking_number: whOrder.tracking_number,
            status: whOrder.status,
            status_name: whOrder.status_name,
            raw_data: whOrder,
            updated_at: new Date().toISOString()
        });
    }

    // 4. Identify and delete duplicates in DB
    console.log("[Step 3] Finding duplicates to delete...");
    if (existingOrders) {
        for (const existing of existingOrders) {
            const name = (existing.order_name || String(existing.order_number)).toLowerCase();
            const shopifyMatch = shopifyByNameMap.get(name) || shopifyByNameMap.get('#' + name);
            
            // If it's a warehouse-made record in DB but we now have a Shopify record for it
            if (existing.id.startsWith('WH-') && shopifyMatch) {
                console.log(`- Duplicate found: ${existing.id} (${existing.order_name}) matched to Shopify ${shopifyMatch.id}. Queueing deletion.`);
                idsToDelete.push(existing.id);
            }
            
            // Also if it's not WH- but doesn't have a shopify_id and we have a shopify version
            if (!existing.id.startsWith('WH-') && !existing.shopify_id && shopifyMatch && existing.id !== String(shopifyMatch.id)) {
                 console.log(`- Extra record found: ${existing.id} matched to better Shopify ${shopifyMatch.id}. Queueing deletion.`);
                 idsToDelete.push(existing.id);
            }
        }
    }

    console.log(`\n📋 Execution Plan:`);
    console.log(`- Upsert into 'orders': ${orderUpserts.length}`);
    console.log(`- Upsert into 'warehouse_orders' cache: ${warehouseCacheUpserts.length}`);
    console.log(`- Delete duplicates from 'orders': ${idsToDelete.length}`);

    if (dryRun) {
        console.log(`\n✅ DRY RUN complete. No changes made. Run with --live to execute.`);
        return;
    }

    // 5. Execute with batching
    console.log(`\n💾 Executing changes...`);
    
    // Batch upserts for orders
    for (let i = 0; i < orderUpserts.length; i += 100) {
        const batch = orderUpserts.slice(i, i + 100);
        const { error } = await supabase.from('orders').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`Error in orders batch ${i}:`, error.message);
    }

    // Batch upserts for warehouse cache
    for (let i = 0; i < warehouseCacheUpserts.length; i += 100) {
        const batch = warehouseCacheUpserts.slice(i, i + 100);
        const { error } = await supabase.from('warehouse_orders').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`Error in cache batch ${i}:`, error.message);
    }

    // Batch deletions
    if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 100) {
            const batch = idsToDelete.slice(i, i + 100);
            const { error } = await supabase.from('orders').delete().in('id', batch);
            if (error) console.error(`Error in deletion batch ${i}:`, error.message);
        }
    }

    console.log(`\n✨ Done! Database is clean.`);
}

const live = process.argv.includes('--live');
cleanupOrders(live).catch(console.error);

