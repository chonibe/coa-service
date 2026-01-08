const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function verify() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Verifying Data Enrichment for Manual Orders ---');
  
  const emails = ['sfabercastell@live.com', 'crash@jaredleto.com', 'amy@changmcdonough.com'];
  
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('display_name, user_email, total_orders, total_editions')
    .in('user_email', emails);
    
  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}

verify();

