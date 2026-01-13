const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function verify() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);
  const email = 'beigelbills@gmail.com';
  
  const { data: profile } = await supabase.from('collector_profiles').select('*').eq('email', email).maybeSingle();
  const { data: items } = await supabase.from('order_line_items_v2').select('*').eq('owner_email', email);
  
  console.log('--- Verification Result ---');
  console.log('Profile:', profile ? 'FOUND' : 'NOT FOUND');
  if (profile) {
    console.log(`Name: ${profile.first_name} ${profile.last_name}`);
  }
  console.log('Items in collection:', items ? items.length : 0);
  if (items) {
    items.forEach(item => {
      console.log(`- ${item.name} | Edition: #${item.edition_number} | NFC: ${item.nfc_tag_id} | Authenticated: ${item.nfc_claimed_at ? 'YES' : 'NO'}`);
    });
  }
}

verify();
