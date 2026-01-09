const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

async function reconcileWithShopifyExport() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const csvPath = 'c:\\Users\\choni\\Downloads\\orders_export_1 (13).csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Loaded ${records.length} line item records from CSV.`);

  // Group records by Order ID (some orders have multiple lines for line items)
  const shopifyOrders = new Map();
  for (const record of records) {
    const id = record['Id'];
    if (!id) continue;
    
    if (!shopifyOrders.has(id)) {
      shopifyOrders.set(id, {
        id: id,
        name: record['Name'],
        financial_status: record['Financial Status'],
        cancelled_at: record['Cancelled at'] || null,
        email: record['Email']
      });
    }
  }

  console.log(`Found ${shopifyOrders.size} unique orders in Shopify export.`);

  // Fetch all orders from our database
  const { data: dbOrders, error } = await supabase
    .from('orders')
    .select('id, order_name, financial_status, cancelled_at, source');

  if (error) {
    console.error('Error fetching DB orders:', error);
    return;
  }

  const dbOrderMap = new Map(dbOrders.map(o => [o.id, o]));
  const discrepancies = [];
  const missingInDb = [];

  for (const [id, sOrder] of shopifyOrders) {
    const dbOrder = dbOrderMap.get(id);
    
    if (!dbOrder) {
      missingInDb.push({ id, name: sOrder.name, email: sOrder.email });
      continue;
    }

    const sVoided = sOrder.financial_status === 'voided' || !!sOrder.cancelled_at;
    const dbVoided = dbOrder.financial_status === 'voided' || !!dbOrder.cancelled_at;

    if (sVoided !== dbVoided) {
      discrepancies.push({
        id,
        name: sOrder.name,
        type: 'void_status_mismatch',
        shopify: { status: sOrder.financial_status, cancelled_at: sOrder.cancelled_at },
        db: { status: dbOrder.financial_status, cancelled_at: dbOrder.cancelled_at },
        source: dbOrder.source
      });
    }
  }

  console.log(`\n--- Reconciliation Summary ---`);
  console.log(`Total DB orders checked: ${dbOrders.length}`);
  console.log(`Inconsistent "Voided" status found: ${discrepancies.length}`);
  console.log(`Shopify orders missing from DB: ${missingInDb.length}`);

  if (missingInDb.length > 0) {
    console.log(`\nTop 10 missing orders:`);
    console.table(missingInDb.slice(0, 10));
  }

  if (discrepancies.length > 0) {
    console.log(`\nTop 20 discrepancies:`);
    console.table(discrepancies.slice(0, 20).map(d => ({
      Order: d.name,
      'Shopify Status': d.shopify.status,
      'DB Status': d.db.status,
      'Shopify Cancelled': d.shopify.cancelled_at ? 'Yes' : 'No',
      'DB Cancelled': d.db.cancelled_at ? 'Yes' : 'No',
      'Source': d.source
    })));

    // Ask if user wants to fix them
    console.log(`\nFound discrepancies. Would you like me to sync these specific orders using the Shopify API?`);
  } else {
    console.log(`\nAll orders checked match Shopify's voided/cancelled status.`);
  }
}

reconcileWithShopifyExport();

