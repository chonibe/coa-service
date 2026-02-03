#!/usr/bin/env node

/**
 * Test Google Ads Conversion Tracking
 *
 * This script tests that Google Ads conversions are properly configured
 * and that events are being sent with the correct conversion parameters.
 */

require('dotenv').config({ path: '.env.local' })

const { SHOPIFY_CONVERSIONS, getConversionConfig } = require('../lib/google-ads-conversions.ts')

async function testConversionConfiguration() {
  console.log('🧪 Testing Google Ads Conversion Configuration\n')

  const events = ['purchase', 'add_to_cart', 'begin_checkout', 'view_item', 'search', 'page_view']
  let passed = 0
  let failed = 0

  console.log('📋 Checking conversion configurations...\n')

  for (const eventName of events) {
    const config = getConversionConfig(eventName)

    if (!config) {
      console.log(`❌ ${eventName}: No conversion configuration found`)
      failed++
      continue
    }

    // Check if conversion ID and label are properly set (not placeholder values)
    const hasValidId = config.conversionId && !config.conversionId.includes('XXXXXXXXX')
    const hasValidLabel = config.conversionLabel && !config.conversionLabel.includes('XXXXXXXXXXXXX')

    if (hasValidId && hasValidLabel) {
      console.log(`✅ ${eventName}: Properly configured`)
      console.log(`   ID: ${config.conversionId}`)
      console.log(`   Label: ${config.conversionLabel}`)
      passed++
    } else {
      console.log(`⚠️  ${eventName}: Using placeholder values`)
      console.log(`   ID: ${config.conversionId}`)
      console.log(`   Label: ${config.conversionLabel}`)
      failed++
    }
    console.log('')
  }

  console.log(`📊 Configuration Test Results:`)
  console.log(`   ✅ Properly configured: ${passed}`)
  console.log(`   ❌ Needs setup: ${failed}\n`)

  if (failed > 0) {
    console.log('🚨 Action Required:')
    console.log('   1. Go to Google Ads → Tools & Settings → Measurement → Conversions')
    console.log('   2. Create conversion actions for the events listed above')
    console.log('   3. Update lib/google-ads-conversions.ts with real conversion IDs and labels')
    console.log('   4. Run this test again\n')
  }

  return failed === 0
}

async function testConversionTracking() {
  console.log('🔄 Testing Conversion Tracking Functions\n')

  // Mock gtag function for testing
  global.gtag = (...args) => {
    console.log('📤 gtag event:', JSON.stringify(args, null, 2))
  }

  const { trackEventWithConversion } = require('../lib/google-ads-conversions')

  const testEvents = [
    {
      name: 'purchase',
      params: {
        transaction_id: 'TEST123',
        value: 99.99,
        currency: 'USD',
        items: [{ item_id: '1', item_name: 'Test Product' }]
      }
    },
    {
      name: 'add_to_cart',
      params: {
        currency: 'USD',
        value: 49.99,
        items: [{ item_id: '1', item_name: 'Test Product' }]
      }
    }
  ]

  for (const testEvent of testEvents) {
    console.log(`Testing ${testEvent.name} event...`)
    try {
      trackEventWithConversion(testEvent.name, testEvent.params)
      console.log(`✅ ${testEvent.name} event tracked successfully\n`)
    } catch (error) {
      console.log(`❌ ${testEvent.name} event failed: ${error.message}\n`)
    }
  }
}

async function testShopifyAnalytics() {
  console.log('🛒 Testing Shopify Analytics Integration\n')

  // Mock gtag function
  global.gtag = (...args) => {
    console.log('📤 Shopify gtag event:', JSON.stringify(args, null, 2))
  }

  const {
    trackShopifyPurchase,
    trackShopifyAddToCart,
    trackShopifyBeginCheckout,
    transformShopifyProduct
  } = require('../lib/shopify-analytics')

  // Test data
  const mockProduct = {
    id: '123',
    title: 'Test Artwork',
    vendor: 'Test Artist',
    product_type: 'Print',
    variants: [{ id: '456', price: '49.99' }]
  }

  const mockLineItem = {
    id: '789',
    product_id: '123',
    title: 'Test Artwork',
    vendor: 'Test Artist',
    product_type: 'Print',
    quantity: 1,
    price: '49.99'
  }

  console.log('Testing purchase tracking...')
  trackShopifyPurchase('ORDER123', [mockLineItem], 49.99, 5.99, 4.50)

  console.log('\nTesting add to cart tracking...')
  trackShopifyAddToCart(mockProduct)

  console.log('\nTesting begin checkout tracking...')
  trackShopifyBeginCheckout([mockLineItem])

  console.log('\n✅ Shopify analytics integration test completed\n')
}

async function runAllTests() {
  console.log('🚀 Running Google Ads Conversion Tests\n')
  console.log('='.repeat(50))

  const configOk = await testConversionConfiguration()

  if (configOk) {
    await testConversionTracking()
    await testShopifyAnalytics()

    console.log('='.repeat(50))
    console.log('🎉 All tests completed!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Deploy the updated code')
    console.log('   2. Test conversions in a staging environment')
    console.log('   3. Monitor Google Ads for conversion data (24-48 hours)')
    console.log('   4. Set up conversion value rules in Google Ads for better optimization')
  } else {
    console.log('❌ Configuration issues found. Please fix before proceeding.')
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testConversionConfiguration,
  testConversionTracking,
  testShopifyAnalytics,
  runAllTests
}