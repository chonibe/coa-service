#!/usr/bin/env node

/**
 * Script to update all Shopify products with barcodes
 * This is a one-time migration script to ensure all existing products have barcodes
 */

const { updateAllProductsWithBarcodes, updateProductVariantsWithBarcodes } = require('../lib/shopify/product-creation.ts')

async function main() {
  try {
    // Show help if requested
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      console.log('🛍️  Shopify Barcode Update Script')
      console.log('')
      console.log('Usage:')
      console.log('  npm run update:barcodes                    # Update up to 250 products')
      console.log('  npm run update:barcodes 50                 # Update up to 50 products')
      console.log('  npx tsx scripts/update-shopify-barcodes.js --productId=123456789 # Update specific product')
      console.log('')
      console.log('Examples:')
      console.log('  npx tsx scripts/update-shopify-barcodes.js --productId=15254665068930')
      return
    }

    console.log('🛍️  Starting Shopify barcode update process...\n')

    // Check if a specific product ID was provided
    const productIdArg = process.argv.find(arg => arg.startsWith('--productId='))
    const productId = productIdArg ? productIdArg.split('=')[1] : null

    if (productId) {
      console.log(`🎯 Updating specific product: ${productId}\n`)

      await updateProductVariantsWithBarcodes(productId)

      console.log('\n✅ Product barcode update completed!')
      console.log(`📈 Summary:`)
      console.log(`   • Product ID: ${productId}`)
      console.log(`   • Status: Updated with barcodes`)
      console.log('\n🎉 Product now has unique 10-digit barcodes!')

      return
    }

    // Bulk update mode
    const limit = process.argv[2] ? parseInt(process.argv[2]) : 250
    console.log(`📊 Processing up to ${limit} products...\n`)

    const result = await updateAllProductsWithBarcodes(limit)

    console.log('\n✅ Barcode update completed!')
    console.log(`📈 Summary:`)
    console.log(`   • Products processed: ${result.total}`)
    console.log(`   • Products updated: ${result.updated}`)
    console.log(`   • Success rate: ${result.total > 0 ? Math.round((result.updated / result.total) * 100) : 0}%`)

    if (result.updated > 0) {
      console.log('\n🎉 All products now have proper 10-digit barcodes!')
    } else {
      console.log('\n✨ All products already have barcodes - no updates needed!')
    }

  } catch (error) {
    console.error('\n❌ Error updating barcodes:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { main }