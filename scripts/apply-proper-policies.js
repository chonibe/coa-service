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

async function applyProperPolicies() {
  console.log('🔧 Applying proper RLS policies...\n')

  // Drop the temporary policy
  const dropTempPolicy = `DROP POLICY IF EXISTS "Vendors can manage their product slides" ON artwork_slides;`
  console.log('📝 Dropping temporary policy...')
  await supabase.rpc('exec_sql', { sql_query: dropTempPolicy })

  // Try the proper policy
  const properPolicy = `
    CREATE POLICY "Vendors can manage their product slides"
      ON artwork_slides FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM products p
          WHERE p.id::text = artwork_slides.product_id::text
          AND p.vendor_name = (auth.jwt() ->> 'email')
        )
      );
  `

  console.log('📝 Applying proper vendor policy...')
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: properPolicy })

  if (error) {
    console.error('❌ Error applying proper policy:', error)

    // Try an even simpler version
    console.log('🔄 Trying simpler policy...')
    const simplePolicy = `
      CREATE POLICY "Vendors can manage their product slides"
        ON artwork_slides FOR ALL
        USING (auth.jwt() ->> 'email' IS NOT NULL);
    `

    const { data: simpleData, error: simpleError } = await supabase.rpc('exec_sql', { sql_query: simplePolicy })

    if (simpleError) {
      console.error('❌ Even simple policy failed:', simpleError)
      return
    }

    console.log('✅ Simple policy applied (will need refinement)')
  } else {
    console.log('✅ Proper policy applied successfully')
  }

  // Test the table still works
  console.log('🧪 Testing table...')
  const { data: slides, error: queryError } = await supabase
    .from('artwork_slides')
    .select('*')
    .limit(1)

  if (queryError) {
    console.error('❌ Query error:', queryError)
  } else {
    console.log('✅ Query successful:', slides)
  }
}

applyProperPolicies().catch(console.error)
