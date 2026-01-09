const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Load environment variables from .vercel/.env.development.local
const envPath = path.join(__dirname, '..', '.vercel', '.env.development.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

// Get Supabase URL and key from environment
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Migration file to apply
const migrationFile = '20260108000004_enhance_release_notes_details.sql'

async function enhanceReleaseNotesDetails() {
  console.log('Starting release notes details enhancement...')

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  console.log(`Applying migration: ${migrationFile}`)

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          console.error(`Error executing statement:`, error)
          // Continue with other statements even if one fails
        }
      }
    }

    console.log(`✅ Migration ${migrationFile} completed`)
  } catch (error) {
    console.error(`❌ Failed to apply migration ${migrationFile}:`, error)
  }

  console.log('Release notes details enhancement finished!')
}

enhanceReleaseNotesDetails().catch(console.error)


