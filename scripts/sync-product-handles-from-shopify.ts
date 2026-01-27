/**
 * Sync Product Handles from Shopify
 * 
 * This script fetches products from Shopify and updates the local database
 * with correct handle values.
 * 
 * Usage:
 *   npx tsx scripts/sync-product-handles-from-shopify.ts [--dry-run]
 * 
 * Example:
 *   npx tsx scripts/sync-product-handles-from-shopify.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN!
const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

if (!shopifyDomain || !shopifyAccessToken) {
  console.error('❌ Missing Shopify credentials in .env.local')
  console.error('   Required: SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ShopifyProduct {
  id: string
  title: string
  handle: string
  vendor: string
  created_at: string
}

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  console.log('🔍 Fetching products from Shopify...')

  const url = `https://${shopifyDomain}/admin/api/2024-01/products.json?limit=250`
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': shopifyAccessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Fetched ${data.products?.length || 0} products from Shopify`)

    return data.products || []
  } catch (error: any) {
    console.error(`❌ Failed to fetch from Shopify: ${error.message}`)
    return []
  }
}

async function syncProductHandles(dryRun: boolean = true): Promise<void> {
  const shopifyProducts = await fetchShopifyProducts()

  if (shopifyProducts.length === 0) {
    console.log('⚠️  No products to sync')
    return
  }

  console.log(`\n🔄 Syncing ${shopifyProducts.length} product handles...`)
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n')
  }

  let updated = 0
  let missing = 0
  let errors = 0

  for (const shopifyProduct of shopifyProducts) {
    // Extract Shopify product ID (remove 'gid://shopify/Product/' prefix)
    const shopifyId = shopifyProduct.id.split('/').pop()

    // Find matching product in local database
    const { data: localProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name, handle, shopify_product_id')
      .eq('shopify_product_id', shopifyId)
      .maybeSingle()

    if (fetchError) {
      console.error(`❌ Error fetching product ${shopifyId}: ${fetchError.message}`)
      errors++
      continue
    }

    if (!localProduct) {
      console.log(`⚠️  No local product found for Shopify ID: ${shopifyId} (${shopifyProduct.title})`)
      missing++
      continue
    }

    // Check if handle needs updating
    if (localProduct.handle !== shopifyProduct.handle) {
      console.log(`📝 Updating handle for "${localProduct.name}":`)
      console.log(`   Old: ${localProduct.handle || 'NULL'}`)
      console.log(`   New: ${shopifyProduct.handle}`)

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            handle: shopifyProduct.handle,
            updated_at: new Date().toISOString(),
          })
          .eq('id', localProduct.id)

        if (updateError) {
          console.error(`   ❌ Update failed: ${updateError.message}`)
          errors++
        } else {
          console.log(`   ✅ Updated successfully`)
          updated++
        }
      } else {
        updated++
      }
    }
  }

  console.log(`\n📊 Sync Summary:`)
  console.log(`   Products checked: ${shopifyProducts.length}`)
  console.log(`   Handles updated: ${updated}`)
  console.log(`   Products missing locally: ${missing}`)
  console.log(`   Errors: ${errors}`)

  if (dryRun && updated > 0) {
    console.log(`\n💡 Run with --execute flag to apply changes`)
  }
}

// Main execution
const args = process.argv.slice(2)
const dryRun = !args.includes('--execute')

console.log('🔧 Product Handle Sync Tool\n')
console.log('='.repeat(80) + '\n')

syncProductHandles(dryRun).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
