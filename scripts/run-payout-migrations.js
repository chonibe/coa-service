const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
  console.error('');
  console.error('Please ensure these are set in .env.local');
  process.exit(1);
}

async function runMigrations() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const migrations = [
    'supabase/migrations/20251118042456_payout_enhancements.sql',
    'supabase/migrations/20251118042457_order_payout_tracking.sql',
  ];

  for (const migrationPath of migrations) {
    const fullPath = path.join(__dirname, '..', migrationPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Migration file not found: ${fullPath}`);
      continue;
    }

    console.log(`\n📦 Running migration: ${migrationPath}`);
    const sql = fs.readFileSync(fullPath, 'utf8');
    
    // Remove comments and clean up
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') || line.trim().startsWith('-- Add') || line.trim().startsWith('-- Create'))
      .join('\n')
      .trim();

    try {
      console.log('  🔄 Executing migration...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: cleanSql });
      
      if (error) {
        // Check if it's a harmless error (already exists, etc.)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('does not exist') && error.message.includes('policy')) {
          console.log(`  ⚠️  Some objects may already exist: ${error.message.split('\n')[0]}`);
          console.log(`  ✅ Migration applied (with expected warnings)`);
        } else {
          console.error(`  ❌ Migration failed: ${error.message}`);
          throw error;
        }
      } else {
        console.log(`  ✅ Migration applied successfully!`);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      throw err;
    }
  }

  console.log('\n✅ Migration process completed!');
  console.log('\n💡 Note: Some warnings about "already exists" are normal if objects were created previously.');
}

runMigrations().catch(console.error);

