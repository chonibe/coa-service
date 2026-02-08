/**
 * List All Metaobjects
 * 
 * This script lists all metaobjects of type homepage_banner_video
 * Run: node scripts/list-metaobjects.js
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

async function listMetaobjects() {
  console.log('🔍 Listing metaobjects...\n')
  console.log(`Shop: ${SHOP}`)
  console.log(`API Version: ${API_VERSION}\n`)

  const query = `
    query ListMetaobjects($type: String!) {
      metaobjects(type: $type, first: 10) {
        edges {
          node {
            id
            type
            handle
            fields {
              key
              value
              type
              reference {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                  }
                }
                ... on Video {
                  id
                  alt
                  sources {
                    url
                    mimeType
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const result = await storefrontQuery(query, {
      type: 'homepage_banner_video',
    })

    if (result.errors) {
      console.log('❌ GraphQL Error:', result.errors[0].message)
      console.log('\nFull error:', JSON.stringify(result.errors, null, 2))
      
      if (result.errors[0].message.includes('access')) {
        console.log('\n⚠️  Storefront API Scope Issue Detected!')
        console.log('\n📋 To fix:')
        console.log('1. Go to Shopify Admin > Settings > Apps and sales channels')
        console.log('2. Click on your custom app (or "Develop apps")')
        console.log('3. Click "Configuration"')
        console.log('4. Under "Storefront API access scopes", ensure these are checked:')
        console.log('   ✓ unauthenticated_read_metaobjects')
        console.log('   ✓ unauthenticated_read_content')
        console.log('5. Save, then click "Install app" again')
        console.log('6. Copy the new Storefront Access Token')
        console.log('7. Update NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN in .env.local')
      }
      return
    }

    if (!result.data || !result.data.metaobjects) {
      console.log('❌ No metaobjects data returned')
      console.log('\nResponse:', JSON.stringify(result, null, 2))
      return
    }

    const edges = result.data.metaobjects.edges

    if (edges.length === 0) {
      console.log('❌ No metaobjects found of type "homepage_banner_video"')
      console.log('\n📋 Troubleshooting:')
      console.log('1. Check Shopify Admin > Content > Metaobjects')
      console.log('2. Make sure "Homepage Banner Video" exists')
      console.log('3. Make sure you have created at least one entry')
      console.log('4. Make sure the entry is published/active')
      console.log('\n5. Check Storefront API scopes (see above)')
      return
    }

    console.log(`✅ Found ${edges.length} metaobject(s):\n`)

    edges.forEach((edge, index) => {
      const metaobject = edge.node
      console.log(`━━━ Metaobject #${index + 1} ━━━`)
      console.log(`ID: ${metaobject.id}`)
      console.log(`Type: ${metaobject.type}`)
      console.log(`Handle: ${metaobject.handle}`)
      console.log('\nFields:')
      metaobject.fields.forEach(field => {
        let value = field.value && field.value.length > 100 
          ? field.value.substring(0, 100) + '...' 
          : field.value
        
        // Show file reference URL if available
        if (field.reference) {
          if (field.reference.sources && field.reference.sources.length > 0) {
            value = `${value} → VIDEO: ${field.reference.sources[0].url}`
          } else if (field.reference.image && field.reference.image.url) {
            value = `${value} → IMAGE: ${field.reference.image.url}`
          }
        }
        
        console.log(`  - ${field.key} (${field.type}): ${value || '(empty)'}`)
      })
      console.log('')
    })

    console.log('\n✅ SUCCESS! To use the first one, update your code:')
    console.log(`   const METAOBJECT_HANDLE = '${edges[0].node.handle}'`)

  } catch (error) {
    console.error('❌ Script error:', error.message)
    console.error('\nFull error:', error)
  }
}

listMetaobjects().catch(error => {
  console.error('\n❌ Script failed:', error)
  process.exit(1)
})
