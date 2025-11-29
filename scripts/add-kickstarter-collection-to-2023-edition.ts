import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables - try multiple locations
const envPaths = [
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../.env.production'),
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

// Also load from process.env (for Vercel/production)
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Missing Shopify environment variables')
  console.error('   Required: SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findCollectionByName(collectionName: string) {
  try {
    // First, try to find the collection by name using REST API
    let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/collections.json?limit=250`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.collections) {
      const collection = data.collections.find((c: any) => 
        c.title === collectionName || c.handle === collectionName.toLowerCase().replace(/\s+/g, '-')
      )
      
      if (collection) {
        return collection
      }
    }

    // Try GraphQL if REST didn't work
    const graphqlQuery = `
      {
        collections(first: 250, query: "title:'${collectionName}'") {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `

    const graphqlResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    })

    if (graphqlResponse.ok) {
      const graphqlData = await graphqlResponse.json()
      if (graphqlData.data && graphqlData.data.collections && graphqlData.data.collections.edges.length > 0) {
        const collection = graphqlData.data.collections.edges[0].node
        return {
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
        }
      }
    }

    return null
  } catch (error: any) {
    console.error('Error finding collection:', error.message)
    return null
  }
}

async function getProductsFromCollection(collectionId: string) {
  try {
    const products: any[] = []
    let pageInfo: string | null = null
    let pageCount = 0

    do {
      pageCount++
      let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/collections/${collectionId}/products.json?limit=250`
      
      if (pageInfo) {
        url += `&page_info=${pageInfo}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        products.push(...data.products)
        console.log(`   📄 Page ${pageCount}: Found ${data.products.length} products`)
      }

      // Check for next page
      pageInfo = null
      const linkHeader = response.headers.get('Link')
      if (linkHeader) {
        const links = linkHeader.split(',')
        for (const link of links) {
          const [url, rel] = link.split(';')
          if (rel.includes('rel="next"')) {
            const match = url.match(/page_info=([^&>]+)/)
            if (match && match[1]) {
              pageInfo = match[1]
            }
          }
        }
      }

      // Safety limit
      if (pageCount > 10) {
        console.log('   ⚠️  Reached page limit (10 pages), stopping...')
        break
      }
    } while (pageInfo)

    return products
  } catch (error: any) {
    console.error('Error fetching products from collection:', error.message)
    return []
  }
}

async function addKickstarterCollectionTo2023Edition() {
  try {
    console.log('🔍 Finding "Featured Artists Kickstarter" collection in Shopify...\n')

    // Find the collection
    const collection = await findCollectionByName('Featured Artists Kickstarter')
    
    if (!collection) {
      console.log('❌ Collection "Featured Artists Kickstarter" not found in Shopify')
      console.log('\n💡 Available collections:')
      
      // List all collections for reference
      const url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/collections.json?limit=250`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.collections && data.collections.length > 0) {
          data.collections.forEach((c: any) => {
            console.log(`   - "${c.title}" (${c.handle})`)
          })
        }
      }
      
      return
    }

    console.log(`✅ Found collection: "${collection.title}" (ID: ${collection.id})\n`)

    // Extract numeric ID from Shopify GID format (gid://shopify/Collection/123456)
    const collectionId = collection.id.toString().split('/').pop() || collection.id

    console.log(`📦 Fetching products from collection...\n`)
    const products = await getProductsFromCollection(collectionId)

    if (products.length === 0) {
      console.log('❌ No products found in collection')
      return
    }

    console.log(`\n✅ Found ${products.length} product(s) in collection\n`)

    // Display products
    console.log('🎨 Products in collection:\n')
    console.log('='.repeat(80))
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`)
      console.log(`   Shopify ID: ${product.id}`)
      console.log(`   Handle: ${product.handle}`)
      console.log(`   Vendor: ${product.vendor}`)
      console.log(`   Tags: ${product.tags || '(none)'}`)
    })

    console.log('\n' + '='.repeat(80))

    // Now find the "2023 Edition" series for each vendor
    console.log('\n🔍 Finding "2023 Edition" series...\n')

    // Group products by vendor
    const productsByVendor = new Map<string, typeof products>()
    for (const product of products) {
      const vendor = product.vendor || 'Unknown'
      if (!productsByVendor.has(vendor)) {
        productsByVendor.set(vendor, [])
      }
      productsByVendor.get(vendor)!.push(product)
    }

    let totalAdded = 0
    let totalSkipped = 0
    let totalNotFound = 0
    let errors = 0
    const results: any[] = []

    // Process each vendor
    for (const [vendorName, vendorProducts] of productsByVendor.entries()) {
      try {
        console.log(`\n🔄 Processing vendor: ${vendorName} (${vendorProducts.length} products)...`)

        // Get vendor from database
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id, vendor_name')
          .eq('vendor_name', vendorName)
          .maybeSingle()

        if (vendorError || !vendor) {
          console.log(`   ⚠️  Vendor "${vendorName}" not found in database`)
          totalNotFound += vendorProducts.length
          continue
        }

        // Find the "2023 Edition" series for this vendor
        const { data: series, error: seriesError } = await supabase
          .from('artwork_series')
          .select('id, name, vendor_id')
          .eq('vendor_id', vendor.id)
          .eq('name', '2023 Edition')
          .eq('is_active', true)
          .maybeSingle()

        if (seriesError) {
          console.error(`   ❌ Error fetching series: ${seriesError.message}`)
          errors++
          continue
        }

        if (!series) {
          console.log(`   ⚠️  "2023 Edition" series not found for vendor ${vendorName}`)
          totalNotFound += vendorProducts.length
          results.push({
            vendorName,
            vendorId: vendor.id,
            success: false,
            error: 'Series not found',
            productsSkipped: vendorProducts.length
          })
          continue
        }

        console.log(`   ✅ Found series: "${series.name}" (${series.id})`)

        // Get existing members to avoid duplicates
        const { data: existingMembers, error: membersError } = await supabase
          .from('artwork_series_members')
          .select('submission_id, shopify_product_id')
          .eq('series_id', series.id)

        if (membersError) {
          console.error(`   ❌ Error fetching existing members: ${membersError.message}`)
          errors++
          continue
        }

        const existingShopifyIds = new Set(
          (existingMembers || [])
            .map(m => m.shopify_product_id)
            .filter(id => id !== null)
        )

        // Extract numeric Shopify product IDs
        const shopifyProductIds = vendorProducts.map(p => {
          const id = p.id.toString()
          // Handle both numeric and GID format (gid://shopify/Product/123456)
          return id.includes('/') ? id.split('/').pop() : id
        })

        // Find submissions that match these Shopify product IDs
        const { data: submissions, error: submissionsError } = await supabase
          .from('vendor_product_submissions')
          .select('id, vendor_id, shopify_product_id, product_data')
          .eq('vendor_id', vendor.id)
          .in('shopify_product_id', shopifyProductIds)

        if (submissionsError) {
          console.error(`   ❌ Error fetching submissions: ${submissionsError.message}`)
          errors++
          continue
        }

        const submissionMap = new Map(
          (submissions || []).map(s => [s.shopify_product_id, s])
        )

        // Add products to series
        let addedCount = 0
        let skippedCount = 0

        for (const product of vendorProducts) {
          const shopifyId = product.id.toString().includes('/') 
            ? product.id.toString().split('/').pop() 
            : product.id.toString()

          // Skip if already in series
          if (existingShopifyIds.has(shopifyId)) {
            console.log(`   ⏭️  Product "${product.title}" already in series`)
            skippedCount++
            continue
          }

          // Find matching submission
          const submission = submissionMap.get(shopifyId)

          // Get the highest display_order for this series
          const { data: maxOrderData } = await supabase
            .from('artwork_series_members')
            .select('display_order')
            .eq('series_id', series.id)
            .order('display_order', { ascending: false })
            .limit(1)

          const nextDisplayOrder = maxOrderData && maxOrderData.length > 0
            ? (maxOrderData[0].display_order || 0) + 1
            : 0

          // Insert into artwork_series_members
          const { error: insertError } = await supabase
            .from('artwork_series_members')
            .insert({
              series_id: series.id,
              submission_id: submission?.id || null,
              shopify_product_id: shopifyId,
              is_locked: false,
              display_order: nextDisplayOrder,
            })

          if (insertError) {
            console.error(`   ❌ Error adding product ${product.title}: ${insertError.message}`)
            errors++
          } else {
            addedCount++
            console.log(`   ✅ Added "${product.title}" to series`)
          }
        }

        totalAdded += addedCount
        totalSkipped += skippedCount

        results.push({
          vendorName,
          vendorId: vendor.id,
          seriesId: series.id,
          seriesName: series.name,
          success: true,
          productsAdded: addedCount,
          productsSkipped: skippedCount,
          totalProducts: vendorProducts.length
        })

        console.log(`   📊 Added ${addedCount}, skipped ${skippedCount} (already in series)`)

      } catch (error: any) {
        console.error(`   ❌ Error processing vendor ${vendorName}: ${error.message}`)
        errors++
        results.push({
          vendorName,
          success: false,
          error: error.message
        })
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('📈 SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total products in collection: ${products.length}`)
    console.log(`Vendors processed: ${productsByVendor.size}`)
    console.log(`Products added to series: ${totalAdded}`)
    console.log(`Products skipped (already in series): ${totalSkipped}`)
    console.log(`Products not found in database: ${totalNotFound}`)
    console.log(`Errors: ${errors}`)
    console.log('='.repeat(80))

    if (errors > 0) {
      console.log('\n⚠️  Some vendors had errors. Check the output above for details.')
    } else {
      console.log('\n✅ All products processed successfully!')
    }

    // Print detailed results
    console.log('\n📋 DETAILED RESULTS:')
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Vendor: ${result.vendorName}`)
      if (result.success) {
        console.log(`   Series: ${result.seriesName} (${result.seriesId})`)
        console.log(`   Added: ${result.productsAdded}`)
        console.log(`   Skipped: ${result.productsSkipped}`)
        console.log(`   Total: ${result.totalProducts}`)
      } else {
        console.log(`   Error: ${result.error}`)
        if (result.productsSkipped) {
          console.log(`   Skipped: ${result.productsSkipped} products`)
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

addKickstarterCollectionTo2023Edition()

