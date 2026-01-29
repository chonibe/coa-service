#!/usr/bin/env node

/**
 * Apply slides feature migrations directly to Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration(filePath, migrationName) {
  console.log(`\n📝 Applying ${migrationName}...`)
  
  const sql = fs.readFileSync(filePath, 'utf-8')
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    console.error(`❌ Error applying ${migrationName}:`, error)
    return false
  }
  
  console.log(`✅ Successfully applied ${migrationName}`)
  return true
}

async function main() {
  console.log('🚀 Applying slides feature migrations...\n')
  
  const migrations = [
    {
      file: 'supabase/migrations/20260128200000_create_artwork_slides.sql',
      name: 'artwork_slides table'
    },
    {
      file: 'supabase/migrations/20260128210000_create_artwork_story_posts.sql',
      name: 'artwork_story_posts table'
    },
    {
      file: 'supabase/migrations/20260128220000_create_notifications.sql',
      name: 'collector_notifications table'
    }
  ]
  
  for (const migration of migrations) {
    const filePath = path.join(process.cwd(), migration.file)
    const success = await applyMigration(filePath, migration.name)
    
    if (!success) {
      console.error('\n❌ Migration failed. Stopping.')
      process.exit(1)
    }
  }
  
  console.log('\n✅ All migrations applied successfully!')
}

main().catch(console.error)
