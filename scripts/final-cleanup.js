const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function finalCleanup() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Final cleanup: Converting literal "null" strings to actual NULL in orders table...');
  
  const { error: err1 } = await supabase
    .from('orders')
    .update({ customer_email: null })
    .eq('customer_email', 'null');

  const { error: err2 } = await supabase
    .from('orders')
    .update({ customer_name: 'Guest Collector' })
    .eq('customer_name', 'null');

  if (err1) console.error('Error cleaning emails:', err1.message);
  if (err2) console.error('Error cleaning names:', err2.message);

  console.log('Cleanup complete.');
}

finalCleanup();

