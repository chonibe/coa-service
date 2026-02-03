#!/usr/bin/env node

/**
 * Google Ads Conversion Setup Helper
 *
 * This script helps you configure Google Ads conversions for your Shopify events.
 * Run this script to get the exact steps and code snippets for setting up conversions.
 */

const CONVERSIONS = {
  'purchase': {
    name: 'Purchase',
    category: 'Purchase',
    description: 'When a customer completes a purchase',
    value: 'Use different values for each conversion',
    currency: 'USD'
  },
  'add_to_cart': {
    name: 'Add to Cart',
    category: 'Add to cart',
    description: 'When a customer adds items to their cart',
    value: 'Use the value of the product added'
  },
  'begin_checkout': {
    name: 'Begin Checkout',
    category: 'Begin checkout',
    description: 'When a customer starts the checkout process',
    value: 'Use the order value'
  },
  'view_item': {
    name: 'Product View',
    category: 'Custom',
    description: 'When a customer views a product page',
    value: 'Don\'t use a value'
  },
  'search': {
    name: 'Search',
    category: 'Custom',
    description: 'When a customer performs a search',
    value: 'Don\'t use a value'
  },
  'page_view': {
    name: 'Page View',
    category: 'Page view',
    description: 'When a customer views any page',
    value: 'Don\'t use a value'
  }
}

function printSetupInstructions() {
  console.log('🚀 Google Ads Conversion Setup for Art Marketplace\n')
  console.log('Follow these steps to set up conversions in Google Ads:\n')

  console.log('1️⃣  Access Google Ads Conversion Setup')
  console.log('   • Go to Google Ads → Tools & Settings → Measurement → Conversions')
  console.log('   • Click "New conversion action"\n')

  console.log('2️⃣  Create Each Conversion Action\n')

  Object.entries(CONVERSIONS).forEach(([eventName, config]) => {
    console.log(`📊 ${config.name} Conversion:`)
    console.log(`   • Name: ${config.name}`)
    console.log(`   • Category: ${config.category}`)
    console.log(`   • Description: ${config.description}`)
    console.log(`   • Attribution model: Data-driven (recommended)`)
    console.log(`   • Attribution window: 90 days (recommended)`)
    console.log(`   • Value: ${config.value}`)
    if (config.currency) {
      console.log(`   • Currency: ${config.currency}`)
    }
    console.log(`   • Click "Create and continue"\n`)
  })

  console.log('3️⃣  Get Conversion IDs and Labels\n')
  console.log('   After creating each conversion, note down:')
  console.log('   • Conversion ID (starts with AW-)')
  console.log('   • Conversion Label (alphanumeric string)\n')

  console.log('4️⃣  Update Conversion Configuration\n')
  console.log('   Update lib/google-ads-conversions.ts with your conversion IDs and labels:\n')

  console.log('   ```typescript')
  console.log('   export const SHOPIFY_CONVERSIONS: Record<string, GoogleAdsConversion> = {')
  Object.keys(CONVERSIONS).forEach(eventName => {
    console.log(`     '${eventName}': {`)
    console.log(`       conversionId: 'AW-YOUR_CONVERSION_ID',`)
    console.log(`       conversionLabel: 'YOUR_CONVERSION_LABEL',`)
    console.log(`       name: '${CONVERSIONS[eventName].name}',`)
    console.log(`       category: '${CONVERSIONS[eventName].category.toUpperCase().replace(' ', '_')}'`)
    console.log(`     },`)
  })
  console.log('   }')
  console.log('   ```\n')

  console.log('5️⃣  Enable Enhanced Conversions (Recommended)\n')
  console.log('   • In Google Ads, go to Conversions')
  console.log('   • Click on your Purchase conversion')
  console.log('   • Enable "Enhanced conversions"')
  console.log('   • Choose "API or server-side integration"')
  console.log('   • This improves conversion measurement by sending hashed customer data\n')

  console.log('6️⃣  Test Your Setup\n')
  console.log('   • Run: npm run test:ga4-conversions')
  console.log('   • Check Google Ads for conversion data within 24 hours')
  console.log('   • Verify conversions appear in your campaign reports\n')

  console.log('💡 Pro Tips:')
  console.log('   • Use Data-driven attribution for better optimization')
  console.log('   • Set up conversion value rules for different product types')
  console.log('   • Monitor conversion lag - some conversions take time to attribute')
  console.log('   • Use conversion segments in your reports to analyze performance\n')

  console.log('📈 Expected Results:')
  console.log('   • Better ad optimization with more conversion data')
  console.log('   • Improved ROAS (Return on Ad Spend)')
  console.log('   • More accurate customer journey insights')
  console.log('   • Better targeting for high-value customer segments\n')
}

function printConversionCode() {
  console.log('\n📝 Conversion Tracking Code Examples:\n')

  console.log('// Purchase Conversion')
  console.log('gtag(\'event\', \'conversion\', {')
  console.log('  send_to: \'AW-CONVERSION_ID/CONVERSION_LABEL\',')
  console.log('  value: 99.99,')
  console.log('  currency: \'USD\',')
  console.log('  transaction_id: \'ORDER123\'')
  console.log('})\n')

  console.log('// Add to Cart Conversion')
  console.log('gtag(\'event\', \'conversion\', {')
  console.log('  send_to: \'AW-CONVERSION_ID/CONVERSION_LABEL\',')
  console.log('  value: 49.99,')
  console.log('  currency: \'USD\'')
  console.log('})\n')

  console.log('// Enhanced Conversion (with customer data)')
  console.log('gtag(\'event\', \'conversion\', {')
  console.log('  send_to: \'AW-CONVERSION_ID/CONVERSION_LABEL\',')
  console.log('  value: 99.99,')
  console.log('  currency: \'USD\',')
  console.log('  // Enhanced conversion parameters')
  console.log('  email: \'hashed_email_address\',')
  console.log('  phone_number: \'hashed_phone_number\',')
  console.log('  address: {')
  console.log('    first_name: \'hashed_first_name\',')
  console.log('    last_name: \'hashed_last_name\',')
  console.log('    street: \'hashed_street_address\',')
  console.log('    city: \'hashed_city\',')
  console.log('    region: \'hashed_region\',')
  console.log('    postal_code: \'hashed_postal_code\',')
  console.log('    country: \'hashed_country\'')
  console.log('  }')
  console.log('})\n')
}

function printTroubleshooting() {
  console.log('\n🔧 Troubleshooting:\n')

  console.log('❌ Conversions not showing in Google Ads:')
  console.log('   • Wait 24-48 hours after setup')
  console.log('   • Check that conversion labels match exactly')
  console.log('   • Verify gtag events are firing (check browser console)')
  console.log('   • Ensure conversions are enabled and not paused\n')

  console.log('❌ Conversion values are wrong:')
  console.log('   • Check that value parameter is a number, not a string')
  console.log('   • Verify currency codes are correct (USD, EUR, etc.)')
  console.log('   • Ensure transaction_id is unique per conversion\n')

  console.log('❌ Enhanced conversions not working:')
  console.log('   • Hash customer data properly (SHA256)')
  console.log('   • Ensure you have consent for data collection')
  console.log('   • Check that enhanced conversions are enabled in Google Ads\n')
}

// Main execution
if (require.main === module) {
  printSetupInstructions()
  printConversionCode()
  printTroubleshooting()

  console.log('\n🎯 Ready to set up Google Ads conversions?')
  console.log('Run this script anytime with: node scripts/setup-google-ads-conversions.js\n')
}

module.exports = {
  CONVERSIONS,
  printSetupInstructions,
  printConversionCode,
  printTroubleshooting
}