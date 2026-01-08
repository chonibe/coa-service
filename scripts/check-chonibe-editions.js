const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);

  const userId = 'b2f58223-0131-4d53-9aa8-c003e1955033';

  console.log('Checking editions for chonibe@gmail.com...\n');

  const { data, error } = await s
    .from('order_line_items_v2')
    .select('*')
    .eq('owner_id', userId);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data?.length || 0} editions`);
    if (data && data.length > 0) {
      data.forEach(item => {
        console.log(`- ${item.name}: Edition ${item.edition_number} (${item.owner_email})`);
      });
    }
  }

  // Also check by email
  console.log('\nChecking by email...');
  const { data: emailData, error: emailError } = await s
    .from('order_line_items_v2')
    .select('*')
    .eq('owner_email', 'chonibe@gmail.com');

  if (emailError) {
    console.error('Email error:', emailError);
  } else {
    console.log(`Found ${emailData?.length || 0} editions by email`);
  }
}

run();

