#!/usr/bin/env node

/**
 * Apply collector default addresses migration
 *
 * Adds default_shipping_address and default_billing_address to collector_profiles.
 *
 * Usage:
 *   vercel env pull
 *   node scripts/apply-collector-addresses-migration.js
 *
 * Requires DATABASE_URL or POSTGRES_URL in .env.local (from Vercel)
 */

const { Client } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing POSTGRES_URL_NON_POOLING, DATABASE_URL, or POSTGRES_URL');
  console.error('   Run: vercel env pull .env.local --environment=production');
  process.exit(1);
}

const migrationSQL = `
-- Add default shipping and billing address JSONB columns to collector_profiles.
ALTER TABLE "public"."collector_profiles"
  ADD COLUMN IF NOT EXISTS "default_shipping_address" JSONB,
  ADD COLUMN IF NOT EXISTS "default_billing_address" JSONB;

COMMENT ON COLUMN "public"."collector_profiles"."default_shipping_address" IS 'Default shipping address (CheckoutAddress format) for prefill at checkout and display in account.';
COMMENT ON COLUMN "public"."collector_profiles"."default_billing_address" IS 'Default billing address (CheckoutAddress format) for prefill at checkout and display in account.';
`;

async function run() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
    // Transaction-mode pooler does not support prepared statements
    statement_timeout: 10000,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('📄 Applying collector default addresses migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
