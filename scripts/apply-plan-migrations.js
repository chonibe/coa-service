/**
 * Script to apply migrations for the Collector Dashboard Enhancement plan
 * 
 * This script applies all required migrations using Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Migrations in order
const migrations = [
  '20260124000001_add_vendor_signature.sql',
  '20260124000002_add_content_block_fields.sql',
  '20260124000003_add_analytics_and_auth_code.sql',
  '20260124000004_add_collector_auth_notifications.sql',
  '20260124000005_generate_auth_codes.sql',
  '20260125000001_ensure_content_block_fields.sql', // Safety migration
]

async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`)
    return false
  }

  console.log(`\n📄 Applying: ${migrationFile}`)
  console.log('   Reading migration file...')

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(`   File size: ${(sql.length / 1024).toFixed(2)} KB`)

    // Try using exec_sql RPC function (if it exists)
    console.log('   Attempting to apply via exec_sql RPC...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql doesn't exist, provide manual instructions
      if (error.message?.includes('function') || error.code === '42883') {
        console.log('   ⚠️  exec_sql RPC function not available')
        console.log('   → Please apply this migration manually via Supabase Dashboard')
        return false
      } else {
        console.error(`   ❌ Error: ${error.message}`)
        console.log('   → Please check the error and apply manually if needed')
        return false
      }
    } else {
      console.log(`   ✅ Migration applied successfully`)
      return true
    }
  } catch (error) {
    console.error(`   ❌ Error:`, error.message)
    console.log('   → Please apply this migration manually via Supabase Dashboard')
    return false
  }
}

async function main() {
  console.log('🚀 Applying Collector Dashboard Enhancement Plan Migrations\n')
  console.log('=' .repeat(60))

  let successCount = 0
  let failCount = 0

  for (const migrationFile of migrations) {
    const success = await applyMigration(migrationFile)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully applied: ${successCount}`)
  console.log(`   ⚠️  Needs manual application: ${failCount}`)

  if (failCount > 0) {
    console.log('\n📝 To apply remaining migrations manually:')
    console.log('   1. Go to Supabase Dashboard > SQL Editor')
    console.log('   2. Copy the contents of each migration file from:')
    console.log('      supabase/migrations/')
    console.log('   3. Paste and run each migration in order')
    console.log('\n   Migration files to apply:')
    migrations.forEach((file, idx) => {
      console.log(`      ${idx + 1}. ${file}`)
    })
  }

  console.log('\n✅ Migration process complete!\n')
}

main().catch(console.error)
