const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVendorUsersTable() {
  try {
    console.log('🔍 Checking vendor_users table...');

    // First, check if the table exists and get its structure
    const { data: tableData, error: tableError } = await supabase
      .from('vendor_users')
      .select('*')
      .limit(10);

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('❌ vendor_users table does not exist');
        return;
      }
      throw tableError;
    }

    console.log('✅ vendor_users table exists');
    console.log('📊 Sample records:', tableData?.length || 0);

    if (tableData && tableData.length > 0) {
      console.log('\n📋 Table structure (based on first record):');
      const firstRecord = tableData[0];
      Object.keys(firstRecord).forEach(key => {
        const value = firstRecord[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`   ${key}: ${type} ${value !== null ? '(not null)' : '(null)'}`);
      });

      console.log('\n📄 First few records:');
      tableData.slice(0, 3).forEach((record, index) => {
        console.log(`   Record ${index + 1}:`, JSON.stringify(record, null, 2));
      });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('vendor_users')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📈 Total records: ${count}`);
    }

  } catch (err) {
    console.error('❌ Error checking vendor_users table:', err.message);
  }
}

checkVendorUsersTable();



