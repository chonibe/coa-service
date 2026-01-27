/**
 * Script to apply the Collector Onboarding System migration
 * Uses Supabase service role key to execute SQL directly
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials.')
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const migrationFile = '20260126222158_collector_onboarding_system.sql'

async function applyMigration() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`)
    process.exit(1)
  }

  console.log('🚀 Applying Collector Onboarding System Migration\n')
  console.log('='.repeat(60))
  console.log(`📄 Migration: ${migrationFile}`)
  console.log('   Reading migration file...\n')

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(`   File size: ${(sql.length / 1024).toFixed(2)} KB`)
    console.log('   Attempting to apply via Supabase API...\n')

    // Split SQL into statements (handling DO blocks and multi-statement commands)
    // For now, we'll try to execute the entire SQL as one block
    // If that fails, we'll provide manual instructions
    
    // Try using exec_sql RPC function if it exists
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution via REST API
      if (error.message?.includes('function') || error.code === '42883') {
        console.log('   ⚠️  exec_sql RPC function not available')
        console.log('   → Trying alternative method...\n')
        
        // Try using the REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql_query: sql })
        })

        if (!response.ok) {
          console.log('   ⚠️  Direct API execution not available')
          console.log('\n📝 Please apply this migration manually via Supabase Dashboard:')
          console.log('   1. Go to Supabase Dashboard > SQL Editor')
          console.log('   2. Copy the contents of:')
          console.log(`      supabase/migrations/${migrationFile}`)
          console.log('   3. Paste and run the SQL')
          return false
        } else {
          console.log('   ✅ Migration applied successfully via API')
          return true
        }
      } else {
        console.error(`   ❌ Error: ${error.message}`)
        console.log('\n📝 Please apply this migration manually via Supabase Dashboard')
        return false
      }
    } else {
      console.log('   ✅ Migration applied successfully')
      return true
    }
  } catch (error) {
    console.error(`   ❌ Error:`, error.message)
    console.log('\n📝 Please apply this migration manually via Supabase Dashboard:')
    console.log('   1. Go to Supabase Dashboard > SQL Editor')
    console.log('   2. Copy the contents of:')
    console.log(`      supabase/migrations/${migrationFile}`)
    console.log('   3. Paste and run the SQL')
    return false
  }
}

async function main() {
  const success = await applyMigration()
  
  console.log('\n' + '='.repeat(60))
  if (success) {
    console.log('\n✅ Migration applied successfully!')
    console.log('\n📋 Next steps:')
    console.log('   1. Verify tables were created:')
    console.log('      - collector_onboarding_analytics')
    console.log('      - collector_achievements')
    console.log('   2. Check that columns were added to collector_profiles')
    console.log('   3. Verify RLS policies are in place')
  } else {
    console.log('\n⚠️  Migration needs to be applied manually')
  }
  console.log('\n')
}

main().catch(console.error)
