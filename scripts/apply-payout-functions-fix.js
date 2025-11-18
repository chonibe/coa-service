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
  process.exit(1);
}

async function applyMigration() {
  try {
    console.log('📦 Loading migration file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118190000_fix_count_type_casting.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔗 Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split('$$')
      .map((part, index, array) => {
        if (index % 2 === 0) {
          // Outside of $$ blocks, split by semicolon
          return part.split(';').map(s => s.trim()).filter(s => s.length > 0);
        } else {
          // Inside $$ blocks, keep as is
          return [part];
        }
      })
      .flat()
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // For function definitions, we need to handle them differently
    // Let's split by function boundaries
    const functionMatches = migrationSQL.match(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$ LANGUAGE plpgsql;/g);
    
    if (functionMatches) {
      console.log(`\n📝 Found ${functionMatches.length} function(s) to update\n`);
      
      for (let i = 0; i < functionMatches.length; i++) {
        const funcSQL = functionMatches[i].trim();
        const funcName = funcSQL.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/)?.[1] || 'unknown';
        
        console.log(`   Updating function: ${funcName}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: funcSQL });
          
          if (error) {
            console.error(`   ❌ Error updating ${funcName}:`, error.message);
            throw error;
          } else {
            console.log(`   ✅ Successfully updated ${funcName}`);
          }
        } catch (err) {
          console.error(`   ❌ Failed to update ${funcName}:`, err.message);
          throw err;
        }
      }
      
      console.log('\n✅ Migration completed successfully!');
      console.log('   All functions have been updated with COUNT() type casting fixes.\n');
    } else {
      console.log('⚠️  No function definitions found in migration file');
      console.log('   Attempting to execute as single statement...\n');
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });
      
      if (error) {
        console.error('❌ Error executing migration:', error.message);
        throw error;
      }
      
      console.log('✅ Migration completed successfully!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📋 Alternative: Apply manually via Supabase Dashboard');
    console.error('   1. Go to: https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid/sql/new');
    console.error('   2. Copy contents of: supabase/migrations/20251118190000_fix_count_type_casting.sql');
    console.error('   3. Paste and click "Run"\n');
    process.exit(1);
  }
}

applyMigration();

