const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function checkColumns() {
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

  const { data, error } = await supabase.from('collector_profile_comprehensive').select('*').limit(1);

  if (error) {
    console.error('Error fetching data:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in collector_profile_comprehensive:', Object.keys(data[0]));
  } else {
    console.log('No data found in view.');
  }

  const { data: orderData, error: orderError } = await supabase.from('orders').select('*').limit(1);
  if (orderError) {
    console.error('Error fetching orders:', orderError);
  } else if (orderData && orderData.length > 0) {
    console.log('Columns in orders:', Object.keys(orderData[0]));
  }
}

checkColumns().catch(console.error);

