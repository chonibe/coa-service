const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applyMigration() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    }

    console.log('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118000000_vendor_messages.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying vendor messages migration...');
    console.log('This will create:');
    console.log('  - vendor_messages table');
    console.log('  - vendor_notifications table');
    console.log('  - vendor_notification_preferences table');
    console.log('  - Indexes and RLS policies');
    console.log('');

    // Split SQL into statements and execute each one
    // Remove comments and split by semicolons, but keep CREATE POLICY statements together
    const statements = migrationSQL
      .split(/;(?=\s*(?:CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT))/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\s*--/));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement || statement.startsWith('--')) continue;

      // Add semicolon if not present
      const sql = statement.endsWith(';') ? statement : statement + ';';

      try {
        // Try using RPC exec_sql if available
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (rpcError) {
          // If RPC doesn't work, we need to use direct database connection
          // For now, log the error and continue
          console.warn(`Statement ${i + 1} via RPC failed: ${rpcError.message}`);
          console.warn('Note: Some statements may need to be run directly via Supabase Dashboard SQL Editor');
          errorCount++;
        } else {
          successCount++;
          console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
        }
      } catch (err) {
        console.warn(`Statement ${i + 1} error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('');
    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
      console.log(`   Applied ${successCount} statements`);
    } else {
      console.log(`⚠️  Migration partially completed`);
      console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
      console.log('');
      console.log('Some statements may need to be run manually via Supabase Dashboard SQL Editor.');
      console.log('Go to: https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid/sql/new');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Please run the migration manually via Supabase Dashboard:');
    console.error('1. Go to: https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid/sql/new');
    console.error('2. Copy contents of: supabase/migrations/20251118000000_vendor_messages.sql');
    console.error('3. Paste and run');
    process.exit(1);
  }
}

applyMigration();

