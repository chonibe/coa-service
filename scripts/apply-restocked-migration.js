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

    console.log('🔗 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250119000000_add_restocked_to_order_line_items_v2.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying migration: add_restocked_to_order_line_items_v2.sql');
    console.log('This will:');
    console.log('  - Add "restocked" boolean column to order_line_items_v2');
    console.log('  - Create index on restocked column');
    console.log('  - Add column comment');
    console.log('');

    // Split SQL into statements and execute each one
    // Handle CREATE INDEX IF NOT EXISTS and other statements properly
    const statements = migrationSQL
      .split(/;(?=\s*(?:ALTER|CREATE|COMMENT))/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\s*--/));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the Supabase REST API with rpc call
        // Try using exec_sql if available, otherwise use direct SQL execution via PostgREST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        } else {
          const errorText = await response.text();
          // If exec_sql doesn't exist, we need to use a different approach
          if (response.status === 404 || errorText.includes('exec_sql')) {
            console.log('⚠️  exec_sql RPC not available. Using alternative method...');
            
            // For DDL operations, we need to use the Management API or direct connection
            // Since we can't execute DDL via REST API easily, we'll provide instructions
            console.log('');
            console.log('📋 To apply this migration, please use one of these methods:');
            console.log('');
            console.log('1. Supabase Dashboard (Recommended):');
            const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
            if (projectRef) {
              console.log(`   → Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
            } else {
              console.log(`   → Go to: ${supabaseUrl.replace('.supabase.co', '.supabase.com/dashboard/project/').replace('https://', 'https://app.')}/sql/new`);
            }
            console.log('   → Copy and paste the SQL below');
            console.log('   → Click "Run"');
            console.log('');
            console.log('2. Or run this SQL directly:');
            console.log('─'.repeat(60));
            console.log(migrationSQL);
            console.log('─'.repeat(60));
            return;
          } else {
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    if (errorCount === 0 && successCount > 0) {
      console.log('');
      console.log(`✅ Migration applied successfully! (${successCount} statements)`);
    } else if (errorCount > 0) {
      console.log('');
      console.log(`⚠️  Migration completed with ${errorCount} errors (${successCount} successful)`);
    }
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('');
    console.log('📋 Please apply the migration manually in Supabase Dashboard:');
    console.log('─'.repeat(60));
    const migrationSQL = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20250119000000_add_restocked_to_order_line_items_v2.sql'), 'utf8');
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    process.exit(1);
  }
}

applyMigration();
