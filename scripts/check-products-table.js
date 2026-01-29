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

async function checkProductsTable() {
  console.log('🔍 Checking products table structure...\n')

  // Get table schema
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, udt_name')
    .eq('table_name', 'products')
    .eq('table_schema', 'public')

  if (columnsError) {
    console.error('❌ Error getting columns:', columnsError)
  } else {
    console.log('📋 Products table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`)
    })
  }

  // Test a simple query
  console.log('\n🧪 Testing simple product query...')
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, vendor_name')
    .limit(1)

  if (productsError) {
    console.error('❌ Error querying products:', productsError)
  } else {
    console.log('✅ Products query successful:', products)
    if (products && products.length > 0) {
      console.log(`📊 Sample product ID: ${products[0].id} (type: ${typeof products[0].id})`)
      console.log(`📊 Sample vendor_name: ${products[0].vendor_name} (type: ${typeof products[0].vendor_name})`)
    }
  }
}

checkProductsTable().catch(console.error)
