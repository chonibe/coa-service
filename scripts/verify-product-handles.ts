/**
 * Verify Product Handles
 * 
 * This script checks if products with specific handles exist in the database
 * and verifies their vendor ownership and handle values.
 * 
 * Usage:
 *   npx tsx scripts/verify-product-handles.ts [handle1] [handle2] ...
 * 
 * Example:
 *   npx tsx scripts/verify-product-handles.ts afternoon-love side-b-3
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProductInfo {
  id: string
  name: string
  handle: string | null
  vendor_name: string
  shopify_product_id: string
  created_at: string
}

async function verifyProductHandle(handle: string): Promise<void> {
  console.log(`\n🔍 Searching for product with handle: "${handle}"`)

  // Search by handle
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, handle, vendor_name, shopify_product_id, created_at')
    .eq('handle', handle)

  if (error) {
    console.error(`❌ Error querying products: ${error.message}`)
    return
  }

  if (!products || products.length === 0) {
    console.log(`❌ No product found with handle: "${handle}"`)
    
    // Search by name (case-insensitive)
    console.log(`\n🔍 Searching by name containing: "${handle}"...`)
    const { data: productsByName } = await supabase
      .from('products')
      .select('id, name, handle, vendor_name')
      .ilike('name', `%${handle}%`)
      .limit(5)

    if (productsByName && productsByName.length > 0) {
      console.log(`\n📋 Found ${productsByName.length} product(s) with similar name:`)
      productsByName.forEach((p, i) => {
        console.log(`  ${i + 1}. "${p.name}" (handle: ${p.handle || 'NULL'}, vendor: ${p.vendor_name})`)
      })
    } else {
      console.log(`❌ No products found with similar name`)
    }
    
    return
  }

  console.log(`✅ Found ${products.length} product(s) with handle "${handle}":`)
  products.forEach((product: ProductInfo, i) => {
    console.log(`\n  ${i + 1}. Product Details:`)
    console.log(`     ID: ${product.id}`)
    console.log(`     Name: ${product.name}`)
    console.log(`     Handle: ${product.handle || 'NULL'}`)
    console.log(`     Vendor: ${product.vendor_name}`)
    console.log(`     Shopify ID: ${product.shopify_product_id}`)
    console.log(`     Created: ${product.created_at}`)
  })
}

async function getAllProducts(): Promise<void> {
  console.log(`\n📊 Fetching all products...`)

  const { data: products, error, count } = await supabase
    .from('products')
    .select('id, name, handle, vendor_name', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error(`❌ Error fetching products: ${error.message}`)
    return
  }

  console.log(`\n✅ Total products in database: ${count}`)
  console.log(`\n📋 Most recent 50 products:`)
  
  products?.forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.name}" (handle: ${p.handle || 'NULL'}, vendor: ${p.vendor_name})`)
  })
}

async function verifySubmission(uuid: string): Promise<void> {
  console.log(`\n🔍 Verifying submission UUID: ${uuid}`)

  const { data: submission, error } = await supabase
    .from('vendor_product_submissions')
    .select('id, vendor_name, status, product_data, created_at')
    .eq('id', uuid)
    .single()

  if (error || !submission) {
    console.log(`❌ No submission found with UUID: ${uuid}`)
    return
  }

  console.log(`✅ Submission found:`)
  console.log(`   ID: ${submission.id}`)
  console.log(`   Vendor: ${submission.vendor_name}`)
  console.log(`   Status: ${submission.status}`)
  console.log(`   Created: ${submission.created_at}`)
  console.log(`   Product Title: ${submission.product_data?.title || 'N/A'}`)
}

// Main execution
const args = process.argv.slice(2)

console.log('🔧 Product Handle Verification Tool\n')
console.log('='.repeat(80))

if (args.length === 0) {
  console.log('ℹ️  No handles provided. Showing all products...')
  getAllProducts()
} else if (args[0].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
  // It's a UUID
  verifySubmission(args[0])
} else {
  // Verify each handle
  args.forEach(handle => verifyProductHandle(handle))
}
