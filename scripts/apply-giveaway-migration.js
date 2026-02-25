/**
 * Apply giveaway_entries migration manually
 * This script reads the migration SQL and applies it to the remote Supabase database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      console.error('Please ensure these environment variables are set in .env.local');
      process.exit(1);
    }

    console.log('🔗 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260208000000_create_giveaway_entries.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📄 Migration file loaded');

    // Apply migration using RPC
    console.log('⏳ Applying migration...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: migrationSQL
    }).catch(() => {
      // If RPC doesn't exist, we need to use a different approach
      // For now, we'll just inform the user
      throw new Error('Database RPC execution not available. Please apply migration manually in Supabase dashboard.');
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('🎉 Giveaway entries table is now ready to use');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📋 To apply the migration manually:');
    console.error('1. Go to https://app.supabase.com');
    console.error('2. Select project: ldmppmnpgdxueebkkpid');
    console.error('3. Go to SQL Editor');
    console.error('4. Copy and paste the contents of: supabase/migrations/20260208000000_create_giveaway_entries.sql');
    console.error('5. Click "Run"');
    process.exit(1);
  }
}

applyMigration();
