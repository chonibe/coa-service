const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function applyCollectorProfileMigration() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  console.log('--- Migrating Collector Profiles Table ---');
  
  const sql = `
    -- 1. Allow NULL user_id for guest profiles
    ALTER TABLE public.collector_profiles ALTER COLUMN user_id DROP NOT NULL;

    -- 2. Add shopify_customer_id for linking to Shopify
    ALTER TABLE public.collector_profiles ADD COLUMN IF NOT EXISTS shopify_customer_id TEXT;

    -- 3. Add unique constraint on email to prevent duplicates during enrichment
    -- First cleanup any duplicates if they exist (keep the one with user_id)
    DELETE FROM public.collector_profiles a USING public.collector_profiles b
    WHERE a.id < b.id AND LOWER(a.email) = LOWER(b.email);

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'collector_profiles_email_key') THEN
            ALTER TABLE public.collector_profiles ADD CONSTRAINT collector_profiles_email_key UNIQUE (email);
        END IF;
    END $$;

    -- 4. Index the new column
    CREATE INDEX IF NOT EXISTS idx_collector_profiles_shopify_id ON public.collector_profiles(shopify_customer_id);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Migration Error:', error.message);
  } else {
    console.log('Migration Successful!');
  }
}

applyCollectorProfileMigration();

