const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function debugOransh() {
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

  console.log('Searching for "oransh@gmail.com" in kickstarter_backers_list...');
  const { data: exactBacker, error: exactError } = await supabase
    .from('kickstarter_backers_list')
    .select('*')
    .eq('email', 'oransh@gmail.com');

  console.log('Exact backer found:', exactBacker);

  console.log('\nSearching for "oransh10@gmail.com" in kickstarter_backers_list...');
  const { data: backer10, error: error10 } = await supabase
    .from('kickstarter_backers_list')
    .select('*')
    .eq('email', 'oransh10@gmail.com');

  console.log('Backer 10 found:', backer10);
}

debugOransh().catch(console.error);

