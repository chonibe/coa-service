const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkRonyEditions() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'itzcovich.rony@gmail.com';
  console.log(`Checking editions for ${email}...`);

  const { data: items } = await supabase.from('order_line_items_v2').select('id, order_id, order_name, owner_email').ilike('owner_email', email);
  console.log('Editions:', items);
}

checkRonyEditions();

