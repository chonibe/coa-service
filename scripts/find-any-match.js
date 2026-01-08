const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findMatch() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Searching for enriched collector examples (DisplayName != Email)...');
  
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .gt('total_orders', 0)
    .neq('user_email', 'chonibe@gmail.com')
    .limit(100);
    
  if (error) {
    console.error('Error:', error);
    return;
  }

  const enriched = data.filter(d => d.display_name && d.display_name.toLowerCase() !== d.user_email.toLowerCase());
  
  console.log(`Found ${enriched.length} enriched matches.`);
  
  if (enriched.length > 0) {
    const example = enriched[0];
    console.log('\n--- Enriched Collector Instance ---');
    console.log(`Email: ${example.user_email}`);
    console.log(`Resolved Display Name: ${example.display_name}`);
    console.log(`Total Orders: ${example.total_orders}`);
    console.log('\nPII Sources (Raw):');
    console.log(JSON.stringify(example.pii_sources, null, 2));
  } else {
    console.log('No enriched examples found where display_name != user_email.');
  }
}

findMatch();
