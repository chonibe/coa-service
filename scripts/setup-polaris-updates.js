#!/usr/bin/env node

/**
 * Setup script for Polaris Updates System
 * 
 * This script creates the polaris_updates table in your Supabase database
 * Run with: node scripts/setup-polaris-updates.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createTableSQL = `
-- Polaris Updates Tracking Table
CREATE TABLE IF NOT EXISTS polaris_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Package information
  package_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('major', 'minor', 'patch')),
  
  -- Release information
  release_date TIMESTAMPTZ NOT NULL,
  changelog_url TEXT NOT NULL,
  migration_guide_url TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'installed')),
  
  -- Approval tracking
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Installation tracking
  installed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate updates
  UNIQUE(package_name, latest_version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_polaris_updates_status ON polaris_updates(status);
CREATE INDEX IF NOT EXISTS idx_polaris_updates_created_at ON polaris_updates(created_at DESC);

-- Enable RLS
ALTER TABLE polaris_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view polaris updates" ON polaris_updates;
DROP POLICY IF EXISTS "Admin users can create polaris updates" ON polaris_updates;
DROP POLICY IF EXISTS "Admin users can update polaris updates" ON polaris_updates;

-- Create policies
CREATE POLICY "Admin users can view polaris updates"
  ON polaris_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can create polaris updates"
  ON polaris_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update polaris updates"
  ON polaris_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create trigger function
CREATE OR REPLACE FUNCTION update_polaris_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_polaris_updates_timestamp ON polaris_updates;

-- Create trigger
CREATE TRIGGER update_polaris_updates_timestamp
  BEFORE UPDATE ON polaris_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_polaris_updates_updated_at();

-- Add comments
COMMENT ON TABLE polaris_updates IS 'Tracks available Polaris package updates for admin approval';
COMMENT ON COLUMN polaris_updates.package_name IS 'Name of the Polaris package (e.g., @shopify/polaris)';
COMMENT ON COLUMN polaris_updates.update_type IS 'Type of update: major (breaking), minor (features), or patch (fixes)';
COMMENT ON COLUMN polaris_updates.status IS 'Current status: pending, approved, rejected, or installed';
COMMENT ON COLUMN polaris_updates.approved_by IS 'User ID of admin who approved/rejected the update';
`;

async function setupDatabase() {
  console.log('🚀 Setting up Polaris Updates System...\n');
  
  try {
    console.log('📊 Creating polaris_updates table...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      // Try alternative method: direct query
      console.log('   Trying alternative method...');
      
      // Split into individual statements and execute
      const statements = createTableSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (stmtError && !stmtError.message.includes('already exists')) {
          console.error(`   ❌ Error executing statement:`, stmtError.message);
        }
      }
    }
    
    console.log('   ✅ Table created successfully!\n');
    
    // Verify table exists
    console.log('🔍 Verifying table...');
    const { data, error: verifyError } = await supabase
      .from('polaris_updates')
      .select('count')
      .limit(1);
    
    if (verifyError) {
      console.error('   ❌ Verification failed:', verifyError.message);
      console.error('\n⚠️  Please run the SQL manually in Supabase dashboard:');
      console.error('   Go to: https://supabase.com/dashboard/project/[your-project]/sql');
      console.error('   Copy the SQL from: supabase/migrations/20260125_create_polaris_updates_table.sql\n');
    } else {
      console.log('   ✅ Table verified!\n');
      
      console.log('✅ Setup complete!');
      console.log('\n📝 Next steps:');
      console.log('   1. Configure GitHub token in .env.local:');
      console.log('      GITHUB_TOKEN=your_token');
      console.log('      GITHUB_REPO=your-org/your-repo');
      console.log('   2. Add cron secret:');
      console.log('      CRON_SECRET=random_secret');
      console.log('   3. Deploy to Vercel');
      console.log('   4. Navigate to /admin to see the update banner!\n');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n💡 Alternative: Run SQL manually in Supabase dashboard');
    console.error('   File: supabase/migrations/20260125_create_polaris_updates_table.sql\n');
    process.exit(1);
  }
}

setupDatabase();
