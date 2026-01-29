#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateMigrationHistory() {
  console.log('📝 Updating migration history...\n')

  // Read the migration files to get their content
  const fs = require('fs')
  const path = require('path')

  const migrations = [
    {
      version: '20260128200000',
      name: 'create_artwork_slides',
      file: 'supabase/migrations/20260128200000_create_artwork_slides.sql'
    },
    {
      version: '20260128210000',
      name: 'create_artwork_story_posts',
      file: 'supabase/migrations/20260128210000_create_artwork_story_posts.sql'
    },
    {
      version: '20260128220000',
      name: 'create_notifications',
      file: 'supabase/migrations/20260128220000_create_notifications.sql'
    }
  ]

  for (const migration of migrations) {
    try {
      const filePath = path.join(process.cwd(), migration.file)
      const statements = fs.readFileSync(filePath, 'utf-8')

      // Insert into migration history
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
          INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
          VALUES ($1, $2, $3)
          ON CONFLICT (version) DO NOTHING
        `,
        params: [migration.version, migration.name, statements]
      })

      if (error) {
        console.error(`❌ Error updating history for ${migration.name}:`, error)
      } else {
        console.log(`✅ Updated history for ${migration.name}`)
      }
    } catch (err) {
      console.error(`❌ Error reading ${migration.file}:`, err)
    }
  }

  console.log('\n📋 Checking final migration status...')
  const { data: history, error: historyError } = await supabase.rpc('exec_sql', {
    sql_query: 'SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5'
  })

  if (historyError) {
    console.error('❌ Error checking history:', historyError)
  } else {
    console.log('✅ Migration history updated')
  }
}

updateMigrationHistory().catch(console.error)
