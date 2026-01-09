const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const sql = `
    -- For collector profiles
    ALTER TABLE "public"."collector_profiles" ADD COLUMN IF NOT EXISTS "is_kickstarter_backer" BOOLEAN DEFAULT FALSE;

    -- For orders
    ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "kickstarter_backing_amount_gbp" DECIMAL(10, 2);
    ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "kickstarter_backing_amount_usd" DECIMAL(10, 2);

    -- Add comments for clarity
    COMMENT ON COLUMN "public"."collector_profiles"."is_kickstarter_backer" IS 'Indicates if the collector was a backer of the original Kickstarter campaign.';
    COMMENT ON COLUMN "public"."orders"."kickstarter_backing_amount_gbp" IS 'The original backing amount in GBP from the Kickstarter campaign.';
    COMMENT ON COLUMN "public"."orders"."kickstarter_backing_amount_usd" IS 'The Kickstarter backing amount converted to USD.';
  `;

  // We use the exec_sql function which is usually available in this project's Supabase
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error running migration via RPC:', error);
    // Try a simpler approach if RPC fails - some Supabase setups don't have exec_sql
    console.log('Attempting alternative update (might not work for DDL)...');
  } else {
    console.log('Migration completed successfully via RPC.');
  }
}

runMigration().catch(console.error);

