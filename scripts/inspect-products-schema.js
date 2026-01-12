const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function inspect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(JSON.stringify(data[0], null, 2));
}

inspect();

