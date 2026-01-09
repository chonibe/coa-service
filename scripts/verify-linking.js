const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function verifyLinking() {
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

  const checks = [
    { order: '#1258', email: 'oransh10@gmail.com' },
    { order: '#1102', email: 'baumyitzy@gmail.com' },
    { order: '#1206', email: 'birgit-alvarez@gmx.de' },
    { order: '#1174', email: 'ziv_gilinski@yahoo.com' }
  ];

  for (const check of checks) {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, is_kickstarter_backer:customer_email')
      .eq('order_name', check.order)
      .maybeSingle();
    
    const { data: profile } = await supabase
      .from('collector_profile_comprehensive')
      .select('is_kickstarter_backer')
      .ilike('user_email', check.email)
      .maybeSingle();

    console.log(`Order ${check.order}: email=${order?.customer_email}, backer_flag=${profile?.is_kickstarter_backer}`);
  }
}

verifyLinking().catch(console.error);

