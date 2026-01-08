const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkManual() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Checking for ANY line items from manual ingestion ---');
  
  const { data, error } = await supabase
    .from('order_line_items_v2')
    .select('*')
    .ilike('line_item_id', 'WH-ITEM-%')
    .limit(5);
    
  if (error) console.error(error);
  else console.table(data);
}

checkManual();

