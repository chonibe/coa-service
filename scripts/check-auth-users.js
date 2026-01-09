const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkAuthUsers() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('Checking auth.users via a direct select (if allowed by service role)...');
  // Note: auth schema is sometimes protected, but service role should see it.
  const { data, error } = await supabase
    .from('users') // This might be public.users or auth.users depending on setup
    .select('email')
    .ilike('email', '%bittmann%');

  if (error) {
     // Fallback: search for bittmann in all profiles and check if they have a user_id
     console.log('Could not select from users directly. Checking collector_profiles with user_id...');
     const { data: profiles, error: pErr } = await supabase
       .from('collector_profiles')
       .select('email, user_id')
       .not('user_id', 'is', null)
       .ilike('email', '%bittmann%');
     
     if (pErr) console.error(pErr);
     else {
       console.log(`Found ${profiles.length} profiles with user_id:`);
       profiles.forEach(p => console.log(`- Email: ${p.email}, UserID: ${p.user_id}`));
     }
  } else {
    console.log(`Found ${data.length} users:`);
    data.forEach(d => console.log(`- ${d.email}`));
  }
}

checkAuthUsers();

