const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);

  console.log('Checking owner data in line items...');
  const { data, error } = await s.from('order_line_items_v2')
    .select('owner_id, owner_email, customer_id, name')
    .not('owner_email', 'is', null)
    .limit(10);

  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}

run();


