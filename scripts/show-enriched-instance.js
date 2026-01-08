const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function findExample() {
  const envContent = fs.readFileSync('.env', 'utf8');
  
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  
  const supabase = createClient(url, key);
  
  console.log('Searching for enriched collector examples (Filtering in JS)...');
  
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .gt('total_orders', 0)
    .limit(100);
    
  if (error) {
    console.error('Error querying view:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No data found.');
    return;
  }
  
  // Find an instance where we have warehouse data
  const enrichedExample = data.find(d => 
    d.pii_sources && d.pii_sources.warehouse && d.user_email !== 'chonibe@gmail.com'
  );
  
  if (!enrichedExample) {
    console.log('No enriched examples with warehouse data found in the first 100 rows.');
    // Let's show any row that has a display name different from email
    const fallback = data.find(d => d.display_name && d.display_name !== d.user_email && d.user_email !== 'chonibe@gmail.com');
    if (fallback) {
      console.log('\n--- Enriched Collector (Fallback Match) ---');
      printInstance(fallback);
    } else {
      console.log('No enriched examples found.');
    }
    return;
  }
  
  console.log('\n--- Enriched Collector Instance ---');
  printInstance(enrichedExample);
}

function printInstance(example) {
  console.log(`Email: ${example.user_email}`);
  console.log(`Resolved Display Name: ${example.display_name}`);
  console.log(`Total Orders: ${example.total_orders}`);
  console.log('\nPII Sources (Enriched):');
  console.log(JSON.stringify(example.pii_sources, null, 2));
}

findExample();
