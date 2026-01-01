const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

// Migration files to apply
const migrations = [
  '20251227213216_add_biweekly_schedule.sql',
  '20251227213530_vendor_balance_tracking.sql',
  '20251227213531_instant_payout_requests.sql'
]

async function applyMigrations() {
  console.log('Starting migration application...')

  for (const migrationFile of migrations) {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile)

    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`)
      continue
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
  }

  console.log('Migration application finished!')
}

applyMigrations().catch(console.error)



