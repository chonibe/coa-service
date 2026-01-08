const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function verifyEnrichment() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Verifying Enrichment in Comprehensive View ---');
  
  // Query for orders that were recently enriched (emails we saw in the log)
  const sampleEmails = ['birgit-alvarez@gmx.de', 'ohazony@gmail.com', 'kalmus@me.com'];
  
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, total_orders, pii_sources')
    .in('user_email', sampleEmails);
    
  if (error) {
    console.error('Error querying view:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No data found for sample enriched emails in the view.');
    return;
  }
  
  console.log(`Found ${data.length} matches in the comprehensive view.`);
  data.forEach(example => {
    console.log(`\nEmail: ${example.user_email}`);
    console.log(`Display Name: ${example.display_name}`);
    console.log(`Total Orders: ${example.total_orders}`);
    console.log('Warehouse Data Linked:', example.pii_sources.warehouse ? '✅ Yes' : '❌ No');
  });
}

verifyEnrichment();

