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

async function testStepByStep() {
  console.log('🧪 Testing step by step...\n')

  const statements = [
    // Drop table first
    `DROP TABLE IF EXISTS artwork_slides CASCADE;`,

    // Create table
    `CREATE TABLE artwork_slides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      display_order INTEGER DEFAULT 0,
      background JSONB NOT NULL DEFAULT '{"type": "gradient", "value": "dark", "scale": 1, "offsetX": 0, "offsetY": 0}',
      elements JSONB DEFAULT '[]',
      title TEXT,
      caption TEXT,
      audio JSONB,
      is_locked BOOLEAN DEFAULT false,
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // Create index
    `CREATE INDEX idx_artwork_slides_product_order ON artwork_slides(product_id, display_order);`,

    // Enable RLS
    `ALTER TABLE artwork_slides ENABLE ROW LEVEL SECURITY;`,
  ]

  for (let i = 0; i < statements.length; i++) {
    console.log(`\n📝 Step ${i + 1}: ${statements[i].substring(0, 50)}...`)
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statements[i] })

      if (error) {
        console.error(`❌ Error in step ${i + 1}:`, error)
        process.exit(1)
      }

      console.log(`✅ Step ${i + 1} completed`)
    } catch (err) {
      console.error(`❌ Exception in step ${i + 1}:`, err)
      process.exit(1)
    }
  }

  console.log('\n✅ All steps completed! Now testing policies...')

  // Test policies separately
  const policyStatements = [
    `CREATE POLICY "Vendors can manage their product slides"
      ON artwork_slides FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM products p
          WHERE p.id = product_id AND p.vendor_name = (auth.jwt() ->> 'email')
        )
      );`,

    `CREATE POLICY "Anyone can view published slides"
      ON artwork_slides FOR SELECT
      USING (is_published = true);`
  ]

  for (let i = 0; i < policyStatements.length; i++) {
    console.log(`\n📝 Policy ${i + 1}: ${policyStatements[i].substring(0, 50)}...`)
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: policyStatements[i] })

      if (error) {
        console.error(`❌ Error in policy ${i + 1}:`, error)
        process.exit(1)
      }

      console.log(`✅ Policy ${i + 1} completed`)
    } catch (err) {
      console.error(`❌ Exception in policy ${i + 1}:`, err)
      process.exit(1)
    }
  }

  console.log('\n🎉 All tests passed! Tables created successfully.')
}

testStepByStep().catch(console.error)
