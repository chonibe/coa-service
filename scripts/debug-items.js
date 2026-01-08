const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function debugItems() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Debugging Line Items for Sarah ---');
  
  const { data, error } = await supabase
    .from('order_line_items_v2')
    .select('*')
    .eq('owner_email', 'sfabercastell@live.com');
    
  if (error) console.error(error);
  else {
    console.log(`Found ${data.length} items`);
    console.log(JSON.stringify(data[0], null, 2));
  }
}

debugItems();

