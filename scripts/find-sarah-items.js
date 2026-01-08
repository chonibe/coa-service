const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findSarahItems() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data } = await supabase.from('order_line_items_v2').select('*').eq('order_id', 'WH-S849326408681762817');
  console.log('Sarah Items:', data);
}

findSarahItems();

