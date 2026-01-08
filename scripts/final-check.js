const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function finalCheck() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { data: items } = await supabase.from('order_line_items_v2').select('*').ilike('owner_email', 'sfabercastell@live.com');
  console.log('Sarah Items in DB:', items.length);
  if (items.length > 0) {
    console.log('First Item owner_email:', items[0].owner_email);
    console.log('First Item status:', items[0].status);
    console.log('First Item owner_id:', items[0].owner_id);
  }

  const { data: view } = await supabase.from('collector_profile_comprehensive').select('user_email').eq('user_email', 'sfabercastell@live.com').maybeSingle();
  console.log('Sarah Email in View:', view?.user_email);
}

finalCheck();

