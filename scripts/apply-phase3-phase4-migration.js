#!/usr/bin/env node

/**
 * Apply Phase 3 & Phase 4 Combined Migration
 * 
 * This script applies the combined migration file directly to Supabase
 * using the service role key for DDL operations.
 * 
 * Usage:
 *   node scripts/apply-phase3-phase4-migration.js
 * 
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Make sure these are set in your .env.local file');
  process.exit(1);
}

// Create admin client with service role key for DDL operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});

async function applyMigration() {
  try {
    console.log('📄 Reading migration file...');
    const migrationPath = join(process.cwd(), 'supabase/migrations/20251204000009_attio_phase3_phase4_combined.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('🚀 Applying Phase 3 & Phase 4 Combined Migration...');
    console.log('   This includes:');
    console.log('   - Additional Attribute Types');
    console.log('   - Fuzzy Search Support');
    console.log('   - Workspace Permissions');
    console.log('   - Inbox Enhancements (Threading, Tags, Enrichment)');
    console.log('');
    
    // Split SQL into statements (split by semicolon, but preserve function bodies)
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    let functionDepth = 0;
    
    const lines = migrationSQL.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentStatement += line + '\n';
      
      // Track function definition depth
      if (line.match(/\$\$.*LANGUAGE/)) {
        inFunction = true;
        functionDepth = 0;
      }
      
      if (inFunction) {
        // Count $$ markers to know when function ends
        const dollarMatches = line.match(/\$\$/g);
        if (dollarMatches) {
          functionDepth += dollarMatches.length;
          if (functionDepth >= 2) {
            inFunction = false;
            functionDepth = 0;
          }
        }
      }
      
      // End of statement (semicolon outside of function body)
      if (!inFunction && line.trim().endsWith(';') && line.trim() !== ';') {
        const trimmed = currentStatement.trim();
        if (trimmed && !trimmed.startsWith('--')) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty or comment-only statements
      if (!statement || statement.replace(/--.*/g, '').trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Try using RPC exec_sql if available
        const { data, error: rpcError } = await supabase.rpc('exec_sql', {
          query: statement
        });
        
        if (rpcError) {
          // Check if exec_sql function exists, if not we need to use direct connection
          if (rpcError.message.includes('function exec_sql') || rpcError.message.includes('does not exist')) {
            console.warn(`⚠️  exec_sql RPC not available. Some statements may need manual execution.`);
            console.warn(`   Statement ${i + 1} skipped (requires direct database connection)`);
            errorCount++;
            errors.push({
              statement: i + 1,
              error: 'exec_sql RPC not available - requires direct database connection',
              sql: statement.substring(0, 100) + '...'
            });
            continue;
          }
          
          // Other RPC errors
          throw rpcError;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
        successCount++;
        
      } catch (err) {
        console.error(`❌ Statement ${i + 1} failed: ${err.message}`);
        errorCount++;
        errors.push({
          statement: i + 1,
          error: err.message,
          sql: statement.substring(0, 200) + '...'
        });
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    
    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
      console.log(`   Applied ${successCount} statements`);
      console.log('');
      console.log('Next steps:');
      console.log('   1. Verify tables and functions were created');
      console.log('   2. Run tag migration if needed: SELECT migrate_conversation_tags();');
      console.log('   3. Initialize workspace members if needed');
    } else {
      console.log(`⚠️  Migration partially completed`);
      console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
      console.log('');
      
      if (errors.some(e => e.error.includes('exec_sql'))) {
        console.log('💡 Some statements require direct database connection.');
        console.log('   You can:');
        console.log('   1. Apply via Supabase Dashboard SQL Editor (recommended)');
        console.log('   2. Use Supabase CLI: supabase db push');
        console.log('   3. Use psql with direct connection string');
      } else {
        console.log('❌ Errors encountered:');
        errors.slice(0, 5).forEach(err => {
          console.log(`   Statement ${err.statement}: ${err.error}`);
        });
        if (errors.length > 5) {
          console.log(`   ... and ${errors.length - 5} more errors`);
        }
      }
    }
    
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('   1. Check environment variables are set correctly');
    console.error('   2. Verify SUPABASE_SERVICE_ROLE_KEY has admin permissions');
    console.error('   3. Try applying via Supabase Dashboard SQL Editor instead');
    process.exit(1);
  }
}

// Run migration
applyMigration();

