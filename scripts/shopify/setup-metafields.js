/**
 * Setup Homepage Metafields via Shopify Admin API
 * 
 * This script creates metafield definitions for the homepage settings page.
 * 
 * Requirements:
 * - SHOPIFY_ADMIN_ACCESS_TOKEN environment variable
 * - SHOPIFY_SHOP environment variable (e.g., 'your-store.myshopify.com')
 * 
 * Run: node scripts/shopify/setup-metafields.js
 */

const https = require('https')

// =============================================================================
// CONFIGURATION
// =============================================================================

const SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

if (!SHOP || !ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables:')
  console.error('   - SHOPIFY_SHOP (e.g., your-store.myshopify.com)')
  console.error('   - SHOPIFY_ADMIN_ACCESS_TOKEN')
  console.error('')
  console.error('Add these to your .env file')
  process.exit(1)
}

const API_VERSION = '2024-01'
const API_URL = `/admin/api/${API_VERSION}/graphql.json`

// =============================================================================
// METAFIELD DEFINITIONS
// =============================================================================

const metafieldDefinitions = [
  {
    name: 'Hero Video URL',
    namespace: 'custom',
    key: 'hero_video_url',
    description: 'Main homepage hero video URL (MP4 or MOV from Shopify CDN)',
    type: 'single_line_text_field',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Video Poster',
    namespace: 'custom',
    key: 'hero_video_poster',
    description: 'Poster image shown before video loads',
    type: 'file_reference',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Video Settings',
    namespace: 'custom',
    key: 'hero_video_settings',
    description: 'Video playback settings (JSON: {autoplay, loop, muted})',
    type: 'json',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Headline',
    namespace: 'custom',
    key: 'hero_headline',
    description: 'Main headline text displayed on hero video',
    type: 'single_line_text_field',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Subheadline',
    namespace: 'custom',
    key: 'hero_subheadline',
    description: 'Subheadline text below main headline',
    type: 'single_line_text_field',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero CTA Text',
    namespace: 'custom',
    key: 'hero_cta_text',
    description: 'Call-to-action button text',
    type: 'single_line_text_field',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero CTA URL',
    namespace: 'custom',
    key: 'hero_cta_url',
    description: 'Button link destination',
    type: 'url',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Text Color',
    namespace: 'custom',
    key: 'hero_text_color',
    description: 'Text color (hex code, e.g., #ffffff)',
    type: 'color',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Overlay Color',
    namespace: 'custom',
    key: 'hero_overlay_color',
    description: 'Overlay color (hex code, e.g., #000000)',
    type: 'color',
    ownerType: 'PAGE',
  },
  {
    name: 'Hero Overlay Opacity',
    namespace: 'custom',
    key: 'hero_overlay_opacity',
    description: 'Overlay opacity (0-100)',
    type: 'number_integer',
    ownerType: 'PAGE',
    validations: [
      {
        name: 'min',
        value: '0',
      },
      {
        name: 'max',
        value: '100',
      },
    ],
  },
]

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Make GraphQL request to Shopify Admin API
 */
function shopifyAdminRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables })

    const options = {
      hostname: SHOP,
      path: API_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Length': data.length,
      },
    }

    const req = https.request(options, (res) => {
      let body = ''

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          if (json.errors) {
            reject(new Error(JSON.stringify(json.errors, null, 2)))
          } else {
            resolve(json.data)
          }
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

/**
 * Create a metafield definition
 */
async function createMetafieldDefinition(definition) {
  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    definition: {
      name: definition.name,
      namespace: definition.namespace,
      key: definition.key,
      description: definition.description,
      type: definition.type,
      ownerType: definition.ownerType,
      validations: definition.validations || [],
    },
  }

  return await shopifyAdminRequest(mutation, variables)
}

/**
 * Create the homepage-settings page
 */
async function createHomepagePage() {
  const mutation = `
    mutation CreatePage($input: PageInput!) {
      pageCreate(page: $input) {
        page {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      title: 'Homepage Settings',
      handle: 'homepage-settings',
      body: '<p>This page stores metafields for homepage content (video URL, hero text, etc.)</p><p><strong>Do not delete this page.</strong> It is used by the frontend to fetch dynamic homepage content.</p>',
      isPublished: false, // Keep it hidden
    },
  }

  return await shopifyAdminRequest(mutation, variables)
}

// =============================================================================
// MAIN SCRIPT
// =============================================================================

async function main() {
  console.log('🚀 Setting up homepage metafields...\n')
  console.log(`Shop: ${SHOP}`)
  console.log(`API Version: ${API_VERSION}\n`)

  let successCount = 0
  let errorCount = 0

  // Create metafield definitions
  console.log('📝 Creating metafield definitions...\n')

  for (const definition of metafieldDefinitions) {
    try {
      const result = await createMetafieldDefinition(definition)

      if (result.metafieldDefinitionCreate.userErrors.length > 0) {
        const errors = result.metafieldDefinitionCreate.userErrors
        console.log(`⚠️  ${definition.name}: ${errors[0].message}`)
        
        // Check if error is "already exists"
        if (errors[0].message.includes('already exists') || errors[0].message.includes('Taken')) {
          console.log(`   (Metafield already exists, skipping...)\n`)
        } else {
          errorCount++
        }
      } else {
        console.log(`✅ Created: ${definition.name} (${definition.namespace}.${definition.key})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ Failed to create ${definition.name}:`, error.message)
      errorCount++
    }
  }

  // Create homepage-settings page
  console.log('\n📄 Creating homepage-settings page...\n')

  try {
    const result = await createHomepagePage()

    if (result.pageCreate.userErrors.length > 0) {
      const errors = result.pageCreate.userErrors
      console.log(`⚠️  ${errors[0].message}`)
      
      if (errors[0].message.includes('already') || errors[0].message.includes('taken')) {
        console.log('   (Page already exists, skipping...)\n')
      }
    } else {
      console.log(`✅ Created page: ${result.pageCreate.page.title}`)
      console.log(`   Handle: ${result.pageCreate.page.handle}`)
      console.log(`   ID: ${result.pageCreate.page.id}\n`)
    }
  } catch (error) {
    console.error('❌ Failed to create page:', error.message)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary')
  console.log('='.repeat(50))
  console.log(`✅ Metafield definitions created: ${successCount}`)
  if (errorCount > 0) {
    console.log(`⚠️  Errors/Skipped: ${errorCount}`)
  }
  console.log('')
  console.log('🎉 Setup complete!')
  console.log('')
  console.log('📋 Next Steps:')
  console.log('1. Go to Shopify Admin > Online Store > Pages')
  console.log('2. Open "Homepage Settings" page')
  console.log('3. Scroll to Metafields section')
  console.log('4. Fill in the values (especially hero_video_url)')
  console.log('5. Save the page')
  console.log('6. Refresh your homepage to see changes!')
  console.log('')
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
