const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkBatch() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('--- Batch Verification of Collector Pairing ---');
  
  const emails = [
    'sfabercastell@live.com', 'mayan702@hotmail.com', 'infovansdesign@gmail.com', 
    'sigaltraining@gmail.com', 'kmarsh@musicnotes.com', 'amy@changmcdonough.com',
    'asachs@wsgr.com', 'lilengel24@gmail.com', 'avraham.kalvo@gmail.com',
    'info.lidiacao@gmail.com', 'ittaia@gmail.com', 'crash@jaredleto.com',
    'labrousse.sophie@gmail.com', 'stathikougianos@gmail.com', 'jeroenvanparreren@icloud.com'
  ];
  
  const { data, error } = await supabase
    .from('collector_profile_comprehensive')
    .select('display_name, user_email, total_orders, total_editions')
    .in('user_email', emails);
    
  if (error) {
    console.error(error);
  } else {
    console.table(data);
    const zeroOrders = data.filter(d => d.total_orders === 0);
    console.log(`\nVerified ${data.length} collectors.`);
    console.log(`Remaining with 0 orders: ${zeroOrders.length}`);
  }
}

checkBatch();

