#!/usr/bin/env node
/**
 * Apply a single migration SQL file using POSTGRES_URL_NON_POOLING / POSTGRES_URL / DATABASE_URL
 * from .env.local. Use when `supabase db push` is blocked by migration ordering.
 *
 * Usage: node scripts/apply-migration-from-env.mjs supabase/migrations/20260406121000_vendor_artist_spotlight_enabled.sql
 * Then:  npx supabase migration repair <VERSION> --status applied --linked
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
config({ path: path.join(root, '.env.local') })

const rel = process.argv[2]
if (!rel) {
  console.error('Usage: node scripts/apply-migration-from-env.mjs <path-to-migration.sql>')
  process.exit(1)
}

const sqlPath = path.isAbsolute(rel) ? rel : path.join(root, rel)
if (!fs.existsSync(sqlPath)) {
  console.error('File not found:', sqlPath)
  process.exit(1)
}

function resolveConnectionString() {
  let url =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  if (!url) {
    console.error('Set POSTGRES_URL_NON_POOLING, POSTGRES_URL, or DATABASE_URL in .env.local')
    process.exit(1)
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    url = 'postgresql://' + url
  }
  return url
}

const sql = fs.readFileSync(sqlPath, 'utf8')
const client = new pg.Client({
  connectionString: resolveConnectionString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
})

await client.connect()
try {
  await client.query(sql)
  console.log('Applied', path.basename(sqlPath))
  const m = path.basename(sqlPath).match(/^(\d{14})_/)
  if (m) {
    console.log(`\nSync CLI history: npx supabase migration repair ${m[1]} --status applied --linked`)
  }
} finally {
  await client.end()
}
