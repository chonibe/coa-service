#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyGA4PurchaseTracking() {
  console.log('🔧 Applying GA4 purchase tracking table...\n')

  const ga4PurchaseTrackingSQL = `
    -- Create GA4 purchase tracking table for client-side tracking
    -- This stores purchase data that will be retrieved by the client for GA4 e-commerce tracking

    CREATE TABLE IF NOT EXISTS ga4_purchase_tracking (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE,
        purchase_data JSONB NOT NULL,
        tracked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Index for efficient lookups
    CREATE INDEX IF NOT EXISTS idx_ga4_purchase_tracking_order_id ON ga4_purchase_tracking(order_id);
    CREATE INDEX IF NOT EXISTS idx_ga4_purchase_tracking_tracked_at ON ga4_purchase_tracking(tracked_at) WHERE tracked_at IS NULL;

    -- Add RLS policies
    ALTER TABLE ga4_purchase_tracking ENABLE ROW LEVEL SECURITY;

    -- Allow service role to insert/update (webhook)
    CREATE POLICY "Service role can manage purchase tracking" ON ga4_purchase_tracking
        FOR ALL USING (auth.role() = 'service_role');

    -- Allow authenticated users to read their own purchase data (for client-side tracking)
    CREATE POLICY "Users can read purchase tracking for client-side GA4" ON ga4_purchase_tracking
        FOR SELECT USING (auth.role() = 'authenticated');
  `

  console.log('📝 Creating ga4_purchase_tracking table...')
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: ga4PurchaseTrackingSQL })

  if (error) {
    console.error('❌ Error creating GA4 purchase tracking table:', error)
    return
  }

  console.log('✅ GA4 purchase tracking table created successfully')

  // Apply trigger
  const triggerSQL = `
    -- Function to automatically update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_ga4_purchase_tracking_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Trigger to update updated_at on changes
    CREATE TRIGGER trigger_update_ga4_purchase_tracking_updated_at
        BEFORE UPDATE ON ga4_purchase_tracking
        FOR EACH ROW
        EXECUTE FUNCTION update_ga4_purchase_tracking_updated_at();
  `

  console.log('📝 Applying trigger...')
  const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', { sql_query: triggerSQL })

  if (triggerError) {
    console.error('❌ Error applying trigger:', triggerError)
    return
  }

  console.log('✅ Trigger applied successfully')

  // Test the table
  console.log('\n🧪 Testing table...')
  const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
    sql_query: 'SELECT COUNT(*) as count FROM ga4_purchase_tracking'
  })

  if (testError) {
    console.error('❌ Error testing table:', testError)
  } else {
    console.log('✅ ga4_purchase_tracking table: OK')
  }

  console.log('\n🎉 GA4 purchase tracking migration completed successfully!')
}

applyGA4PurchaseTracking().catch(console.error)