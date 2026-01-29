#!/usr/bin/env node

/**
 * Script to register Shopify product webhooks
 * This ensures automatic barcode assignment when products are created in Shopify
 */

const { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } = require('../lib/env.ts')

async function registerShopifyProductWebhook() {
  try {
    console.log('🛍️  Registering Shopify Product Webhook...\n')

    if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
      console.error('❌ Missing Shopify credentials. Please ensure SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN are configured.')
      process.exit(1)
    }

    // Determine the webhook URL based on environment
    const isProduction = process.env.NODE_ENV === 'production'
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (isProduction ? 'https://your-production-domain.com' : 'http://localhost:3000')

    const webhookUrl = `${baseUrl}/api/webhooks/shopify/products`

    console.log(`📍 Webhook URL: ${webhookUrl}`)
    console.log(`🏪 Shopify Shop: ${SHOPIFY_SHOP}`)
    console.log()

    // Check existing webhooks
    console.log('🔍 Checking existing webhooks...')
    const existingResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/webhooks.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    })

    if (!existingResponse.ok) {
      throw new Error(`Failed to fetch existing webhooks: ${existingResponse.status}`)
    }

    const existingData = await existingResponse.json()
    const existingWebhooks = existingData.webhooks || []

    // Check if product webhook already exists
    const existingProductWebhook = existingWebhooks.find(
      (webhook) => webhook.topic === 'products/create' && webhook.address === webhookUrl
    )

    if (existingProductWebhook) {
      console.log('✅ Product creation webhook already exists!')
      console.log(`   ID: ${existingProductWebhook.id}`)
      console.log(`   Topic: ${existingProductWebhook.topic}`)
      console.log(`   URL: ${existingProductWebhook.address}`)
      console.log()

      // Also check for product update webhook
      const existingUpdateWebhook = existingWebhooks.find(
        (webhook) => webhook.topic === 'products/update' && webhook.address === webhookUrl
      )

      if (!existingUpdateWebhook) {
        console.log('📝 Product update webhook not found, registering...')
        await registerWebhook('products/update', webhookUrl)
      } else {
        console.log('✅ Product update webhook already exists!')
      }

      return
    }

    // Register the product creation webhook
    console.log('📝 Registering product creation webhook...')
    await registerWebhook('products/create', webhookUrl)

    // Also register product update webhook
    console.log('📝 Registering product update webhook...')
    await registerWebhook('products/update', webhookUrl)

    console.log('\n🎉 Shopify product webhooks registered successfully!')
    console.log('All new products created in Shopify will automatically receive barcodes.')

  } catch (error) {
    console.error('\n❌ Error registering Shopify webhook:', error.message)
    console.log('\n💡 Make sure:')
    console.log('   • SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN are configured')
    console.log('   • Your Vercel deployment is accessible')
    console.log('   • The webhook endpoint is deployed')
    process.exit(1)
  }
}

async function registerWebhook(topic, webhookUrl) {
  const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-01/webhooks.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      webhook: {
        topic: topic,
        address: webhookUrl,
        format: 'json'
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to register ${topic} webhook: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const webhook = data.webhook

  console.log(`   ✅ Registered ${topic} webhook`)
  console.log(`      ID: ${webhook.id}`)
  console.log(`      Topic: ${webhook.topic}`)
  console.log(`      URL: ${webhook.address}`)
}

if (require.main === module) {
  registerShopifyProductWebhook()
}

module.exports = { registerShopifyProductWebhook }