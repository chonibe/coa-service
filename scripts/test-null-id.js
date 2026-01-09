const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testNullUserId() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Testing NULL user_id in collector_profiles ---');
  const { error } = await supabase
    .from('collector_profiles')
    .insert({ 
      email: 'test-null-id@example.com', 
      first_name: 'Test', 
      user_id: null 
    });
  
  if (error) {
    console.error('Insert Error:', error.message);
    if (error.message.includes('null value in column "user_id"')) {
        console.log('Result: user_id CANNOT be NULL.');
    } else {
        console.log('Other Error:', error);
    }
  } else {
    console.log('Result: Success! user_id CAN be NULL.');
    // Cleanup
    await supabase.from('collector_profiles').delete().eq('email', 'test-null-id@example.com');
  }
}

testNullUserId();

