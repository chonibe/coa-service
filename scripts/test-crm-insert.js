const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function testInsert() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const { error } = await supabase.from('crm_customers').insert({
    id: 'test-id',
    email: 'test@example.com'
  });
  
  console.log({ error });
}

testInsert();

