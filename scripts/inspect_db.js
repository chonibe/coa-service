
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function inspectData() {
  console.log('--- Inspecting products table columns and sample data ---');
  const { data: pSample, error: pError } = await supabase.from('products').select('*').limit(3);
  if (pError) console.error('Error fetching products:', pError);
  else {
    console.log('Available columns in products:', Object.keys(pSample[0] || {}));
    console.log('Sample products:', JSON.stringify(pSample, null, 2));
  }

  console.log('\n--- Inspecting order_line_items_v2 table columns and sample data ---');
  const { data: lSample, error: lError } = await supabase.from('order_line_items_v2').select('*').limit(3);
  if (lError) console.error('Error fetching line items:', lError);
  else {
    console.log('Available columns in order_line_items_v2:', Object.keys(lSample[0] || {}));
    console.log('Sample line items:', JSON.stringify(lSample, null, 2));
  }

  console.log('\n--- Checking for image population ---');
  const { count: pWithImg } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('img_url', 'is', null);
  const { count: pWithImage } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('image_url', 'is', null);
  const { count: lWithImg } = await supabase.from('order_line_items_v2').select('*', { count: 'exact', head: true }).not('img_url', 'is', null);

  console.log(`Products with img_url: ${pWithImg}`);
  console.log(`Products with image_url: ${pWithImage}`);
  console.log(`Line items with img_url: ${lWithImg}`);
}

inspectData();

