const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const s = createClient(url, key);

  const { data } = await s.from('products').select('id, product_id').limit(3);
  console.log('Products:', data);

  // Let's create a test line item with a proper product_id from existing data
  if (data && data.length > 0) {
    const testOrderId = 'test-chonibe-1736420000000'; // From earlier
    const userId = 'b2f58223-0131-4d53-9aa8-c003e1955033';
    const productId = data[0].product_id; // Use the product_id field (bigint)

    console.log('Creating test line item with product_id:', productId);

    const { error } = await s
      .from('order_line_items_v2')
      .insert({
        line_item_id: `chonibe-test-${Date.now()}`,
        order_id: testOrderId,
        order_name: '#TEST001',
        name: 'Test Artwork - Choni Beigel Collection',
        description: 'Test artwork for Choni Beigel',
        price: 50.00,
        quantity: 1,
        sku: 'TEST001',
        edition_number: null,
        edition_total: null,
        product_id: productId,
        status: 'active',
        owner_email: 'chonibe@gmail.com',
        owner_name: 'Choni Beigel',
        owner_id: userId,
        customer_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✅ Test line item created');

      // Run edition assignment
      const { data: result } = await s.rpc('assign_edition_numbers', {
        p_product_id: productId.toString()
      });
      console.log('Edition assignment result:', result);
    }
  }
}

run();

