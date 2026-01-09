const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkOrdersSource() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Orders Source Distribution ---');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('source');
  
  if (error) {
    console.error(error);
    return;
  }

  const distribution = orders.reduce((acc, o) => {
    const s = o.source || 'null';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify(distribution, null, 2));
}

checkOrdersSource();

