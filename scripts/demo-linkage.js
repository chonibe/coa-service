const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function demo() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) || 
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);

  const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

  const orderId = "12182601859458";
  const productId = "8693340209379";
  const testEmail = "collector-demo@example.com";

  console.log('--- STARTING REAL DEMO ---');

  // 1. Simulate Warehouse PII Sync (Setting email on order)
  console.log(`1. Simulating Warehouse sync: Setting email ${testEmail} on Order #1279...`);
  await supabase.from('orders').update({ customer_email: testEmail }).eq('id', orderId);

  // 2. Trigger Edition Assignment (This is what happens automatically now)
  console.log(`2. Triggering automatic edition assignment/backfill for Product ID ${productId}...`);
  const { data: count, error: rpcError } = await supabase.rpc('assign_edition_numbers', { p_product_id: productId });
  
  if (rpcError) {
    console.error('RPC Error:', rpcError);
    return;
  }

  // 3. Verify the Results
  console.log('3. Verifying the results in order_line_items_v2:');
  const { data: items } = await supabase
    .from('order_line_items_v2')
    .select('name, edition_number, owner_email')
    .eq('order_id', orderId);
  console.log(JSON.stringify(items, null, 2));

  // 4. Check the Immutable Ledger
  console.log('\n4. Checking the Immutable Ledger (edition_events):');
  const { data: events } = await supabase
    .from('edition_events')
    .select('event_type, owner_email, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1);
  console.log(JSON.stringify(events, null, 2));
}

demo();

