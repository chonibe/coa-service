#!/usr/bin/env node
/**
 * Applies supabase/migrations/20260406120000_vendor_collection_saturn_png.sql
 * using a direct Postgres URL from .env.local (DATABASE_URL or POSTGRES_URL*).
 *
 * Use when `supabase db push --include-all` is blocked (ordering, locks, or pooler issues).
 * After success, sync CLI migration history:
 *
 *   npx supabase migration repair 20260406120000 --status applied --linked
 *
 * Or complete the normal chain with `npx supabase db push --yes --include-all`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

config({ path: path.join(root, '.env.local') })

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

const sqlPath = path.join(
  root,
  'supabase/migrations/20260406120000_vendor_collection_saturn_png.sql'
)
const sql = fs.readFileSync(sqlPath, 'utf8')
const client = new pg.Client({
  connectionString: resolveConnectionString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
})

await client.connect()
try {
  const r = await client.query(sql)
  console.log('Applied', path.basename(sqlPath), 'rowCount=', r.rowCount)
  console.log(
    '\nNext (Supabase CLI): npx supabase migration repair 20260406120000 --status applied --linked'
  )
} finally {
  await client.end()
}
