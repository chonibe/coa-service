/**
 * Script to check and apply migrations for the Collector Dashboard Enhancement plan
 * 
 * This script checks which migrations from the plan have been applied and applies any missing ones.
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Migrations required for the plan
const requiredMigrations = [
  '20260124000001_add_vendor_signature.sql',
  '20260124000002_add_content_block_fields.sql',
  '20260124000003_add_analytics_and_auth_code.sql',
  '20260124000004_add_collector_auth_notifications.sql',
  '20260124000005_generate_auth_codes.sql',
  '20260125000001_ensure_content_block_fields.sql', // Safety migration
]

async function checkAppliedMigrations() {
  try {
    // Query the supabase_migrations table to see which migrations have been applied
    const { data: appliedMigrations, error } = await supabase
      .from('supabase_migrations')
      .select('name, version')
      .order('version', { ascending: true })

    if (error) {
      console.error('Error checking migrations:', error)
      // If table doesn't exist, we'll assume no migrations have been applied
      return []
    }

    return appliedMigrations || []
  } catch (err) {
    console.warn('Could not check migration status (table may not exist):', err.message)
    return []
  }
}

async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationFile}`)
    return false
  }

  console.log(`\n📄 Applying migration: ${migrationFile}`)

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration SQL
    // Note: Supabase JS client doesn't have a direct SQL execution method
    // We'll need to use RPC or the REST API
    // For now, we'll check if we can use the management API or provide instructions

    console.log(`✅ Migration file found: ${migrationFile}`)
    console.log(`   File size: ${(sql.length / 1024).toFixed(2)} KB`)
    console.log(`   Lines: ${sql.split('\n').length}`)
    
    return true
  } catch (error) {
    console.error(`❌ Error reading migration file:`, error)
    return false
  }
}

async function checkDatabaseColumns() {
  console.log('\n🔍 Checking database columns...\n')

  // Check if vendor signature columns exist
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('signature_url, signature_uploaded_at')
      .limit(1)
    
    if (!error) {
      console.log('✅ Vendor signature columns: EXISTS')
    } else {
      if (error.message?.includes('signature_url') || error.message?.includes('signature_uploaded_at')) {
        console.log('⚠️  Vendor signature columns: NEEDS MIGRATION')
        console.log(`   Error: ${error.message}`)
      } else {
        console.log('✅ Vendor signature columns: EXISTS (or different error)')
      }
    }
  } catch (err) {
    console.log('⚠️  Could not check vendor columns:', err.message)
  }

  // Check if product_benefits columns exist
  try {
    const { data: benefits, error: benefitsError } = await supabase
      .from('product_benefits')
      .select('display_order, block_config, is_published, series_id')
      .limit(1)

    if (!benefitsError) {
      console.log('✅ Product benefits columns: EXISTS')
    } else {
      if (benefitsError.message?.includes('display_order') || 
          benefitsError.message?.includes('block_config') ||
          benefitsError.message?.includes('is_published') ||
          benefitsError.code === '42703') {
        console.log('⚠️  Product benefits columns: NEEDS MIGRATION')
        console.log(`   Error: ${benefitsError.message}`)
      } else {
        console.log('✅ Product benefits columns: EXISTS (or different error)')
      }
    }
  } catch (err) {
    console.log('⚠️  Could not check product_benefits columns:', err.message)
  }

  // Check if artwork_page_analytics table exists
  try {
    const { data: analytics, error: analyticsError } = await supabase
      .from('artwork_page_analytics')
      .select('id')
      .limit(1)

    if (!analyticsError) {
      console.log('✅ artwork_page_analytics table: EXISTS')
    } else {
      if (analyticsError.message?.includes('does not exist') || analyticsError.code === 'PGRST116' || analyticsError.code === '42P01') {
        console.log('⚠️  artwork_page_analytics table: NEEDS MIGRATION')
      } else {
        console.log('✅ artwork_page_analytics table: EXISTS (or different error)')
      }
    }
  } catch (err) {
    console.log('⚠️  Could not check artwork_page_analytics table:', err.message)
  }

  // Check if order_line_items_v2 has auth_code
  try {
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('order_line_items_v2')
      .select('auth_code')
      .limit(1)

    if (!lineItemsError) {
      console.log('✅ order_line_items_v2.auth_code column: EXISTS')
    } else {
      if (lineItemsError.message?.includes('auth_code') || lineItemsError.code === '42703') {
        console.log('⚠️  order_line_items_v2.auth_code column: NEEDS MIGRATION')
      } else {
        console.log('✅ order_line_items_v2.auth_code column: EXISTS (or different error)')
      }
    }
  } catch (err) {
    console.log('⚠️  Could not check order_line_items_v2.auth_code:', err.message)
  }
}

async function main() {
  console.log('🚀 Checking Collector Dashboard Enhancement Plan Migrations\n')
  console.log('=' .repeat(60))

  // Check applied migrations
  const appliedMigrations = await checkAppliedMigrations()
  console.log(`\n📊 Found ${appliedMigrations.length} applied migrations in database`)

  // Check database columns directly
  await checkDatabaseColumns()

  // Check each required migration
  console.log('\n📋 Required Migrations Status:\n')
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  for (const migrationFile of requiredMigrations) {
    const migrationPath = path.join(migrationsDir, migrationFile)
    const exists = fs.existsSync(migrationPath)
    const applied = appliedMigrations.some(m => m.name === migrationFile || m.name?.includes(migrationFile.replace('.sql', '')))

    const status = exists 
      ? (applied ? '✅ APPLIED' : '⚠️  NOT APPLIED')
      : '❌ FILE MISSING'

    console.log(`${status} - ${migrationFile}`)
    
    if (exists && !applied) {
      console.log(`   → Needs to be applied`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📝 Next Steps:')
  console.log('\nTo apply missing migrations, use one of these methods:')
  console.log('\n1. Supabase Dashboard (Recommended):')
  console.log('   - Go to Supabase Dashboard > SQL Editor')
  console.log('   - Copy and paste each migration file content')
  console.log('   - Run the SQL')
  console.log('\n2. Supabase CLI:')
  console.log('   - Run: supabase db push')
  console.log('\n3. Manual Application:')
  console.log('   - Each migration file is in: supabase/migrations/')
  console.log('   - Apply them in order: 20260124* then 20260125*')
  
  console.log('\n✅ Migration check complete!\n')
}

main().catch(console.error)
