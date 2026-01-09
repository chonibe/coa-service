const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');

    // Test basic connection
    const { data: customers, error: customersError } = await supabase
      .from('crm_customers')
      .select('id, email, first_name, last_name')
      .limit(5);

    if (customersError) throw customersError;
    console.log('✅ CRM customers table accessible');
    console.log('   Found', customers?.length || 0, 'records');

    // Test vendors table
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, vendor_name')
      .limit(3);

    if (vendorsError) throw vendorsError;
    console.log('✅ Vendors table accessible');
    console.log('   Found', vendors?.length || 0, 'records');

    // Test orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_email')
      .limit(3);

    if (ordersError) throw ordersError;
    console.log('✅ Orders table accessible');
    console.log('   Found', orders?.length || 0, 'records');

    console.log('\n🎉 Database connection successful! All required tables are accessible.');

  } catch (err) {
    console.error('❌ Database test failed:', err.message);
    process.exit(1);
  }
}

testConnection();







