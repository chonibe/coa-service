/**
 * Applies supabase/migrations/20260417200000_vendor_payouts_status_fields.sql
 * directly via POSTGRES_URL_NON_POOLING from .env.local.
 *
 * Safe to re-run: uses ADD COLUMN IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
 */
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { Client } = require('pg')

const MIGRATION_FILE = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260417200000_vendor_payouts_status_fields.sql'
)

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL

if (!connectionString) {
  console.error('❌ Missing POSTGRES_URL_NON_POOLING / DATABASE_URL in .env.local')
  process.exit(1)
}

async function run() {
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8')
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  console.log('🚀 Applying migration: 20260417200000_vendor_payouts_status_fields.sql')
  console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB\n`)

  try {
    await client.connect()
    await client.query(sql)
    console.log('✅ Migration applied successfully.')

    const cols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vendor_payouts'
        AND column_name IN ('rejection_reason','failure_reason','processed_at','canceled_at','canceled_by','cancel_reason')
      ORDER BY column_name
    `)
    console.log('   Columns present:')
    for (const r of cols.rows) console.log(`     - ${r.column_name} :: ${r.data_type}`)

    const idx = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'vendor_payouts'
        AND indexname IN (
          'idx_vendor_payouts_vendor_status_requested',
          'idx_vendor_payouts_status_needs_attention'
        )
      ORDER BY indexname
    `)
    console.log('   Indexes present:', idx.rows.map((r) => r.indexname))
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()
