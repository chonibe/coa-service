#!/usr/bin/env node

/**
 * Apply Early Access Coupons Migration
 * Attempts to apply migration via Supabase RPC exec_sql, falls back to manual instructions
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n📝 Please apply this migration manually via Supabase Dashboard:')
  console.error('   1. Go to Supabase Dashboard > SQL Editor')
  console.error('   2. Copy contents of: supabase/migrations/20260315000000_early_access_coupons.sql')
  console.error('   3. Paste and execute')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function applyMigration() {
  const migrationFile = '20260315000000_early_access_coupons.sql'
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  console.log(`\n📄 Applying: ${migrationFile}`)
  console.log('   Reading migration file...')

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    console.log(`   File size: ${(sql.length / 1024).toFixed(2)} KB`)

    // Try using exec_sql RPC function
    console.log('   Attempting to apply via exec_sql RPC...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      if (error.message?.includes('function') || error.code === '42883') {
        console.log('   ⚠️  exec_sql RPC function not available')
        console.log('\n📝 Please apply this migration manually via Supabase Dashboard:')
        console.log('   1. Go to Supabase Dashboard > SQL Editor')
        console.log('   2. Copy contents of:')
        console.log(`      supabase/migrations/${migrationFile}`)
        console.log('   3. Paste and execute')
        process.exit(1)
      } else {
        console.error(`   ❌ Error: ${error.message}`)
        console.log('\n📝 Please check the error and apply manually if needed')
        process.exit(1)
      }
    } else {
      console.log(`   ✅ Migration applied successfully`)
      console.log('\n✨ Early access coupons feature is now active!')
      process.exit(0)
    }
  } catch (error) {
    console.error(`   ❌ Error:`, error.message)
    console.log('\n📝 Please apply this migration manually via Supabase Dashboard')
    process.exit(1)
  }
}

applyMigration()
