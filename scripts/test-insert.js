const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function testInsert() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('Testing insert into order_line_items_v2...');
  
  const { data, error } = await supabase
    .from('order_line_items_v2')
    .insert({
      line_item_id: 'test-pii-debug',
      order_id: 'WH-S849326408681762817',
      name: 'Debug Product',
      status: 'active'
    })
    .select();
    
  if (error) {
    console.error('❌ Insert Error:', error.message, error);
  } else {
    console.log('✅ Insert Success:', data);
  }
}

testInsert();

