/**
 * Run vendor messages migration via Supabase REST API
 * This script uses the service role key to execute SQL directly
 */

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

async function runMigration() {
  try {
    console.log('📦 Loading migration file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118000000_vendor_messages.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔗 Connecting to Supabase...');
    console.log('   URL:', SUPABASE_URL);
    
    // Use Supabase REST API to execute SQL
    // Note: Supabase doesn't have a direct SQL execution endpoint via REST API
    // We need to use the Postgres connection or Management API
    
    console.log('');
    console.log('⚠️  Supabase REST API does not support direct SQL execution.');
    console.log('');
    console.log('✅ Migration file is ready at:');
    console.log('   ', migrationPath);
    console.log('');
    console.log('📋 To apply this migration, use one of these methods:');
    console.log('');
    console.log('1. Supabase Dashboard (Recommended):');
    console.log('   → Go to: https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid/sql/new');
    console.log('   → Copy the contents of the migration file');
    console.log('   → Paste into SQL Editor');
    console.log('   → Click "Run"');
    console.log('');
    console.log('2. psql (if you have database connection string):');
    console.log('   → Get connection string from Supabase Dashboard > Settings > Database');
    console.log('   → Run: psql "YOUR_CONNECTION_STRING" -f', migrationPath);
    console.log('');
    console.log('3. Supabase CLI (after fixing connection):');
    console.log('   → Run: supabase db push --include-all');
    console.log('');
    console.log('📄 Migration SQL Preview (first 30 lines):');
    console.log('─'.repeat(60));
    console.log(migrationSQL.split('\n').slice(0, 30).join('\n'));
    console.log('─'.repeat(60));
    console.log('   ... (', migrationSQL.split('\n').length, 'total lines)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();

