const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function removeTestData() {
  const { error } = await supabase
    .from('order_line_items_v2')
    .delete()
    .eq('product_id', '8684737560803');

  if (error) {
    console.error('Error removing test data:', error);
  } else {
    console.log('Test data removed successfully');
  }
}

removeTestData(); 