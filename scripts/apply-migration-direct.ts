import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client with service role key for DDL operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
})

async function applyMigration() {
  try {
    console.log('📄 Reading migration file...')
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250115000000_preserve_authenticated_editions.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('🚀 Applying migration...')
    console.log('Migration: preserve_authenticated_editions.sql\n')
    
    // Split by semicolons and execute each statement
    // Note: Supabase client doesn't support DDL directly, so we need to use RPC or raw SQL
    // For function creation, we'll need to use the REST API or psql
    
    // Try using the REST API endpoint for SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: migrationSQL })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Migration applied successfully!')
      console.log('Result:', result)
    } else {
      // Fallback: try direct SQL execution via Supabase
      console.log('⚠️  REST API method failed, trying alternative approach...')
      console.log('Please apply this migration manually via Supabase Dashboard SQL Editor')
      console.log('\nSQL to execute:')
      console.log('='.repeat(60))
      console.log(migrationSQL)
      console.log('='.repeat(60))
      process.exit(1)
    }
  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message)
    console.log('\n📋 Please apply this migration manually:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy the SQL from: supabase/migrations/20250115000000_preserve_authenticated_editions.sql')
    console.log('3. Paste and run it')
    process.exit(1)
  }
}

applyMigration()

