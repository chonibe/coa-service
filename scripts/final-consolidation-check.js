const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function finalConsolidationCheck() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const testEmails = [
    'bittmannroma@gmail.com', // Philip Bittmann
    'chonibe@gmail.com',      // Choni Beigel
    'mayaizart@gmail.com'     // Maya Ness
  ];

  console.log('🔍 Checking final consolidation in view...');
  for (const email of testEmails) {
    const { data, error } = await supabase
      .from('collector_profile_comprehensive')
      .select('user_email, display_name, total_orders, total_editions')
      .eq('user_email', email)
      .maybeSingle();

    if (error) {
      console.error(`  ❌ Error checking ${email}:`, error.message);
    } else if (data) {
      console.log(`  ✅ ${email} -> Name: "${data.display_name}", Orders: ${data.total_orders}, Editions: ${data.total_editions}`);
    } else {
      console.log(`  ⚠️ NOT FOUND: ${email}`);
    }
  }
}

finalConsolidationCheck();

