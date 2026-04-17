/**
 * Applies the 20260417120000_artist_applications.sql migration directly over
 * the Postgres connection using POSTGRES_URL_NON_POOLING from .env.local.
 *
 * Safe to re-run: the migration uses `create table if not exists`,
 * `create index if not exists`, `drop ... if exists` and `create or replace`.
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
  '20260417120000_artist_applications.sql'
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
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  console.log('🚀 Applying migration: 20260417120000_artist_applications.sql')
  console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB\n`)

  try {
    await client.connect()
    await client.query(sql)
    console.log('✅ Migration applied successfully.')

    const check = await client.query(
      "select to_regclass('public.artist_applications') as exists"
    )
    console.log('   Table exists:', check.rows[0].exists)

    const policies = await client.query(
      "select policyname from pg_policies where tablename = 'artist_applications' order by policyname"
    )
    console.log('   Policies:', policies.rows.map((r) => r.policyname))
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()
