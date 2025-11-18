const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
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

    console.log('Running migration: 20251118000000_vendor_messages.sql');
    console.log('This will create:');
    console.log('  - vendor_messages table');
    console.log('  - vendor_notifications table');
    console.log('  - vendor_notification_preferences table');
    console.log('  - Indexes and RLS policies');
    console.log('');

    // Split the SQL into individual statements
    // Remove comments and split by semicolons
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      try {
        // Use RPC if exec_sql exists, otherwise use direct query
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' }).catch(async () => {
          // If exec_sql doesn't work, try using the REST API's query endpoint
          // For now, we'll use a workaround: execute via raw SQL connection
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          // Note: Supabase JS client doesn't support raw SQL execution directly
          // We need to use the Postgres connection or Supabase CLI
          return { error: new Error('Direct SQL execution not supported via JS client') };
        });

        if (error) {
          // If exec_sql RPC fails, we'll need to use a different approach
          console.warn(`Warning: Could not execute via RPC, trying alternative method...`);
          console.warn(`Error: ${error.message}`);
          
          // For CREATE TABLE, CREATE INDEX, ALTER TABLE, CREATE POLICY, CREATE FUNCTION, CREATE TRIGGER
          // We can try to execute via the Supabase REST API or use psql
          throw new Error('Migration requires direct database access. Please use Supabase CLI or run via psql.');
        }
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err.message);
        throw err;
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Created tables:');
    console.log('  ✓ vendor_messages');
    console.log('  ✓ vendor_notifications');
    console.log('  ✓ vendor_notification_preferences');
    console.log('');
    console.log('You can now use the messages and notifications features in the vendor portal.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('To run this migration manually:');
    console.error('1. Use Supabase CLI: supabase db push');
    console.error('2. Or run the SQL directly in Supabase Dashboard > SQL Editor');
    console.error('3. Or use psql with your database connection string');
    process.exit(1);
  }
}

runMigration();

