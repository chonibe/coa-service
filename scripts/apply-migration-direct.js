const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function apply() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Adding columns to orders table...');
  const sql = `
    ALTER TABLE "public"."orders" 
    ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
    ADD COLUMN IF NOT EXISTS "customer_phone" TEXT,
    ADD COLUMN IF NOT EXISTS "shipping_address" JSONB;
  `;
  
  const { error: alterError } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (alterError) {
    console.error('Error adding columns:', alterError);
    return;
  }
  console.log('Columns added successfully.');

  console.log('Fetching orders to backfill contact info...');
  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('id, raw_shopify_order_data')
    .not('raw_shopify_order_data', 'is', null);

  if (fetchError) {
    console.error('Error fetching orders:', fetchError);
    return;
  }

  console.log(`Processing ${orders.length} orders...`);
  let updatedCount = 0;

  for (const order of orders) {
    const raw = order.raw_shopify_order_data;
    if (!raw) continue;

    const name = [
      raw.customer?.first_name,
      raw.customer?.last_name
    ].filter(Boolean).join(' ') || [
      raw.shipping_address?.first_name,
      raw.shipping_address?.last_name
    ].filter(Boolean).join(' ') || [
      raw.billing_address?.first_name,
      raw.billing_address?.last_name
    ].filter(Boolean).join(' ') || null;

    const phone = raw.customer?.phone || raw.shipping_address?.phone || raw.billing_address?.phone || null;
    const address = raw.shipping_address || null;

    if (name || phone || address) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          customer_name: name,
          customer_phone: phone,
          shipping_address: address
        })
        .eq('id', order.id);

      if (!updateError) updatedCount++;
    }
  }

  console.log(`Successfully backfilled ${updatedCount} orders.`);
}

apply();
