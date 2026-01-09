const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function debugBackers() {
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

  const testEmails = [
    'oransh10@gmail.com',
    'oransh@gmail.com',
    'constantine.goldrin@gmail.com',
    'Matthew@MuchPresents.com',
    'saragazith@gmail.com'
  ];

  console.log('Searching for "oransh" anywhere in comprehensive view:');
  const { data: anyOransh, error: anyError } = await supabase
    .from('collector_profile_comprehensive')
    .select('user_email, display_name, is_kickstarter_backer')
    .or('user_email.ilike.%oransh%,display_name.ilike.%oransh%');

  console.log('Results:', anyOransh);
}

debugBackers().catch(console.error);

