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
    -- Create kickstarter_backers_list table
    CREATE TABLE IF NOT EXISTS "public"."kickstarter_backers_list" (
        "id" SERIAL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "backing_amount_gbp" DECIMAL(10, 2),
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email)
    );

    -- Add comment
    COMMENT ON TABLE "public"."kickstarter_backers_list" IS 'Source of truth for original Kickstarter backers from the campaign.';
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error running migration via RPC:', error);
  } else {
    console.log('Migration completed successfully via RPC.');
  }
}

runMigration().catch(console.error);


