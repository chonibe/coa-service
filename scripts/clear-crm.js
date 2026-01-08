const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function clearCRM() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('🧹 Clearing crm_customers table...');
  const { error } = await supabase.from('crm_customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    console.error('❌ Error clearing CRM:', error);
  } else {
    console.log('✅ CRM table cleared.');
  }
}

clearCRM();

