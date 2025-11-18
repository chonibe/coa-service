/**
 * Verify that the vendor messages migration tables exist
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function verifyMigration() {
  try {
    console.log('🔍 Verifying vendor messages migration...\n');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const tables = [
      'vendor_messages',
      'vendor_notifications', 
      'vendor_notification_preferences'
    ];

    console.log('Checking tables:\n');
    
    for (const table of tables) {
      try {
        // Try to query the table (this will fail if table doesn't exist)
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === '42P01') {
            console.log(`  ❌ ${table} - Table does NOT exist`);
          } else {
            console.log(`  ⚠️  ${table} - Error: ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${table} - Table exists`);
        }
      } catch (err) {
        console.log(`  ❌ ${table} - Error: ${err.message}`);
      }
    }

    console.log('\n✅ Verification complete!');
    console.log('\nIf all tables show ✅, the migration was successful!');
    console.log('You can now use the messages and notifications features.');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyMigration();

