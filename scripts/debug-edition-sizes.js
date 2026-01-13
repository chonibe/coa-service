const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkEditionSizes() {
  const { data, error } = await supabase
    .from('products')
    .select('name, edition_size, product_id')
    .eq('edition_size', '90')
    .limit(50);
    
  if (error) return console.error(error);
  console.log('Products with edition_size = 90 in DB:');
  data.forEach(p => console.log(`${p.name} (${p.product_id}): ${p.edition_size}`));
}
checkEditionSizes();
