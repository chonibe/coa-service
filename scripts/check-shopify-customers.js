const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkShopifyCustomers() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { count, error } = await supabase.from('shopify_customers').select('*', { count: 'exact', head: true });
  console.log({ shopify_customers_count: count, error: error?.message });

  const { count: crm_count } = await supabase.from('crm_customers').select('*', { count: 'exact', head: true });
  console.log({ crm_customers_count: crm_count });
}

checkShopifyCustomers();

