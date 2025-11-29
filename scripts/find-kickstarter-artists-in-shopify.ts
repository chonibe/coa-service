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
    console.log(`📄 Loaded env from: ${envPath}`)
    break
  }
}

// Also load from process.env (for Vercel/production)
dotenv.config()

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN

console.log('Environment check:')
console.log(`  SHOPIFY_SHOP: ${SHOPIFY_SHOP ? '✅' : '❌'}`)
console.log(`  SHOPIFY_ACCESS_TOKEN: ${SHOPIFY_ACCESS_TOKEN ? '✅ (hidden)' : '❌'}`)

if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error('\n❌ Missing required environment variables')
  console.error('   Required: SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN')
  console.error('   Or: NEXT_PUBLIC_SHOPIFY_SHOP and NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN')
  process.exit(1)
}

async function findKickstarterArtistsInShopify() {
  try {
    console.log('🔍 Searching Shopify for products with "Kickstarter Artists" tag...\n')

    let allProducts: any[] = []
    let nextCursor: string | null = null
    let pageCount = 0

    do {
      pageCount++
      // Construct the URL with tag filter
      let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products.json?limit=250&tag=${encodeURIComponent('Kickstarter Artists')}`

      // Add cursor for pagination if we have one
      if (nextCursor) {
        url += `&page_info=${nextCursor}`
      }

      console.log(`📄 Fetching page ${pageCount}...`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch products: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      if (data.products && data.products.length > 0) {
        allProducts = [...allProducts, ...data.products]
        console.log(`   ✅ Found ${data.products.length} products on this page`)
      } else {
        console.log(`   ℹ️  No products found on this page`)
      }

      // Check for next page
      nextCursor = null
      const linkHeader = response.headers.get('Link')

      if (linkHeader) {
        const links = linkHeader.split(',')
        for (const link of links) {
          const [url, rel] = link.split(';')
          if (rel.includes('rel="next"')) {
            const match = url.match(/page_info=([^&>]+)/)
            if (match && match[1]) {
              nextCursor = match[1]
            }
          }
        }
      }

      // Safety limit
      if (pageCount > 10) {
        console.log('⚠️  Reached page limit (10 pages), stopping...')
        break
      }
    } while (nextCursor)

    console.log(`\n📊 Total products found: ${allProducts.length}\n`)

    if (allProducts.length === 0) {
      console.log('❌ No products found with "Kickstarter Artists" tag in Shopify')
      console.log('\n💡 Trying alternative search methods...\n')
      
      // Try searching for products with "Kickstarter" in tags
      await searchForKickstarterVariations()
      return
    }

    // Display products
    console.log('🎨 Products with "Kickstarter Artists" tag:\n')
    console.log('='.repeat(80))
    
    allProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Handle: ${product.handle}`)
      console.log(`   Vendor: ${product.vendor}`)
      console.log(`   Tags: ${product.tags || '(none)'}`)
      console.log(`   Status: ${product.status}`)
      if (product.variants && product.variants.length > 0) {
        console.log(`   Price: ${product.variants[0].price} ${product.variants[0].currency || 'USD'}`)
      }
      if (product.images && product.images.length > 0) {
        console.log(`   Image: ${product.images[0].src}`)
      }
    })

    console.log('\n' + '='.repeat(80))
    console.log(`\n✅ Found ${allProducts.length} product(s) with "Kickstarter Artists" tag`)

    // Group by vendor
    const productsByVendor = new Map<string, typeof allProducts>()
    for (const product of allProducts) {
      const vendor = product.vendor || 'Unknown'
      if (!productsByVendor.has(vendor)) {
        productsByVendor.set(vendor, [])
      }
      productsByVendor.get(vendor)!.push(product)
    }

    console.log(`\n📦 Products by vendor:`)
    for (const [vendor, products] of productsByVendor.entries()) {
      console.log(`   ${vendor}: ${products.length} product(s)`)
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

async function searchForKickstarterVariations() {
  try {
    console.log('🔍 Searching for variations of "Kickstarter" tag...\n')

    const variations = [
      'Kickstarter Artists',
      'Kickstarter',
      'Kickstarter Artist',
      'kickstarter artists',
      'KICKSTARTER ARTISTS'
    ]

    for (const tag of variations) {
      let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products.json?limit=10&tag=${encodeURIComponent(tag)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.products && data.products.length > 0) {
          console.log(`✅ Found ${data.products.length} product(s) with tag "${tag}"`)
          data.products.forEach((p: any) => {
            console.log(`   - ${p.title} (${p.id})`)
            console.log(`     Tags: ${p.tags || '(none)'}`)
          })
        }
      }
    }

    // Also try GraphQL query
    console.log('\n🔍 Trying GraphQL query...\n')
    
    const graphqlQuery = `
      {
        products(first: 250, query: "tag:Kickstarter") {
          edges {
            node {
              id
              title
              handle
              vendor
              tags
              status
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
      if (graphqlData.data && graphqlData.data.products && graphqlData.data.products.edges.length > 0) {
        console.log(`✅ Found ${graphqlData.data.products.edges.length} product(s) with "Kickstarter" in tags via GraphQL`)
        graphqlData.data.products.edges.forEach((edge: any) => {
          const product = edge.node
          console.log(`   - ${product.title} (${product.id})`)
          console.log(`     Tags: ${product.tags.join(', ')}`)
          console.log(`     Vendor: ${product.vendor}`)
        })
      } else {
        console.log('❌ No products found with "Kickstarter" tag via GraphQL')
      }
    }

  } catch (error: any) {
    console.error('❌ Error in alternative search:', error.message)
  }
}

findKickstarterArtistsInShopify()

