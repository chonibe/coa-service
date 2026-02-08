/**
 * Test Metaobject Connection
 * 
 * This script tests if we can fetch your homepage metaobject from Shopify.
 * Run: node scripts/test-metaobject.js
 */

const https = require('https')

// Load environment variables
require('dotenv').config()

const SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

if (!SHOP || !STOREFRONT_TOKEN) {
  console.error('❌ Missing environment variables:')
  console.error('   - SHOPIFY_SHOP')
  console.error('   - NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN')
  process.exit(1)
}

const API_VERSION = '2024-01'

function storefrontQuery(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables })

    const options = {
      hostname: SHOP,
      path: `/api/${API_VERSION}/graphql.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        'Content-Length': data.length,
      },
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error)
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function testMetaobject() {
  console.log('🔍 Testing metaobject connection...\n')
  console.log(`Shop: ${SHOP}`)
  console.log(`API Version: ${API_VERSION}\n`)

  // Try different handle variations
  const variations = [
    'video-banner-hero',
    'video_banner_hero',
    'videobannerhero',
    'video-banner-1',
    'video_banner_1',
  ]

  for (const handle of variations) {
    console.log(`\n━━━ Testing handle: "${handle}" ━━━`)
    
    const query = `
      query GetMetaobject($type: String!, $handle: String!) {
        metaobject(handle: {type: $type, handle: $handle}) {
          id
          type
          handle
          displayName
          fields {
            key
            value
            type
          }
        }
      }
    `

    try {
      const result = await storefrontQuery(query, {
        type: 'homepage_banner_video',
        handle: handle,
      })

      if (result.errors) {
        console.log('❌ Error:', result.errors[0].message)
        continue
      }

      if (result.data.metaobject) {
        console.log('✅ FOUND!')
        console.log('\nMetaobject Details:')
        console.log('  ID:', result.data.metaobject.id)
        console.log('  Type:', result.data.metaobject.type)
        console.log('  Handle:', result.data.metaobject.handle)
        console.log('  Display Name:', result.data.metaobject.displayName || 'N/A')
        console.log('\nFields:')
        result.data.metaobject.fields.forEach(field => {
          const value = field.value.length > 100 ? field.value.substring(0, 100) + '...' : field.value
          console.log(`  - ${field.key} (${field.type}): ${value}`)
        })
        
        console.log('\n✅ SUCCESS! Update your code to use this handle:')
        console.log(`   const METAOBJECT_HANDLE = '${result.data.metaobject.handle}'`)
        return
      } else {
        console.log('❌ Not found')
      }
    } catch (error) {
      console.log('❌ Error:', error.message)
    }
  }

  console.log('\n\n❌ Could not find metaobject with any handle variation')
  console.log('\n📋 Troubleshooting:')
  console.log('1. Check Shopify Admin > Content > Metaobjects')
  console.log('2. Find "Homepage Banner Video"')
  console.log('3. Click on an entry (e.g., "Video Banner Hero")')
  console.log('4. Look at the URL - the handle is at the end:')
  console.log('   ...metaobjects/homepage_banner_video/THE-HANDLE-IS-HERE')
  console.log('\n5. Check Storefront API scopes include:')
  console.log('   - unauthenticated_read_metaobjects')
  console.log('   - unauthenticated_read_content')
}

testMetaobject().catch(error => {
  console.error('\n❌ Script failed:', error)
  process.exit(1)
})
